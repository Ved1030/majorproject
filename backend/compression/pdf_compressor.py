#!/usr/bin/env python3
"""
PDF Compression using Ghostscript, pikepdf, and qpdf.
Supports Low, Medium, High compression levels with intelligent analysis.
"""

import sys
import os
import json
import platform
import traceback
import subprocess
import tempfile
import shutil
from importlib.metadata import version, PackageNotFoundError

# Check for pikepdf
try:
    import pikepdf
    PIKEPDF_IMPORT_ERROR = None
except Exception as exc:
    pikepdf = None
    PIKEPDF_IMPORT_ERROR = exc

# Check for PyMuPDF (fitz) for analysis
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except Exception:
    fitz = None
    PYMUPDF_AVAILABLE = False

# Check for qpdf command line tool
def check_qpdf():
    """Check if qpdf is available."""
    try:
        result = subprocess.run(['qpdf', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
    except Exception:
        pass
    return False, None

QPDF_AVAILABLE, QPDF_VERSION = check_qpdf()

# Check for Ghostscript
def check_ghostscript():
    """Check if Ghostscript is available."""
    try:
        for cmd in ['gs', 'gswin64c', 'gswin32c']:
            try:
                result = subprocess.run([cmd, '--version'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    return True, cmd, result.stdout.strip()
            except Exception:
                continue
    except Exception:
        pass
    return False, None, None

GHOSTSCRIPT_AVAILABLE, GHOSTSCRIPT_CMD, GHOSTSCRIPT_VERSION = check_ghostscript()


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if pikepdf is None:
        errors.append(f"pikepdf: {type(PIKEPDF_IMPORT_ERROR).__name__}: {PIKEPDF_IMPORT_ERROR}")

    if not QPDF_AVAILABLE:
        warnings.append("qpdf not available - will use pikepdf only (limited optimization)")

    if not GHOSTSCRIPT_AVAILABLE:
        warnings.append("Ghostscript not available - image downsampling unavailable")

    if not PYMUPDF_AVAILABLE:
        warnings.append("PyMuPDF not available - intelligent analysis unavailable")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        pikepdf_version = version("pikepdf")
    except PackageNotFoundError:
        pikepdf_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pikepdf_version": pikepdf_version,
        "qpdf_available": QPDF_AVAILABLE,
        "qpdf_version": QPDF_VERSION,
        "ghostscript_available": GHOSTSCRIPT_AVAILABLE,
        "ghostscript_version": GHOSTSCRIPT_VERSION,
        "ghostscript_cmd": GHOSTSCRIPT_CMD,
        "pymupdf_available": PYMUPDF_AVAILABLE,
        "warnings": warnings,
    }


def get_dpi_for_level(level):
    """Get target DPI for compression level."""
    return {
        'low': 200,
        'medium': 150,
        'high': 96,
    }.get(level, 150)


def get_jpeg_quality_for_level(level):
    """Get JPEG quality for compression level."""
    return {
        'low': 85,
        'medium': 70,
        'high': 50,
    }.get(level, 75)


def analyze_pdf(input_path):
    """
    Intelligently analyze PDF content to determine optimal compression strategy.
    Returns a dictionary with analysis results.
    """
    analysis = {
        "file_size": os.path.getsize(input_path),
        "page_count": 0,
        "image_count": 0,
        "total_image_area": 0,
        "has_vector_graphics": False,
        "has_text": False,
        "has_forms": False,
        "has_annotations": False,
        "font_count": 0,
        "embedded_fonts": 0,
        "is_scanned": False,
        "already_optimized": False,
        "avg_image_dpi": 0,
        "image_formats": set(),
        "largest_image_dimensions": (0, 0),
        "content_type": "unknown",  # text-heavy, image-heavy, scanned, mixed
        "compression_filters": set(),
    }

    if not PYMUPDF_AVAILABLE:
        analysis["analysis_error"] = "PyMuPDF not available"
        return analysis

    try:
        doc = fitz.open(input_path)
        analysis["page_count"] = len(doc)

        total_image_pixels = 0
        image_dpi_sum = 0
        image_dpi_count = 0

        for page_num in range(len(doc)):
            page = doc[page_num]

            # Check for text
            text = page.get_text()
            if text.strip():
                analysis["has_text"] = True

            # Check for vector graphics (drawings)
            drawings = page.get_drawings()
            if drawings:
                analysis["has_vector_graphics"] = True

            # Check for forms/annotations
            if page.first_widget:
                analysis["has_forms"] = True
            if page.first_annot:
                analysis["has_annotations"] = True

            # Analyze images
            images = page.get_images(full=True)
            for img in images:
                analysis["image_count"] += 1
                xref = img[0]
                try:
                    pix = fitz.Pixmap(doc, xref)
                    if pix.width > 0 and pix.height > 0:
                        area = pix.width * pix.height
                        analysis["total_image_area"] += area
                        total_image_pixels += area
                        if pix.width > analysis["largest_image_dimensions"][0]:
                            analysis["largest_image_dimensions"] = (pix.width, pix.height)
                        if pix.height > analysis["largest_image_dimensions"][1]:
                            analysis["largest_image_dimensions"] = (analysis["largest_image_dimensions"][0], pix.height)

                        # Estimate DPI from image size on page
                        rect = page.get_image_rects(xref)
                        if rect:
                            r = rect[0]
                            if r.width > 0 and r.height > 0:
                                dpi_x = (pix.width / r.width) * 72
                                dpi_y = (pix.height / r.height) * 72
                                image_dpi_sum += (dpi_x + dpi_y) / 2
                                image_dpi_count += 1

                        # Image format
                        if pix.alpha:
                            analysis["image_formats"].add("RGBA")
                        elif pix.n == 3:
                            analysis["image_formats"].add("RGB")
                        elif pix.n == 1:
                            analysis["image_formats"].add("Gray")
                        else:
                            analysis["image_formats"].add("CMYK")

                        # Compression filter
                        img_info = doc.extract_image(xref)
                        if img_info and "ext" in img_info:
                            analysis["compression_filters"].add(img_info["ext"])

                    pix = None
                except Exception:
                    pass

            # Fonts
            fonts = page.get_fonts()
            analysis["font_count"] += len(fonts)
            for font in fonts:
                if font[2] != "Type3":  # Type3 are bitmap fonts
                    analysis["embedded_fonts"] += 1

        doc.close()

        if image_dpi_count > 0:
            analysis["avg_image_dpi"] = round(image_dpi_sum / image_dpi_count)

        analysis["image_formats"] = list(analysis["image_formats"])
        analysis["compression_filters"] = list(analysis["compression_filters"])
        analysis["largest_image_dimensions"] = list(analysis["largest_image_dimensions"])

        # Determine content type
        page_area = 0
        if analysis["page_count"] > 0:
            # Estimate average page area (A4 ~ 595x842 pts)
            page_area = 595 * 842 * analysis["page_count"]

        image_ratio = analysis["total_image_area"] / page_area if page_area > 0 else 0

        if analysis["image_count"] == 0 and analysis["has_text"]:
            analysis["content_type"] = "text-only"
        elif analysis["image_count"] > 0 and analysis["avg_image_dpi"] > 200 and not analysis["has_text"]:
            analysis["content_type"] = "scanned"
        elif image_ratio > 0.5:
            analysis["content_type"] = "image-heavy"
        elif analysis["has_text"] and analysis["image_count"] > 0:
            analysis["content_type"] = "mixed"
        elif analysis["has_text"]:
            analysis["content_type"] = "text-heavy"
        else:
            analysis["content_type"] = "unknown"

        # Check if already optimized
        has_flate = "FlateDecode" in analysis["compression_filters"] or "png" in analysis["compression_filters"]
        has_jpeg = "jpeg" in analysis["compression_filters"] or "jpg" in analysis["compression_filters"]
        has_jpx = "jp2" in analysis["compression_filters"] or "jpx" in analysis["compression_filters"]
        has_ccitt = "ccitt" in analysis["compression_filters"] or "tiff" in analysis["compression_filters"]

        if has_flate or has_jpeg or has_jpx or has_ccitt:
            analysis["already_optimized"] = True

    except Exception as e:
        analysis["analysis_error"] = str(e)

    return analysis


def select_compression_strategies(analysis, level):
    """
    Select appropriate compression strategies based on PDF analysis and level.
    Returns a list of strategy names to try in order.
    """
    strategies = []
    content_type = analysis.get("content_type", "unknown")
    file_size = analysis.get("file_size", 0)
    image_count = analysis.get("image_count", 0)
    avg_dpi = analysis.get("avg_image_dpi", 0)
    already_optimized = analysis.get("already_optimized", False)

    # Very small files - special handling
    if file_size < 10240:  # 10 KB
        return ["none"]

    # Low level - conservative
    if level == "low":
        if content_type in ["text-only", "text-heavy"]:
            strategies = ["pikepdf_conservative"]
        elif content_type == "scanned":
            strategies = ["pikepdf_conservative", "ghostscript_conservative"]
        elif content_type in ["image-heavy", "mixed"]:
            strategies = ["pikepdf_conservative", "qpdf_structural"]
        else:
            strategies = ["pikepdf_conservative", "qpdf_structural"]

    # Medium level - balanced
    elif level == "medium":
        if content_type == "text-only":
            strategies = ["pikepdf_structural", "pikepdf_conservative", "qpdf_structural"]
        elif content_type == "text-heavy":
            strategies = ["pikepdf_structural", "pikepdf_conservative", "qpdf_structural", "ghostscript_moderate"]
        elif content_type == "scanned":
            strategies = ["ghostscript_moderate", "pikepdf_structural", "pikepdf_conservative", "qpdf_structural"]
        elif content_type == "image-heavy":
            strategies = ["ghostscript_moderate", "qpdf_structural", "pikepdf_structural", "pikepdf_conservative"]
        elif content_type == "mixed":
            strategies = ["ghostscript_moderate", "qpdf_structural", "pikepdf_structural", "pikepdf_conservative"]
        else:
            strategies = ["qpdf_structural", "pikepdf_structural", "pikepdf_conservative"]

    # High level - aggressive
    elif level == "high":
        if content_type == "text-only":
            strategies = ["qpdf_aggressive", "pikepdf_aggressive", "pikepdf_structural", "pikepdf_conservative"]
        elif content_type == "text-heavy":
            strategies = ["qpdf_aggressive", "ghostscript_aggressive", "pikepdf_aggressive", "pikepdf_structural", "pikepdf_conservative"]
        elif content_type == "scanned":
            strategies = ["ghostscript_aggressive", "qpdf_aggressive", "pikepdf_structural", "pikepdf_conservative"]
        elif content_type == "image-heavy":
            strategies = ["ghostscript_aggressive", "qpdf_aggressive", "pikepdf_structural", "pikepdf_conservative"]
        elif content_type == "mixed":
            strategies = ["ghostscript_aggressive", "qpdf_aggressive", "pikepdf_aggressive", "pikepdf_structural", "pikepdf_conservative"]
        else:
            strategies = ["ghostscript_aggressive", "qpdf_aggressive", "pikepdf_aggressive", "pikepdf_structural", "pikepdf_conservative"]

    # If already optimized, avoid Ghostscript for low/medium to prevent quality loss
    # BUT only if images are already at reasonable DPI for the target level
    if already_optimized and level in ["low", "medium"] and "ghostscript" in str(strategies).lower():
        # Check if downsampling would actually help (images larger than target DPI)
        target_dpi = get_dpi_for_level(level)
        avg_dpi = analysis.get("avg_image_dpi", 0)
        
        # Only skip Ghostscript if images are already at or below target DPI
        if avg_dpi > 0 and avg_dpi <= target_dpi:
            strategies = [s for s in strategies if "ghostscript" not in s.lower()]
            if not strategies:
                strategies = ["pikepdf_structural"]

    return strategies


def compress_with_ghostscript(input_path, output_path, level, strategy_variant="default"):
    """
    Compress PDF using Ghostscript with image downsampling and recompression.
    strategy_variant: "conservative", "moderate", "aggressive"
    """
    if not GHOSTSCRIPT_AVAILABLE:
        return {"success": False, "error": "Ghostscript not available", "code": "MISSING_DEPENDENCY"}

    # Configure based on strategy variant
    if strategy_variant == "conservative":
        dpi = 200
        jpeg_quality = 85
        downsample_threshold = 1.5  # Only downsample if image is 1.5x target DPI
    elif strategy_variant == "moderate":
        dpi = 150
        jpeg_quality = 70
        downsample_threshold = 1.2
    elif strategy_variant == "aggressive":
        dpi = 96
        jpeg_quality = 50
        downsample_threshold = 1.0
    else:
        dpi = get_dpi_for_level(level)
        jpeg_quality = get_jpeg_quality_for_level(level)
        downsample_threshold = 1.2

    cmd = [
        GHOSTSCRIPT_CMD,
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dPrinted=false',
        '-dSAFER',
        f'-dDownsampleColorImages=true',
        f'-dColorImageDownsampleType=/Bicubic',
        f'-dColorImageResolution={dpi}',
        f'-dDownsampleGrayImages=true',
        f'-dGrayImageDownsampleType=/Bicubic',
        f'-dGrayImageResolution={dpi}',
        f'-dDownsampleMonoImages=true',
        f'-dMonoImageDownsampleType=/Subsample',
        f'-dMonoImageResolution={dpi}',
        f'-dColorImageFilter=/DCTEncode',
        f'-dJPEGQ={jpeg_quality}',
        f'-dGrayImageFilter=/DCTEncode',
        f'-dMonoImageFilter=/CCITTFaxEncode',
        '-dEmbedAllFonts=true',
        '-dSubsetFonts=true',
        '-dConvertCMYKImagesToRGB=true',
        '-dDetectDuplicateImages=true',
        '-dCompressFonts=true',
        '-dCompressPages=true',
        f'-sOutputFile={output_path}',
        input_path
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            return {"success": False, "error": f"Ghostscript failed: {result.stderr}", "traceback": result.stderr}

        if not os.path.exists(output_path):
            return {"success": False, "error": "Ghostscript did not produce output file"}

        return {
            "success": True,
            "output_path": output_path,
            "method": f"ghostscript_{strategy_variant}",
            "level": level,
            "dpi": dpi,
            "jpeg_quality": jpeg_quality,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Ghostscript compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_with_pikepdf(input_path, output_path, level, strategy_variant="default"):
    """
    Compress PDF using pikepdf.
    strategy_variant: "conservative", "structural", "aggressive"
    """
    try:
        pdf = pikepdf.open(input_path)
        page_count = len(pdf.pages)

        if strategy_variant == "conservative":
            # Very conservative: only structural optimization, no image recompression
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=False)
        elif strategy_variant == "structural":
            # Structural with image recompression
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=True,
                     recompress_flate=True)
        elif strategy_variant == "aggressive":
            # Aggressive: decode all streams and recompress
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=True,
                     recompress_flate=True,
                     stream_decode_level=pikepdf.StreamDecodeLevel.all)
        else:
            # Default based on level
            if level == "low":
                pdf.save(output_path,
                         object_stream_mode=pikepdf.ObjectStreamMode.generate,
                         compress_streams=True,
                         linearize=False)
            elif level == "medium":
                pdf.save(output_path,
                         object_stream_mode=pikepdf.ObjectStreamMode.generate,
                         compress_streams=True,
                         linearize=True,
                         recompress_flate=True)
            else:  # high
                pdf.save(output_path,
                         object_stream_mode=pikepdf.ObjectStreamMode.generate,
                         compress_streams=True,
                         linearize=True,
                         recompress_flate=True,
                         stream_decode_level=pikepdf.StreamDecodeLevel.all)

        pdf.close()

        return {
            "success": True,
            "output_path": output_path,
            "page_count": page_count,
            "method": f"pikepdf_{strategy_variant}",
            "level": level,
        }

    except pikepdf.PasswordError:
        return {"success": False, "error": "PDF is password protected", "code": "PASSWORD_PROTECTED", "traceback": traceback.format_exc()}
    except pikepdf.PdfError as e:
        return {"success": False, "error": f"Invalid or corrupted PDF: {str(e)}", "code": "CORRUPTED_FILE", "traceback": traceback.format_exc()}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_with_qpdf(input_path, output_path, level, strategy_variant="default"):
    """
    Compress PDF using qpdf command line tool for stronger optimization.
    strategy_variant: "structural", "aggressive"
    """
    if not QPDF_AVAILABLE:
        return {"success": False, "error": "qpdf not available", "code": "MISSING_DEPENDENCY"}

    try:
        if strategy_variant == "structural":
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', input_path, output_path]
        elif strategy_variant == "aggressive":
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', '--recompress-flate', '--decode-level=all', input_path, output_path]
        elif level == "low":
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', input_path, output_path]
        elif level == "medium":
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', '--recompress-flate', input_path, output_path]
        else:  # high
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', '--recompress-flate', '--decode-level=all', input_path, output_path]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"qpdf failed: {result.stderr}", "traceback": result.stderr}

        return {
            "success": True,
            "output_path": output_path,
            "method": f"qpdf_{strategy_variant}",
            "level": level,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def validate_pdf(output_path, original_path, original_page_count=None):
    """
    Validate compressed PDF for correctness.
    Returns (is_valid, error_message).
    """
    try:
        # Check file exists and has size
        if not os.path.exists(output_path):
            return False, "Output file does not exist"

        compressed_size = os.path.getsize(output_path)
        if compressed_size == 0:
            return False, "Output file is empty"

        # Validate with pikepdf
        if pikepdf is not None:
            try:
                pdf = pikepdf.open(output_path)
                page_count = len(pdf.pages)
                pdf.close()

                if original_page_count is not None and page_count != original_page_count:
                    return False, f"Page count mismatch: {page_count} != {original_page_count}"
            except Exception as e:
                return False, f"Invalid PDF structure: {str(e)}"

        # Validate with PyMuPDF if available
        if PYMUPDF_AVAILABLE:
            try:
                doc = fitz.open(output_path)
                page_count = len(doc)

                if original_page_count is not None and page_count != original_page_count:
                    doc.close()
                    return False, f"Page count mismatch: {page_count} != {original_page_count}"

                # Check each page has valid dimensions
                for page_num in range(page_count):
                    page = doc[page_num]
                    rect = page.rect
                    if rect.width <= 0 or rect.height <= 0:
                        doc.close()
                        return False, f"Page {page_num} has invalid dimensions"

                    # Check page has content (text or images or drawings)
                    text = page.get_text()
                    images = page.get_images()
                    drawings = page.get_drawings()
                    if not text.strip() and not images and not drawings:
                        # Page might be empty but that's OK for some PDFs
                        pass

                doc.close()
            except Exception as e:
                return False, f"PyMuPDF validation failed: {str(e)}"

        return True, None

    except Exception as e:
        return False, f"Validation error: {str(e)}"


def compress_pdf(input_path, output_path, level="medium"):
    """
    Main compression function with intelligent analysis and multiple strategies.
    """
    valid_levels = ['low', 'medium', 'high']
    if level not in valid_levels:
        level = 'medium'

    original_size = os.path.getsize(input_path)

    # Special handling for very small files (< 10 KB)
    if original_size < 10240:
        shutil.copy2(input_path, output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "none",
            "level": level,
            "original_size": original_size,
            "compressed_size": original_size,
            "bytes_saved": 0,
            "reduction_percent": 0.0,
            "smaller": False,
            "warning": "File is already very small. Further compression may not be possible.",
            "target_achieved": False,
        }

    # Analyze PDF
    analysis = analyze_pdf(input_path)
    original_page_count = analysis.get("page_count", 0)

    # Select strategies based on analysis and level
    strategies = select_compression_strategies(analysis, level)

    best_result = None
    best_size = original_size
    last_error = None
    candidates_tried = []

    # Map strategy names to functions and parameters
    strategy_map = {
        "pikepdf_conservative": (compress_with_pikepdf, {"strategy_variant": "conservative"}),
        "pikepdf_structural": (compress_with_pikepdf, {"strategy_variant": "structural"}),
        "pikepdf_aggressive": (compress_with_pikepdf, {"strategy_variant": "aggressive"}),
        "qpdf_structural": (compress_with_qpdf, {"strategy_variant": "structural"}),
        "qpdf_aggressive": (compress_with_qpdf, {"strategy_variant": "aggressive"}),
        "ghostscript_conservative": (compress_with_ghostscript, {"strategy_variant": "conservative"}),
        "ghostscript_moderate": (compress_with_ghostscript, {"strategy_variant": "moderate"}),
        "ghostscript_aggressive": (compress_with_ghostscript, {"strategy_variant": "aggressive"}),
        "none": (None, {}),
    }

    for strategy_name in strategies:
        if strategy_name == "none":
            continue

        func, kwargs = strategy_map.get(strategy_name, (None, {}))
        if func is None:
            continue

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp_path = tmp.name

        try:
            result = func(input_path, tmp_path, level, **kwargs)
            # Store only serializable data for candidates_tried
            candidate_info = {
                "strategy": strategy_name,
                "success": result.get('success', False),
                "method": result.get('method'),
                "error": result.get('error'),
                "code": result.get('code'),
            }
            candidates_tried.append(candidate_info)

            if result.get('success'):
                compressed_size = os.path.getsize(tmp_path)

                # Validate output
                is_valid, validation_error = validate_pdf(tmp_path, input_path, original_page_count)
                if not is_valid:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
                    last_error = {"success": False, "error": f"Validation failed: {validation_error}", "strategy": strategy_name}
                    continue

                # Check if smaller than original
                if compressed_size < original_size:
                    result['original_size'] = original_size
                    result['compressed_size'] = compressed_size
                    result['bytes_saved'] = original_size - compressed_size
                    result['reduction_percent'] = round((original_size - compressed_size) / original_size * 100, 2)
                    result['smaller'] = True
                    result['analysis'] = analysis

                    # Track best result
                    if compressed_size < best_size:
                        if best_result and os.path.exists(output_path):
                            os.unlink(output_path)
                        shutil.move(tmp_path, output_path)
                        best_result = result
                        best_size = compressed_size
                    else:
                        if os.path.exists(tmp_path):
                            os.unlink(tmp_path)
                else:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
            else:
                last_error = result
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except Exception as e:
            last_error = {"success": False, "error": str(e), "traceback": traceback.format_exc(), "strategy": strategy_name}
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # If no method produced a smaller file, return the original
    if best_result is None:
        shutil.copy2(input_path, output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "none",
            "level": level,
            "original_size": original_size,
            "compressed_size": original_size,
            "bytes_saved": 0,
            "reduction_percent": 0.0,
            "smaller": False,
            "warning": "File is already optimized. No further compression possible.",
            "target_achieved": False,
            "analysis": analysis,
            "candidates_tried": candidates_tried,
        }

    # Determine if target was achieved
    reduction = best_result['reduction_percent']
    target_achieved = False
    if level == "low" and reduction >= 10:
        target_achieved = True
    elif level == "medium" and reduction >= 35:
        target_achieved = True
    elif level == "high" and reduction >= 75:
        target_achieved = True

    best_result['target_achieved'] = target_achieved
    best_result['analysis'] = analysis
    best_result['candidates_tried'] = candidates_tried

    return best_result


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_compressor.py <input.pdf> <output.pdf> [low|medium|high]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    level = sys.argv[3] if len(sys.argv) == 4 else "medium"

    if level not in ('low', 'medium', 'high'):
        print(json.dumps({"success": False, "error": f"Invalid level: {level}. Use 'low', 'medium', or 'high'"}))
        sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = compress_pdf(input_path, output_path, level)
    print(json.dumps(result))


if __name__ == "__main__":
    main()