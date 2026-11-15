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
    if model_name not in _session_cache:
        _session_cache[model_name] = new_session(model_name)
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

def remove_background_ai(input_path, output_path, model="isnet-general-use", alpha_matting=False, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10):
    """Remove background from image using rembg (AI mode)."""
    if remove is None:
        return {"success": False, "error": f"rembg import failed: {REMBG_IMPORT_ERROR}", "traceback": ""}
    if Image is None:
        return {"success": False, "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}", "traceback": ""}

    supported_models = get_supported_models()
    if model not in supported_models:
        return {"success": False, "error": f"Unsupported model: {model}. Supported models: {supported_models}", "traceback": ""}

    try:
        session = get_session(model)
        
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
            
            output_img.save(output_path, format='PNG')
        
        return {"success": True, "output_path": output_path, "model": model}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

def remove_background_logo(input_path, output_path, tolerance=30, feather_radius=1, erode_size=0, border_width=5, submode="edge", background_color=None):
    """Remove background from logo/graphic images."""
    if Image is None:
        return {"success": False, "error": f"Pillow import failed: {PILLOW_IMPORT_ERROR}", "traceback": ""}
    if np is None:
        return {"success": False, "error": f"NumPy import failed: {NUMPY_IMPORT_ERROR}", "traceback": ""}

    try:
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            img_array = np.array(img)
            h, w = img_array.shape[:2]
            existing_alpha = img_array[:, :, 3]
            
            if background_color is not None:
                bg_color = np.array(background_color, dtype=np.float32)
            else:
                bg_color, bg_std = estimate_background_color(img_array, border_width)
            
            if submode == "enclosed":
                bg_mask = color_based_background_mask(img_array, bg_color, tolerance=tolerance)
            else:
                bg_mask = flood_fill_background(img_array, bg_color, tolerance=tolerance)
            
            bg_mask = bg_mask | (existing_alpha < 128)
            alpha = refine_alpha_mask(bg_mask, feather_radius=feather_radius, erode_size=erode_size)
            
            output_array = img_array.copy()
            output_array[:, :, 3] = alpha
            
            output_img = Image.fromarray(output_array, 'RGBA')
            output_img.save(output_path, format='PNG')
        
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
        mode = request.get("mode", "ai")
        
        if not input_path or not output_path:
            return {"success": False, "error": "Missing input_path or output_path"}
        
        if not os.path.exists(input_path):
            return {"success": False, "error": f"Input file not found: {input_path}"}

        if mode == "logo":
            return remove_background_logo(
                input_path, output_path,
                tolerance=request.get("tolerance", 30),
                feather_radius=request.get("feather_radius", 1.0),
                erode_size=request.get("erode_size", 0),
                submode=request.get("submode", "edge"),
                background_color=request.get("background_color")
            )
        else:
            return remove_background_ai(
                input_path, output_path,
                model=request.get("model", _DEFAULT_MODEL),
                alpha_matting=request.get("alpha_matting", False),
                alpha_matting_foreground_threshold=request.get("alpha_matting_foreground_threshold", 240),
                alpha_matting_background_threshold=request.get("alpha_matting_background_threshold", 10),
                alpha_matting_erode_size=request.get("alpha_matting_erode_size", 10)
            )
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