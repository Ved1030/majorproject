#!/usr/bin/env python3
"""
Persistent Background Removal Worker
Runs as a long-lived process that keeps the rembg model loaded in memory.
Communicates via JSON lines over stdin/stdout.
"""

import sys
import os
import json
import platform
import traceback
import time
import io
from collections import deque
from importlib.metadata import version, PackageNotFoundError

try:
    from rembg import remove, new_session
    from rembg import session_factory
    REMBG_IMPORT_ERROR = None
except Exception as exc:
    remove = None
    new_session = None
    session_factory = None
    REMBG_IMPORT_ERROR = exc

try:
    from PIL import Image, ImageFilter
    PILLOW_IMPORT_ERROR = None
except Exception as exc:
    Image = None
    ImageFilter = None
    PILLOW_IMPORT_ERROR = exc

try:
    import numpy as np
    NUMPY_IMPORT_ERROR = None
except Exception as exc:
    np = None
    NUMPY_IMPORT_ERROR = exc

# Global session cache - model_name -> session
_session_cache = {}
_DEFAULT_MODEL = "isnet-general-use"

def log_timing(stage, details=None, request_id=None):
    """Log a timing event with stage name and optional details."""
    msg = {"type": "timing", "stage": stage, "timestamp": time.time()}
    if details:
        msg["details"] = details
    if request_id is not None:
        msg["request_id"] = request_id
    print(json.dumps(msg), flush=True)

def get_supported_models():
    """Get list of supported model names from rembg."""
    if session_factory is None:
        return []
    models = []
    for cls in session_factory.sessions_class:
        try:
            name = cls.name()
            if name:
                models.append(name)
        except Exception:
            pass
    return models

def check_environment():
    """Report the interpreter and dependency status without processing."""
    errors = []
    
    if REMBG_IMPORT_ERROR:
        errors.append(f"rembg import failed: {type(REMBG_IMPORT_ERROR).__name__}: {REMBG_IMPORT_ERROR}")
    
    if PILLOW_IMPORT_ERROR:
        errors.append(f"Pillow import failed: {type(PILLOW_IMPORT_ERROR).__name__}: {PILLOW_IMPORT_ERROR}")
    
    if NUMPY_IMPORT_ERROR:
        errors.append(f"NumPy import failed: {type(NUMPY_IMPORT_ERROR).__name__}: {NUMPY_IMPORT_ERROR}")
    
    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
        }

    try:
        rembg_version = version("rembg")
    except PackageNotFoundError:
        rembg_version = "unknown"

    try:
        pillow_version = version("pillow")
    except PackageNotFoundError:
        pillow_version = "unknown"

    try:
        numpy_version = version("numpy")
    except PackageNotFoundError:
        numpy_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "rembg_version": rembg_version,
        "pillow_version": pillow_version,
        "numpy_version": numpy_version,
        "supported_models": get_supported_models(),
    }

def get_session(model_name):
    """Get or create a session for the given model."""
    global _session_cache
    if model_name not in _session_cache:
        log_timing("model_loading_start", {"model": model_name})
        start = time.time()
        _session_cache[model_name] = new_session(model_name)
        elapsed = time.time() - start
        log_timing("model_loading_completed", {"model": model_name, "duration_sec": elapsed})
    return _session_cache[model_name]

def estimate_background_color(img_array, border_width=5):
    """Estimate the background color by sampling pixels from image borders."""
    h, w = img_array.shape[:2]
    
    border_pixels = []
    border_pixels.append(img_array[:border_width, :, :3])
    border_pixels.append(img_array[h-border_width:, :, :3])
    border_pixels.append(img_array[:, :border_width, :3])
    border_pixels.append(img_array[:, w-border_width:, :3])
    
    all_border = np.vstack([p.reshape(-1, 3) for p in border_pixels])
    median_color = np.median(all_border, axis=0).astype(np.float32)
    std_color = np.std(all_border, axis=0).astype(np.float32)
    
    return median_color, std_color

def color_distance(pixel, target_color):
    """Calculate Euclidean distance in RGB space."""
    return np.sqrt(np.sum((pixel.astype(np.float32) - target_color) ** 2, axis=-1))

def flood_fill_background(img_array, background_color, tolerance=30, max_distance=None):
    """Perform flood fill from image edges to find connected background pixels."""
    if max_distance is None:
        max_distance = tolerance
    
    h, w = img_array.shape[:2]
    rgb = img_array[:, :, :3]
    
    dist = color_distance(rgb, background_color)
    bg_mask = dist <= tolerance
    
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    for x in range(w):
        if bg_mask[0, x] and not visited[0, x]:
            queue.append((0, x))
            visited[0, x] = True
        if bg_mask[h-1, x] and not visited[h-1, x]:
            queue.append((h-1, x))
            visited[h-1, x] = True
    
    for y in range(h):
        if bg_mask[y, 0] and not visited[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if bg_mask[y, w-1] and not visited[y, w-1]:
            queue.append((y, w-1))
            visited[y, w-1] = True
    
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    while queue:
        y, x = queue.popleft()
        for dy, dx in directions:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if dist[ny, nx] <= max_distance:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
    
    return visited

def color_based_background_mask(img_array, background_color, tolerance=30):
    """Create a background mask based purely on color similarity."""
    h, w = img_array.shape[:2]
    rgb = img_array[:, :, :3]
    dist = color_distance(rgb, background_color)
    bg_mask = dist <= tolerance
    return bg_mask

def refine_alpha_mask(alpha_mask, feather_radius=1, erode_size=0):
    """Refine the alpha mask with feathering and optional erosion."""
    alpha = alpha_mask.astype(np.float32) * 255
    alpha = 255 - alpha
    
    if erode_size > 0:
        from scipy import ndimage
        fg_mask = (alpha > 128).astype(np.uint8)
        structure = np.ones((erode_size * 2 + 1, erode_size * 2 + 1))
        fg_mask = ndimage.binary_erosion(fg_mask, structure=structure).astype(np.uint8)
        alpha = fg_mask * 255
    
    if feather_radius > 0:
        from scipy import ndimage
        alpha = ndimage.gaussian_filter(alpha, sigma=feather_radius)
    
    alpha = np.clip(alpha, 0, 255)
    return alpha.astype(np.uint8)


def analyze_image_characteristics(img_array):
    """
    Analyze image to determine if it's a photograph or logo/graphic.
    
    Returns a dict with:
    - is_logo: bool - True if image appears to be a logo/graphic
    - confidence: float - 0-1 confidence score
    - characteristics: dict with detailed analysis
    """
    h, w = img_array.shape[:2]
    rgb = img_array[:, :, :3]
    
    # 1. Color diversity analysis
    pixels = rgb.reshape(-1, 3)
    if len(pixels) > 100000:
        indices = np.random.choice(len(pixels), 100000, replace=False)
        pixels = pixels[indices]
    
    unique_colors = len(np.unique(pixels.view(np.dtype((np.void, pixels.dtype.itemsize * 3)))))
    color_diversity = unique_colors / len(pixels)
    
    # 2. Edge sharpness analysis
    gray = np.mean(rgb, axis=2).astype(np.float32)
    grad_x = np.abs(np.gradient(gray, axis=1))
    grad_y = np.abs(np.gradient(gray, axis=0))
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    sharp_edge_ratio = np.mean(grad_mag > 30)
    
    # 3. Color distribution - check for flat/uniform regions
    hist, _ = np.histogram(gray.flatten(), bins=256, range=(0, 255))
    hist = hist[hist > 0]
    if len(hist) > 0:
        prob = hist / hist.sum()
        entropy = -np.sum(prob * np.log2(prob + 1e-10))
        max_entropy = np.log2(256)
        normalized_entropy = entropy / max_entropy
    else:
        normalized_entropy = 0
    
    # 4. Background uniformity - check borders
    border_width = min(10, h // 20, w // 20)
    border_pixels = []
    border_pixels.append(rgb[:border_width, :, :].reshape(-1, 3))
    border_pixels.append(rgb[h-border_width:, :, :].reshape(-1, 3))
    border_pixels.append(rgb[:, :border_width, :].reshape(-1, 3))
    border_pixels.append(rgb[:, w-border_width:, :].reshape(-1, 3))
    all_border = np.vstack(border_pixels)
    border_std = np.std(all_border, axis=0).mean()
    
    # 5. Check for transparency
    has_transparency = img_array.shape[2] == 4 and np.any(img_array[:, :, 3] < 255)
    
    is_logo_score = 0.0
    
    if color_diversity < 0.05:
        is_logo_score += 0.3
    elif color_diversity < 0.1:
        is_logo_score += 0.2
    elif color_diversity < 0.2:
        is_logo_score += 0.1
    
    if sharp_edge_ratio > 0.15:
        is_logo_score += 0.3
    elif sharp_edge_ratio > 0.08:
        is_logo_score += 0.2
    elif sharp_edge_ratio > 0.04:
        is_logo_score += 0.1
    
    if normalized_entropy < 0.4:
        is_logo_score += 0.2
    elif normalized_entropy < 0.6:
        is_logo_score += 0.1
    
    if border_std < 15:
        is_logo_score += 0.2
    elif border_std < 30:
        is_logo_score += 0.1
    
    if has_transparency:
        is_logo_score += 0.1
    
    is_logo = is_logo_score > 0.5
    confidence = min(is_logo_score, 1.0) if is_logo else min(1.0 - is_logo_score, 1.0)
    
    return {
        "is_logo": is_logo,
        "confidence": float(confidence),
        "characteristics": {
            "color_diversity": float(color_diversity),
            "sharp_edge_ratio": float(sharp_edge_ratio),
            "normalized_entropy": float(normalized_entropy),
            "border_std": float(border_std),
            "has_transparency": bool(has_transparency),
            "is_logo_score": float(is_logo_score),
        }
    }


def remove_background_auto(input_path, output_path, request_id=None):
    """
    Automatic background removal - detects image type and applies best strategy.
    """
    if Image is None:
        return {"success": False, "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}", "traceback": ""}
    
    if np is None:
        return {"success": False, "error": f"NumPy import failed: {NUMPY_IMPORT_ERROR}", "traceback": ""}
    
    try:
        log_timing("image_decoding_start", {"path": input_path}, request_id)
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img_array = np.array(img)
        log_timing("image_decoding_completed", {"duration_sec": time.time() - start, "size": f"{img.width}x{img.height}", "mode": img.mode}, request_id)
        
        log_timing("image_analysis_start", {}, request_id)
        start = time.time()
        analysis = analyze_image_characteristics(img_array)
        log_timing("image_analysis_completed", {"duration_sec": time.time() - start, "is_logo": analysis["is_logo"]}, request_id)
        
        is_logo = analysis["is_logo"]
        
        if is_logo:
            return _process_logo_auto(img_array, output_path, analysis, request_id)
        else:
            return _process_photo_auto(input_path, output_path, analysis, request_id)
            
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def _process_logo_auto(img_array, output_path, analysis, request_id=None):
    """Process logo/graphic images with automatic parameter selection."""
    h, w = img_array.shape[:2]
    existing_alpha = img_array[:, :, 3]
    
    log_timing("logo_bg_estimation_start", {}, request_id)
    start = time.time()
    bg_color, bg_std = estimate_background_color(img_array)
    log_timing("logo_bg_estimation_completed", {"duration_sec": time.time() - start}, request_id)
    
    # bg_std is per-channel, use mean
    bg_std_mean = float(bg_std.mean())
    if bg_std_mean < 10:
        tolerance = 20
    elif bg_std_mean < 25:
        tolerance = 30
    else:
        tolerance = 40
    
    # Step 1: Edge-connected flood fill
    log_timing("logo_flood_fill_start", {"tolerance": tolerance}, request_id)
    start = time.time()
    edge_mask = flood_fill_background(img_array, bg_color, tolerance=tolerance)
    log_timing("logo_flood_fill_completed", {"duration_sec": time.time() - start}, request_id)
    
    # Step 2: Color-based mask for all matching background pixels
    log_timing("logo_color_mask_start", {"tolerance": tolerance}, request_id)
    start = time.time()
    color_mask = color_based_background_mask(img_array, bg_color, tolerance=tolerance)
    log_timing("logo_color_mask_completed", {"duration_sec": time.time() - start}, request_id)
    
    # Step 3: Identify enclosed background regions
    enclosed_mask = color_mask & ~edge_mask
    
    # Step 4: Validate enclosed regions
    if np.any(enclosed_mask):
        from scipy import ndimage
        log_timing("logo_enclosed_regions_start", {}, request_id)
        start = time.time()
        labeled, num_features = ndimage.label(enclosed_mask)
        for i in range(1, num_features + 1):
            region_mask = (labeled == i)
            region_size = np.sum(region_mask)
            if region_size < (h * w * 0.005):
                edge_mask = edge_mask | region_mask
            else:
                coords = np.where(region_mask)
                min_y, max_y = coords[0].min(), coords[0].max()
                min_x, max_x = coords[1].min(), coords[1].max()
                dist_from_edge = min(min_y, h - 1 - max_y, min_x, w - 1 - max_x)
                if dist_from_edge > min(h, w) * 0.05:
                    edge_mask = edge_mask | region_mask
        log_timing("logo_enclosed_regions_completed", {"duration_sec": time.time() - start}, request_id)
    
    edge_mask = edge_mask | (existing_alpha < 128)
    
    feather_radius = 1.0
    erode_size = 0
    
    log_timing("logo_refine_mask_start", {"feather_radius": feather_radius, "erode_size": erode_size}, request_id)
    start = time.time()
    alpha = refine_alpha_mask(edge_mask, feather_radius=feather_radius, erode_size=erode_size)
    log_timing("logo_refine_mask_completed", {"duration_sec": time.time() - start}, request_id)
    
    log_timing("logo_png_generation_start", {}, request_id)
    start = time.time()
    output_array = img_array.copy()
    output_array[:, :, 3] = alpha
    
    output_img = Image.fromarray(output_array, 'RGBA')
    output_img.save(output_path, format='PNG')
    log_timing("logo_png_generation_completed", {"duration_sec": time.time() - start}, request_id)
    
    return {
        "success": True,
        "output_path": output_path,
        "mode": "logo-auto",
        "analysis": analysis,
        "tolerance": tolerance,
        "feather_radius": feather_radius,
        "erode_size": erode_size,
    }


def _process_photo_auto(input_path, output_path, analysis, request_id=None):
    """Process photographic images using AI model with alpha matting."""
    if remove is None:
        return {"success": False, "error": f"rembg import failed: {REMBG_IMPORT_ERROR}", "traceback": ""}
    
    if new_session is None:
        return {"success": False, "error": f"rembg session_factory not available", "traceback": ""}
    
    supported_models = get_supported_models()
    model = "isnet-general-use"
    if model not in supported_models:
        model = supported_models[0] if supported_models else "u2net"
    
    try:
        log_timing("model_session_get_start", {"model": model}, request_id)
        start = time.time()
        session = get_session(model)
        log_timing("model_session_get_completed", {"duration_sec": time.time() - start}, request_id)
        
        log_timing("photo_image_decoding_start", {"path": input_path}, request_id)
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img_width, img_height = img.size
        log_timing("photo_image_decoding_completed", {"duration_sec": time.time() - start, "size": f"{img_width}x{img_height}"}, request_id)
        
        log_timing("ai_inference_start", {"model": model, "alpha_matting": True, "size": f"{img_width}x{img_height}"}, request_id)
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            output_img = remove(
                img,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10,
            )
        log_timing("ai_inference_completed", {"duration_sec": time.time() - start}, request_id)
        
        log_timing("photo_png_generation_start", {}, request_id)
        start = time.time()
        output_img.save(output_path, format='PNG')
        log_timing("photo_png_generation_completed", {"duration_sec": time.time() - start}, request_id)
        
        return {"success": True, "output_path": output_path, "model": model, "mode": "ai-auto", "analysis": analysis}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def remove_background_ai(input_path, output_path, model="isnet-general-use", alpha_matting=False, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10, request_id=None):
    """Remove background from image using rembg (AI mode)."""
    if remove is None:
        return {"success": False, "error": f"rembg import failed: {REMBG_IMPORT_ERROR}", "traceback": ""}
    if Image is None:
        return {"success": False, "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}", "traceback": ""}

    supported_models = get_supported_models()
    if model not in supported_models:
        return {"success": False, "error": f"Unsupported model: {model}. Supported models: {supported_models}", "traceback": ""}

    try:
        log_timing("model_session_get_start", {"model": model}, request_id)
        start = time.time()
        session = get_session(model)
        log_timing("model_session_get_completed", {"duration_sec": time.time() - start}, request_id)
        
        log_timing("ai_image_decoding_start", {"path": input_path}, request_id)
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img_width, img_height = img.size
        log_timing("ai_image_decoding_completed", {"duration_sec": time.time() - start, "size": f"{img_width}x{img_height}"}, request_id)
        
        log_timing("ai_inference_start", {"model": model, "alpha_matting": alpha_matting, "size": f"{img_width}x{img_height}"}, request_id)
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            output_img = remove(
                img,
                session=session,
                alpha_matting=alpha_matting,
                alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
                alpha_matting_background_threshold=alpha_matting_background_threshold,
                alpha_matting_erode_size=alpha_matting_erode_size,
            )
        log_timing("ai_inference_completed", {"duration_sec": time.time() - start}, request_id)
        
        log_timing("ai_png_generation_start", {}, request_id)
        start = time.time()
        output_img.save(output_path, format='PNG')
        log_timing("ai_png_generation_completed", {"duration_sec": time.time() - start}, request_id)
        
        return {"success": True, "output_path": output_path, "model": model}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

def remove_background_logo(input_path, output_path, tolerance=30, feather_radius=1, erode_size=0, border_width=5, submode="edge", background_color=None, request_id=None):
    """Remove background from logo/graphic images."""
    if Image is None:
        return {"success": False, "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}", "traceback": ""}
    if np is None:
        return {"success": False, "error": f"NumPy import failed: {NUMPY_IMPORT_ERROR}", "traceback": ""}

    try:
        log_timing("logo_image_decoding_start", {"path": input_path}, request_id)
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img_array = np.array(img)
        log_timing("logo_image_decoding_completed", {"duration_sec": time.time() - start}, request_id)
        
        h, w = img_array.shape[:2]
        existing_alpha = img_array[:, :, 3]
        
        log_timing("logo_bg_estimation_start", {"border_width": border_width}, request_id)
        start = time.time()
        if background_color is not None:
            bg_color = np.array(background_color, dtype=np.float32)
        else:
            bg_color, bg_std = estimate_background_color(img_array, border_width)
        log_timing("logo_bg_estimation_completed", {"duration_sec": time.time() - start}, request_id)
        
        if submode == "enclosed":
            log_timing("logo_color_mask_start", {"tolerance": tolerance}, request_id)
            start = time.time()
            bg_mask = color_based_background_mask(img_array, bg_color, tolerance=tolerance)
            log_timing("logo_color_mask_completed", {"duration_sec": time.time() - start}, request_id)
        else:
            log_timing("logo_flood_fill_start", {"tolerance": tolerance}, request_id)
            start = time.time()
            bg_mask = flood_fill_background(img_array, bg_color, tolerance=tolerance)
            log_timing("logo_flood_fill_completed", {"duration_sec": time.time() - start}, request_id)
        
        bg_mask = bg_mask | (existing_alpha < 128)
        
        log_timing("logo_refine_mask_start", {"feather_radius": feather_radius, "erode_size": erode_size}, request_id)
        start = time.time()
        alpha = refine_alpha_mask(bg_mask, feather_radius=feather_radius, erode_size=erode_size)
        log_timing("logo_refine_mask_completed", {"duration_sec": time.time() - start}, request_id)
        
        log_timing("logo_png_generation_start", {}, request_id)
        start = time.time()
        output_array = img_array.copy()
        output_array[:, :, 3] = alpha
        
        output_img = Image.fromarray(output_array, 'RGBA')
        output_img.save(output_path, format='PNG')
        log_timing("logo_png_generation_completed", {"duration_sec": time.time() - start}, request_id)
        
        return {
            "success": True, 
            "output_path": output_path, 
            "mode": "logo",
            "submode": submode,
            "tolerance": tolerance,
            "feather_radius": feather_radius,
            "erode_size": erode_size
        }
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

def process_request(request):
    """Process a single request and return the result."""
    try:
        input_path = request.get("input_path")
        output_path = request.get("output_path")
        mode = request.get("mode", "auto")
        request_id = request.get("requestId")
        
        if not input_path or not output_path:
            return {"success": False, "error": "Missing input_path or output_path"}
        
        if not os.path.exists(input_path):
            return {"success": False, "error": f"Input file not found: {input_path}"}

        log_timing("request_received", {"mode": mode, "input": input_path}, request_id)
        total_start = time.time()
        
        if mode == "auto":
            result = remove_background_auto(input_path, output_path, request_id)
        elif mode == "logo":
            result = remove_background_logo(
                input_path, output_path,
                tolerance=request.get("tolerance", 30),
                feather_radius=request.get("feather_radius", 1.0),
                erode_size=request.get("erode_size", 0),
                submode=request.get("submode", "edge"),
                background_color=request.get("background_color"),
                request_id=request_id
            )
        else:
            result = remove_background_ai(
                input_path, output_path,
                model=request.get("model", _DEFAULT_MODEL),
                alpha_matting=request.get("alpha_matting", False),
                alpha_matting_foreground_threshold=request.get("alpha_matting_foreground_threshold", 240),
                alpha_matting_background_threshold=request.get("alpha_matting_background_threshold", 10),
                alpha_matting_erode_size=request.get("alpha_matting_erode_size", 10),
                request_id=request_id
            )
        
        result["total_duration_sec"] = time.time() - total_start
        log_timing("request_completed", {"success": result.get("success"), "total_duration_sec": result["total_duration_sec"]}, request_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

def main():
    """Main worker loop - reads JSON requests from stdin, writes JSON responses to stdout."""
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    print(json.dumps({"status": "ready", "pid": os.getpid()}), flush=True)
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"success": False, "error": "Invalid JSON"}), flush=True)
            continue
        
        # Handle shutdown command
        if request.get("command") == "shutdown":
            print(json.dumps({"status": "shutdown"}), flush=True)
            break
        
        result = process_request(request)
        print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()