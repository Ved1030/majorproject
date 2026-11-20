#!/usr/bin/env python3
"""
AI Background Removal using rembg.
Supports multiple models: isnet-general-use, u2net, u2netp, u2net_human_seg, u2net_cloth_seg, silueta, birefnet-general, etc.

Also includes a Logo/Graphic mode using edge-connected flood-fill for:
- Logos
- Text graphics
- Icons
- Flat illustrations
- Graphics with uniform backgrounds
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


# Session cache for model reuse within this process
_session_cache = {}

def log_timing(stage, details=None):
    """Log a timing event with stage name and optional details."""
    msg = {"type": "timing", "stage": stage, "timestamp": time.time()}
    if details:
        msg["details"] = details
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
    """Get or create a session for the given model (cached per-process)."""
    if model_name not in _session_cache:
        log_timing("model_loading_start", {"model": model_name})
        start = time.time()
        _session_cache[model_name] = new_session(model_name)
        elapsed = time.time() - start
        log_timing("model_loading_completed", {"model": model_name, "duration_sec": elapsed})
    return _session_cache[model_name]


def remove_background_ai(input_path, output_path, model="isnet-general-use", alpha_matting=False, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10):
    """Remove background from image using rembg (AI mode)."""
    if remove is None:
        return {
            "success": False,
            "error": f"rembg import failed: {REMBG_IMPORT_ERROR}",
            "traceback": "",
        }
    
    if Image is None:
        return {
            "success": False,
            "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}",
            "traceback": "",
        }

    supported_models = get_supported_models()
    if model not in supported_models:
        return {
            "success": False,
            "error": f"Unsupported model: {model}. Supported models: {supported_models}",
            "traceback": "",
        }

    try:
        log_timing("model_session_get_start", {"model": model})
        start = time.time()
        session = get_session(model)
        log_timing("model_session_get_completed", {"duration_sec": time.time() - start})
        
        log_timing("ai_image_decoding_start", {"path": input_path})
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img_width, img_height = img.size
        log_timing("ai_image_decoding_completed", {"duration_sec": time.time() - start, "size": f"{img_width}x{img_height}"})
        
        log_timing("ai_inference_start", {"model": model, "alpha_matting": alpha_matting, "size": f"{img_width}x{img_height}"})
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
        log_timing("ai_inference_completed", {"duration_sec": time.time() - start})
        
        log_timing("ai_png_generation_start", {})
        start = time.time()
        output_img.save(output_path, format='PNG')
        log_timing("ai_png_generation_completed", {"duration_sec": time.time() - start})
        
        return {"success": True, "output_path": output_path, "model": model}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def estimate_background_color(img_array, border_width=5):
    """
    Estimate the background color by sampling pixels from image borders.
    Returns the median color of border pixels and their standard deviation.
    """
    h, w = img_array.shape[:2]
    
    # Sample from all four borders
    border_pixels = []
    
    # Top border
    border_pixels.append(img_array[:border_width, :, :3])
    # Bottom border
    border_pixels.append(img_array[h-border_width:, :, :3])
    # Left border
    border_pixels.append(img_array[:, :border_width, :3])
    # Right border
    border_pixels.append(img_array[:, w-border_width:, :3])
    
    # Combine all border pixels
    all_border = np.vstack([p.reshape(-1, 3) for p in border_pixels])
    
    # Use median for robustness against outliers
    median_color = np.median(all_border, axis=0).astype(np.float32)
    std_color = np.std(all_border, axis=0).astype(np.float32)
    
    return median_color, std_color


def color_distance(pixel, target_color):
    """Calculate Euclidean distance in RGB space."""
    return np.sqrt(np.sum((pixel.astype(np.float32) - target_color) ** 2, axis=-1))


def flood_fill_background(img_array, background_color, tolerance=30, max_distance=None):
    """
    Perform flood fill from image edges to find connected background pixels.
    
    Args:
        img_array: RGBA image array (H, W, 4)
        background_color: Target background color (RGB, 3 values)
        tolerance: Color distance tolerance for considering a pixel as background
        max_distance: Maximum color distance (if None, uses tolerance)
    
    Returns:
        Boolean mask where True = background (should become transparent)
    """
    if max_distance is None:
        max_distance = tolerance
    
    h, w = img_array.shape[:2]
    rgb = img_array[:, :, :3]
    
    # Calculate color distance for all pixels
    dist = color_distance(rgb, background_color)
    
    # Initial background mask: pixels within tolerance
    bg_mask = dist <= tolerance
    
    # Flood fill from edges - only expand to pixels that are similar to background
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    # Add all edge pixels that are within tolerance to queue
    # Top and bottom edges
    for x in range(w):
        if bg_mask[0, x] and not visited[0, x]:
            queue.append((0, x))
            visited[0, x] = True
        if bg_mask[h-1, x] and not visited[h-1, x]:
            queue.append((h-1, x))
            visited[h-1, x] = True
    
    # Left and right edges
    for y in range(h):
        if bg_mask[y, 0] and not visited[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if bg_mask[y, w-1] and not visited[y, w-1]:
            queue.append((y, w-1))
            visited[y, w-1] = True
    
    # 4-connected neighbors
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    while queue:
        y, x = queue.popleft()
        
        for dy, dx in directions:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                # Check if this neighbor is similar to background color
                if dist[ny, nx] <= max_distance:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
    
    return visited


def color_based_background_mask(img_array, background_color, tolerance=30):
    """
    Create a background mask based purely on color similarity, including enclosed regions.
    
    This mode removes ALL pixels matching the background color within tolerance,
    regardless of whether they're connected to image edges. This handles enclosed
    background regions like white counters inside letters (o, p, d, etc.).
    
    Args:
        img_array: RGBA image array (H, W, 4)
        background_color: Target background color (RGB, 3 values)
        tolerance: Color distance tolerance for considering a pixel as background
    
    Returns:
        Boolean mask where True = background (should become transparent)
    """
    h, w = img_array.shape[:2]
    rgb = img_array[:, :, :3]
    
    # Calculate color distance for all pixels
    dist = color_distance(rgb, background_color)
    
    # All pixels within tolerance are considered background
    bg_mask = dist <= tolerance
    
    return bg_mask


def refine_alpha_mask(alpha_mask, feather_radius=1, erode_size=0):
    """
    Refine the alpha mask with feathering and optional erosion.
    
    Args:
        alpha_mask: Boolean mask (True = background/transparent)
        feather_radius: Radius for Gaussian blur to create soft edges
        erode_size: Erosion size to shrink the mask slightly
    
    Returns:
        Float alpha channel (0-255)
    """
    # Convert boolean to float (0 or 255)
    alpha = alpha_mask.astype(np.float32) * 255
    
    # Invert: True (background) -> 0 (transparent), False (foreground) -> 255 (opaque)
    alpha = 255 - alpha
    
    if erode_size > 0:
        # Erode the foreground (shrink opaque regions)
        from scipy import ndimage
        # Create binary foreground mask
        fg_mask = (alpha > 128).astype(np.uint8)
        # Erode
        structure = np.ones((erode_size * 2 + 1, erode_size * 2 + 1))
        fg_mask = ndimage.binary_erosion(fg_mask, structure=structure).astype(np.uint8)
        alpha = fg_mask * 255
    
    if feather_radius > 0:
        # Apply Gaussian blur for anti-aliased edges
        from scipy import ndimage
        alpha = ndimage.gaussian_filter(alpha, sigma=feather_radius)
    
    # Clip to valid range
    alpha = np.clip(alpha, 0, 255)
    
    return alpha.astype(np.uint8)


def remove_background_logo(input_path, output_path, tolerance=30, feather_radius=1, erode_size=0, border_width=5, submode="edge", background_color=None):
    """
    Remove background from logo/graphic images.
    
    This mode is designed for:
    - Logos
    - Text graphics
    - Icons
    - Flat illustrations
    - Graphics with uniform/solid backgrounds
    
    Args:
        input_path: Path to input image
        output_path: Path to output PNG
        tolerance: Color distance tolerance for background detection (0-255)
        feather_radius: Gaussian blur radius for edge anti-aliasing
        erode_size: Erosion size to shrink foreground slightly
        border_width: Width of border to sample for background color estimation
        submode: "edge" for edge-connected flood-fill, "enclosed" for color-based removal of all matching background pixels including enclosed regions
        background_color: Optional user-specified background color as [R, G, B] tuple. If None, auto-detected from borders.
    """
    if Image is None:
        return {
            "success": False,
            "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}",
            "traceback": "",
        }
    
    if np is None:
        return {
            "success": False,
            "error": f"NumPy import failed: {NUMPY_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        log_timing("logo_image_decoding_start", {"path": input_path})
        start = time.time()
        with Image.open(input_path) as img:
            # Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Convert to numpy array
            img_array = np.array(img)
        log_timing("logo_image_decoding_completed", {"duration_sec": time.time() - start})
        
        h, w = img_array.shape[:2]
        
        # If image already has transparency, use it as a hint
        existing_alpha = img_array[:, :, 3]
        
        # Determine background color
        log_timing("logo_bg_estimation_start", {"border_width": border_width})
        start = time.time()
        if background_color is not None:
            bg_color = np.array(background_color, dtype=np.float32)
        else:
            # Auto-detect from borders
            bg_color, bg_std = estimate_background_color(img_array, border_width)
        log_timing("logo_bg_estimation_completed", {"duration_sec": time.time() - start})
        
        # Generate background mask based on submode
        if submode == "enclosed":
            # Color-based: remove ALL pixels matching background color (including enclosed regions)
            log_timing("logo_color_mask_start", {"tolerance": tolerance})
            start = time.time()
            bg_mask = color_based_background_mask(img_array, bg_color, tolerance=tolerance)
            log_timing("logo_color_mask_completed", {"duration_sec": time.time() - start})
        else:
            # Edge-connected flood-fill (default)
            log_timing("logo_flood_fill_start", {"tolerance": tolerance})
            start = time.time()
            bg_mask = flood_fill_background(img_array, bg_color, tolerance=tolerance)
            log_timing("logo_flood_fill_completed", {"duration_sec": time.time() - start})
        
        # If there's existing transparency, preserve those transparent areas
        # by ensuring they remain background
        bg_mask = bg_mask | (existing_alpha < 128)
        
        # Refine the alpha mask
        log_timing("logo_refine_mask_start", {"feather_radius": feather_radius, "erode_size": erode_size})
        start = time.time()
        alpha = refine_alpha_mask(bg_mask, feather_radius=feather_radius, erode_size=erode_size)
        log_timing("logo_refine_mask_completed", {"duration_sec": time.time() - start})
        
        # Apply alpha to image
        log_timing("logo_png_generation_start", {})
        start = time.time()
        output_array = img_array.copy()
        output_array[:, :, 3] = alpha
        
        output_img = Image.fromarray(output_array, 'RGBA')
        output_img.save(output_path, format='PNG')
        log_timing("logo_png_generation_completed", {"duration_sec": time.time() - start})
        
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
    # Reshape to get unique colors
    pixels = rgb.reshape(-1, 3)
    # Sample for performance on large images
    if len(pixels) > 100000:
        indices = np.random.choice(len(pixels), 100000, replace=False)
        pixels = pixels[indices]
    
    unique_colors = len(np.unique(pixels.view(np.dtype((np.void, pixels.dtype.itemsize * 3)))))
    color_diversity = unique_colors / len(pixels)
    
    # 2. Edge sharpness analysis
    # Use gradient magnitude to detect sharp edges (typical of logos/graphics)
    gray = np.mean(rgb, axis=2).astype(np.float32)
    grad_x = np.abs(np.gradient(gray, axis=1))
    grad_y = np.abs(np.gradient(gray, axis=0))
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    sharp_edge_ratio = np.mean(grad_mag > 30)
    
    # 3. Color distribution - check for flat/uniform regions
    # Calculate histogram entropy
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
    
    # Decision logic:
    # - Low color diversity + high sharp edges + low entropy + uniform borders = logo/graphic
    # - High color diversity + lower sharp edges + high entropy = photograph
    
    is_logo_score = 0.0
    
    # Low color diversity suggests logo/graphic
    if color_diversity < 0.05:
        is_logo_score += 0.3
    elif color_diversity < 0.1:
        is_logo_score += 0.2
    elif color_diversity < 0.2:
        is_logo_score += 0.1
    
    # High sharp edge ratio suggests logo/text
    if sharp_edge_ratio > 0.15:
        is_logo_score += 0.3
    elif sharp_edge_ratio > 0.08:
        is_logo_score += 0.2
    elif sharp_edge_ratio > 0.04:
        is_logo_score += 0.1
    
    # Low entropy suggests flat colors (logo)
    if normalized_entropy < 0.4:
        is_logo_score += 0.2
    elif normalized_entropy < 0.6:
        is_logo_score += 0.1
    
    # Uniform borders suggest solid background
    if border_std < 15:
        is_logo_score += 0.2
    elif border_std < 30:
        is_logo_score += 0.1
    
    # Existing transparency suggests it might already be processed or a graphic
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


def remove_background_auto(input_path, output_path):
    """
    Automatic background removal - detects image type and applies best strategy.
    
    Strategy:
    1. Analyze image characteristics to determine if it's a logo/graphic or photograph
    2. For logos/graphics: Use edge-connected flood-fill with enclosed region handling
    3. For photographs: Use AI model (isnet-general-use) with alpha matting
    4. For both: Ensure enclosed background regions are properly handled
    """
    if Image is None:
        return {
            "success": False,
            "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}",
            "traceback": "",
        }
    
    if np is None:
        return {
            "success": False,
            "error": f"NumPy import failed: {NUMPY_IMPORT_ERROR}",
            "traceback": "",
        }
    
    try:
        log_timing("auto_image_decoding_start", {"path": input_path})
        start = time.time()
        with Image.open(input_path) as img:
            # Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            img_array = np.array(img)
        log_timing("auto_image_decoding_completed", {"duration_sec": time.time() - start})
        
        # Analyze image characteristics
        log_timing("auto_image_analysis_start", {})
        start = time.time()
        analysis = analyze_image_characteristics(img_array)
        log_timing("auto_image_analysis_completed", {"duration_sec": time.time() - start, "is_logo": analysis["is_logo"]})
        is_logo = analysis["is_logo"]
        confidence = analysis["confidence"]
        
        # Process based on detected type
        if is_logo:
            # Logo/Graphic mode with intelligent enclosed region handling
            return _process_logo_auto(img_array, output_path, analysis)
        else:
            # AI mode for photographs
            return _process_photo_auto(input_path, output_path, analysis)
            
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def _process_logo_auto(img_array, output_path, analysis):
    """
    Process logo/graphic images with automatic parameter selection.
    
    Uses edge-connected flood-fill as primary method, but also checks
    for enclosed background regions that should be removed.
    """
    h, w = img_array.shape[:2]
    existing_alpha = img_array[:, :, 3]
    
    # Auto-detect background color from borders
    log_timing("logo_bg_estimation_start", {})
    start = time.time()
    bg_color, bg_std = estimate_background_color(img_array)
    log_timing("logo_bg_estimation_completed", {"duration_sec": time.time() - start})
    
    # Determine tolerance based on background uniformity
    # More uniform background = lower tolerance (stricter)
    # bg_std is per-channel, use mean
    bg_std_mean = float(bg_std.mean())
    if bg_std_mean < 10:
        tolerance = 20
    elif bg_std_mean < 25:
        tolerance = 30
    else:
        tolerance = 40
    
    # Step 1: Edge-connected flood fill (removes outer background)
    log_timing("logo_flood_fill_start", {"tolerance": tolerance})
    start = time.time()
    edge_mask = flood_fill_background(img_array, bg_color, tolerance=tolerance)
    log_timing("logo_flood_fill_completed", {"duration_sec": time.time() - start})
    
    # Step 2: Check for enclosed background regions
    # Create a color-based mask for all pixels matching background color
    log_timing("logo_color_mask_start", {"tolerance": tolerance})
    start = time.time()
    color_mask = color_based_background_mask(img_array, bg_color, tolerance=tolerance)
    log_timing("logo_color_mask_completed", {"duration_sec": time.time() - start})
    
    # Step 3: Identify truly enclosed background regions
    # These are regions that match background color but are NOT connected to edges
    enclosed_mask = color_mask & ~edge_mask
    
    # Step 4: Validate enclosed regions - only remove if they're "genuine" background
    # Heuristic: enclosed regions that are small and completely surrounded by foreground
    # are likely background (e.g., holes in letters). Large enclosed regions might be
    # actual foreground objects.
    if np.any(enclosed_mask):
        from scipy import ndimage
        log_timing("logo_enclosed_regions_start", {})
        start = time.time()
        labeled, num_features = ndimage.label(enclosed_mask)
        for i in range(1, num_features + 1):
            region_mask = (labeled == i)
            region_size = np.sum(region_mask)
            # If region is small (< 0.5% of image), likely background hole
            if region_size < (h * w * 0.005):
                edge_mask = edge_mask | region_mask
            # For larger regions, check if they're fully surrounded by foreground
            # by checking if the region's bounding box is far from edges
            else:
                coords = np.where(region_mask)
                min_y, max_y = coords[0].min(), coords[0].max()
                min_x, max_x = coords[1].min(), coords[1].max()
                # Check distance from image edges
                dist_from_edge = min(min_y, h - 1 - max_y, min_x, w - 1 - max_x)
                # If well inside the image (> 5% from edges), likely enclosed background
                if dist_from_edge > min(h, w) * 0.05:
                    edge_mask = edge_mask | region_mask
        log_timing("logo_enclosed_regions_completed", {"duration_sec": time.time() - start})
    
    # Preserve existing transparency
    edge_mask = edge_mask | (existing_alpha < 128)
    
    # Refine alpha mask with feathering
    feather_radius = 1.0
    erode_size = 0
    log_timing("logo_refine_mask_start", {"feather_radius": feather_radius, "erode_size": erode_size})
    start = time.time()
    alpha = refine_alpha_mask(edge_mask, feather_radius=feather_radius, erode_size=erode_size)
    log_timing("logo_refine_mask_completed", {"duration_sec": time.time() - start})
    
    # Apply alpha to image
    log_timing("logo_png_generation_start", {})
    start = time.time()
    output_array = img_array.copy()
    output_array[:, :, 3] = alpha
    
    output_img = Image.fromarray(output_array, 'RGBA')
    output_img.save(output_path, format='PNG')
    log_timing("logo_png_generation_completed", {"duration_sec": time.time() - start})
    
    return {
        "success": True,
        "output_path": output_path,
        "mode": "logo-auto",
        "analysis": analysis,
        "tolerance": tolerance,
        "feather_radius": feather_radius,
        "erode_size": erode_size,
    }


def _process_photo_auto(input_path, output_path, analysis):
    """
    Process photographic images using AI model with alpha matting.
    """
    if remove is None:
        return {
            "success": False,
            "error": f"rembg import failed: {REMBG_IMPORT_ERROR}",
            "traceback": "",
        }
    
    if new_session is None:
        return {
            "success": False,
            "error": f"rembg session_factory not available",
            "traceback": "",
        }
    
    supported_models = get_supported_models()
    model = "isnet-general-use"
    if model not in supported_models:
        # Fallback to first available model
        model = supported_models[0] if supported_models else "u2net"
    
    try:
        log_timing("model_session_get_start", {"model": model})
        start = time.time()
        session = get_session(model)
        log_timing("model_session_get_completed", {"duration_sec": time.time() - start})
        
        log_timing("photo_image_decoding_start", {"path": input_path})
        start = time.time()
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img_width, img_height = img.size
        log_timing("photo_image_decoding_completed", {"duration_sec": time.time() - start, "size": f"{img_width}x{img_height}"})
        
        # Use alpha matting for better edge quality on photographs
        log_timing("ai_inference_start", {"model": model, "alpha_matting": True, "size": f"{img_width}x{img_height}"})
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
        log_timing("ai_inference_completed", {"duration_sec": time.time() - start})
        
        log_timing("photo_png_generation_start", {})
        start = time.time()
        output_img.save(output_path, format='PNG')
        log_timing("photo_png_generation_completed", {"duration_sec": time.time() - start})
        
        return {"success": True, "output_path": output_path, "model": model, "mode": "ai-auto", "analysis": analysis}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def remove_background(input_path, output_path, mode="auto", model="isnet-general-use", alpha_matting=False, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10, tolerance=30, feather_radius=1, erode_size=0, submode="edge", background_color=None):
    """
    Main background removal function with mode selection.
    
    Args:
        mode: "auto" for automatic detection, "ai" for AI-based removal, "logo" for logo/graphic mode
        submode: for logo mode - "edge" (flood-fill from edges) or "enclosed" (color-based, removes all matching including enclosed)
        background_color: for logo mode - optional [R, G, B] array for user-specified background color
    """
    log_timing("request_received", {"mode": mode, "input": input_path})
    total_start = time.time()
    
    if mode == "auto":
        result = remove_background_auto(input_path, output_path)
    elif mode == "logo":
        result = remove_background_logo(
            input_path, output_path,
            tolerance=tolerance,
            feather_radius=feather_radius,
            erode_size=erode_size,
            submode=submode,
            background_color=background_color
        )
    else:
        result = remove_background_ai(
            input_path, output_path,
            model=model,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
            alpha_matting_erode_size=alpha_matting_erode_size
        )
    
    result["total_duration_sec"] = time.time() - total_start
    log_timing("request_completed", {"success": result.get("success"), "total_duration_sec": result["total_duration_sec"]})
    return result


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python background_remover.py <input> <output> [mode] [mode-specific-args]
    # For Auto mode: python background_remover.py <input> <output> auto
    # For AI mode: python background_remover.py <input> <output> ai [model] [alpha_matting] [fg_threshold] [bg_threshold] [erode_size]
    # For Logo mode: python background_remover.py <input> <output> logo [submode] [tolerance] [feather_radius] [erode_size] [background_color_preset] [background_color_custom_json]
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python background_remover.py <input> <output> <mode> [mode-specific-args]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    mode = sys.argv[3].lower()

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    if mode == "auto":
        result = remove_background_auto(input_path, output_path)
    elif mode == "logo":
        submode = sys.argv[4] if len(sys.argv) >= 5 else "edge"
        tolerance = int(sys.argv[5]) if len(sys.argv) >= 6 else 30
        feather_radius = float(sys.argv[6]) if len(sys.argv) >= 7 else 1.0
        erode_size = int(sys.argv[7]) if len(sys.argv) >= 8 else 0
        background_color_preset = sys.argv[8] if len(sys.argv) >= 9 else "auto"
        background_color_custom = None
        if len(sys.argv) >= 10:
            try:
                background_color_custom = json.loads(sys.argv[9])
            except:
                background_color_custom = None
        
        print(f"[DEBUG] submode={submode}, tolerance={tolerance}, feather_radius={feather_radius}, erode_size={erode_size}", file=sys.stderr)
        print(f"[DEBUG] background_color_preset={background_color_preset}, background_color_custom={background_color_custom}", file=sys.stderr)
        
        # Determine background color from preset
        background_color = None
        if background_color_preset == "white":
            background_color = [255, 255, 255]
        elif background_color_preset == "black":
            background_color = [0, 0, 0]
        elif background_color_preset == "custom" and background_color_custom:
            background_color = background_color_custom
        # "auto" means auto-detect from borders (background_color = None)
        
        result = remove_background_logo(
            input_path, output_path, 
            submode=submode,
            tolerance=tolerance, 
            feather_radius=feather_radius, 
            erode_size=erode_size,
            background_color=background_color
        )
    else:
        model = sys.argv[4] if len(sys.argv) >= 5 else "isnet-general-use"
        alpha_matting = sys.argv[5].lower() == "true" if len(sys.argv) >= 6 else False
        alpha_matting_foreground_threshold = int(sys.argv[6]) if len(sys.argv) >= 7 else 240
        alpha_matting_background_threshold = int(sys.argv[7]) if len(sys.argv) >= 8 else 10
        alpha_matting_erode_size = int(sys.argv[8]) if len(sys.argv) >= 9 else 10
        result = remove_background_ai(
            input_path, output_path,
            model=model,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
            alpha_matting_erode_size=alpha_matting_erode_size
        )
    print(json.dumps(result))


if __name__ == "__main__":
    main()