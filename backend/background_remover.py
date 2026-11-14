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
        session = new_session(model)
        
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
        with Image.open(input_path) as img:
            # Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Convert to numpy array
            img_array = np.array(img)
            h, w = img_array.shape[:2]
            
            # If image already has transparency, use it as a hint
            existing_alpha = img_array[:, :, 3]
            
            # Determine background color
            if background_color is not None:
                bg_color = np.array(background_color, dtype=np.float32)
            else:
                # Auto-detect from borders
                bg_color, bg_std = estimate_background_color(img_array, border_width)
            
            # Generate background mask based on submode
            if submode == "enclosed":
                # Color-based: remove ALL pixels matching background color (including enclosed regions)
                bg_mask = color_based_background_mask(img_array, bg_color, tolerance=tolerance)
            else:
                # Edge-connected flood-fill (default)
                bg_mask = flood_fill_background(img_array, bg_color, tolerance=tolerance)
            
            # If there's existing transparency, preserve those transparent areas
            # by ensuring they remain background
            bg_mask = bg_mask | (existing_alpha < 128)
            
            # Refine the alpha mask
            alpha = refine_alpha_mask(bg_mask, feather_radius=feather_radius, erode_size=erode_size)
            
            # Apply alpha to image
            output_array = img_array.copy()
            output_array[:, :, 3] = alpha
            
            # Convert back to PIL Image and save
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


def remove_background(input_path, output_path, mode="ai", model="isnet-general-use", alpha_matting=False, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10, tolerance=30, feather_radius=1, erode_size=0, submode="edge", background_color=None):
    """
    Main background removal function with mode selection.
    
    Args:
        mode: "ai" for AI-based removal, "logo" for logo/graphic mode
        submode: for logo mode - "edge" (flood-fill from edges) or "enclosed" (color-based, removes all matching including enclosed)
        background_color: for logo mode - optional [R, G, B] array for user-specified background color
    """
    if mode == "logo":
        return remove_background_logo(
            input_path, output_path,
            tolerance=tolerance,
            feather_radius=feather_radius,
            erode_size=erode_size,
            submode=submode,
            background_color=background_color
        )
    else:
        return remove_background_ai(
            input_path, output_path,
            model=model,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
            alpha_matting_erode_size=alpha_matting_erode_size
        )


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python background_remover.py <input> <output> [mode] [model/tolerance] [alpha_matting/feather] [fg_threshold/erode] [bg_threshold] [erode_size]
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

    if mode == "logo":
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