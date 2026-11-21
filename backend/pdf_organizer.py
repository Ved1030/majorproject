#!/usr/bin/env python3
"""
PDF Organize processor using pypdf.

Reorders, rotates and removes pages from a single PDF without rasterizing
content. Searchable text, images, vector graphics and page dimensions are
preserved by importing original page objects into a fresh PdfWriter.

Usage:
    python pdf_organizer.py <output.pdf> <input.pdf> <request.json>
    python pdf_organizer.py --check

The request JSON must contain a non-empty "pages" array. Each entry identifies
an original zero-based page index and the extra clockwise rotation to apply:

    {
      "pages": [
        {"originalPage": 0, "rotation": 90},
        {"originalPage": 2, "rotation": 0}
      ]
    }

A single JSON object is printed on the last line of stdout.
"""

import json
import os
import sys
from importlib.metadata import version, PackageNotFoundError

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.errors import PdfReadError, FileNotDecryptedError, WrongPasswordError

    PYPDF_IMPORT_ERROR = None
except Exception as exc:  # pragma: no cover - depends on environment
    PdfReader = None
    PdfWriter = None
    PdfReadError = Exception
    FileNotDecryptedError = Exception
    WrongPasswordError = Exception
    PYPDF_IMPORT_ERROR = exc

PDF_SIGNATURE = b"%PDF-"
VALID_ROTATIONS = {0, 90, 180, 270}


def _code_for(error_key):
    return {
        "missing_dependency": "MISSING_DEPENDENCY",
        "not_found": "NOT_FOUND",
        "empty_file": "EMPTY_FILE",
        "not_pdf": "INVALID_INPUT",
        "invalid_request": "INVALID_INPUT",
        "password_protected": "PASSWORD_PROTECTED",
        "corrupt": "CORRUPTED_FILE",
        "organize_failed": "CONVERSION_FAILED",
    }.get(error_key, "CONVERSION_FAILED")


def _error(error_key, message):
    return {"success": False, "error": message, "code": _code_for(error_key)}


def check_environment():
    """Report interpreter and dependency status without processing a PDF."""
    if PdfReader is None or PdfWriter is None:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": sys.version.split()[0],
            "error": f"{type(PYPDF_IMPORT_ERROR).__name__}: {PYPDF_IMPORT_ERROR}",
            "code": "MISSING_DEPENDENCY",
        }

    try:
        package_version = version("pypdf")
    except PackageNotFoundError:
        package_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": sys.version.split()[0],
        "pypdf_version": package_version,
    }


def _is_pdf_signature(path):
    try:
        with open(path, "rb") as f:
            return f.read(5) == PDF_SIGNATURE
    except OSError:
        return False


def _read_pdf(path):
    """Open and validate a PDF. Returns (reader, error_dict)."""
    if not os.path.exists(path):
        return None, _error("not_found", "Input file not found")

    try:
        file_size = os.path.getsize(path)
    except OSError:
        return None, _error("not_found", "Cannot read input file")

    if file_size == 0:
        return None, _error("empty_file", "Empty file uploaded")

    if not _is_pdf_signature(path):
        return None, _error("not_pdf", "File is not a valid PDF")

    try:
        reader = PdfReader(path)
    except WrongPasswordError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be organized without a password",
        )
    except PdfReadError as exc:
        return None, _error("corrupt", f"Corrupt or unreadable PDF: {exc}")
    except Exception as exc:  # pragma: no cover - defensive
        return None, _error("corrupt", f"Failed to open PDF: {exc}")

    if getattr(reader, "is_encrypted", False):
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be organized without a password",
        )

    try:
        # Force the page tree to parse so corrupt documents fail before writing.
        _ = len(reader.pages)
    except FileNotDecryptedError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be organized without a password",
        )
    except WrongPasswordError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be organized without a password",
        )
    except PdfReadError as exc:
        return None, _error("corrupt", f"Corrupt or unreadable PDF: {exc}")
    except Exception as exc:  # pragma: no cover - defensive
        return None, _error("corrupt", f"Failed to read PDF pages: {exc}")

    return reader, None


def _parse_request(raw, page_count):
    """Parse and validate the requested page arrangement.

    Returns (pages, None) or (None, error_dict). Each returned item is
    (original_zero_based_index, extra_clockwise_rotation).
    """
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None, _error("invalid_request", "Organize request must be valid JSON")

    if not isinstance(data, dict):
        return None, _error("invalid_request", "Organize request must be an object")

    requested_pages = data.get("pages")
    if not isinstance(requested_pages, list) or len(requested_pages) == 0:
        return None, _error("invalid_request", "At least one page must remain in the PDF")

    parsed = []
    seen = set()
    for idx, entry in enumerate(requested_pages):
        if not isinstance(entry, dict):
            return None, _error(
                "invalid_request",
                f"Page entry #{idx + 1} must be an object",
            )

        original_page = entry.get("originalPage")
        rotation = entry.get("rotation")

        if not isinstance(original_page, int) or isinstance(original_page, bool):
            return None, _error(
                "invalid_request",
                f"Page entry #{idx + 1} originalPage must be a whole number",
            )
        if original_page < 0 or original_page >= page_count:
            return None, _error(
                "invalid_request",
                f"Page entry #{idx + 1} originalPage is outside the document",
            )
        if original_page in seen:
            return None, _error(
                "invalid_request",
                f"Original page {original_page + 1} appears more than once",
            )
        if not isinstance(rotation, int) or isinstance(rotation, bool):
            return None, _error(
                "invalid_request",
                f"Page entry #{idx + 1} rotation must be a whole number",
            )
        if rotation not in VALID_ROTATIONS:
            return None, _error(
                "invalid_request",
                f"Page entry #{idx + 1} rotation must be 0, 90, 180 or 270",
            )

        seen.add(original_page)
        parsed.append((original_page, rotation))

    return parsed, None


def _rotation_of(page):
    try:
        return int(page.get("/Rotate", 0)) % 360
    except Exception:
        return 0


def _media_size(page):
    try:
        box = page.mediabox
        return float(box.width), float(box.height)
    except Exception:
        return None


def organize_pdf(output_path, input_path, request_path):
    """Apply the requested arrangement and write a validated output PDF."""
    if PdfReader is None or PdfWriter is None:
        return _error(
            "missing_dependency",
            f"pypdf import failed: {PYPDF_IMPORT_ERROR}",
        )

    if not os.path.isfile(request_path):
        return _error("invalid_request", "Organize request file not found")

    try:
        with open(request_path, "r", encoding="utf-8") as f:
            raw_request = f.read()
    except OSError:
        return _error("invalid_request", "Cannot read organize request")

    reader, err = _read_pdf(input_path)
    if err:
        return err

    try:
        page_count = len(reader.pages)
    except Exception as exc:  # pragma: no cover - defensive
        try:
            reader.close()
        except Exception:
            pass
        return _error("corrupt", f"Failed to read PDF pages: {exc}")

    requested_pages, err = _parse_request(raw_request, page_count)
    if err:
        try:
            reader.close()
        except Exception:
            pass
        return err

    original_sizes = []
    original_rotations = []
    try:
        for page in reader.pages:
            original_sizes.append(_media_size(page))
            original_rotations.append(_rotation_of(page))
    except Exception as exc:  # pragma: no cover - defensive
        try:
            reader.close()
        except Exception:
            pass
        return _error("corrupt", f"Failed to inspect PDF pages: {exc}")

    writer = PdfWriter()
    try:
        for original_page, extra_rotation in requested_pages:
            page = reader.pages[original_page]
            if extra_rotation:
                # pypdf adds this to the original page's existing rotation.
                page.rotate(extra_rotation)
            writer.add_page(page)

        writer.add_metadata({
            "/Title": "Organized by ZipDrop",
            "/Producer": "ZipDrop PDF Organize",
        })

        with open(output_path, "wb") as out_file:
            writer.write(out_file)
    except Exception as exc:
        return _error("organize_failed", f"PDF organization failed: {exc}")
    finally:
        try:
            writer.close()
        except Exception:
            pass
        try:
            reader.close()
        except Exception:
            pass

    # Reopen and validate the generated file before reporting success.
    out_reader = None
    try:
        out_reader = PdfReader(output_path)
        output_pages = out_reader.pages
        output_page_count = len(output_pages)
        if output_page_count != len(requested_pages):
            return _error(
                "organize_failed",
                f"Page count mismatch: expected {len(requested_pages)}, got {output_page_count}",
            )

        for out_index, (original_page, extra_rotation) in enumerate(requested_pages):
            out_page = output_pages[out_index]
            actual_rotation = _rotation_of(out_page)
            expected_rotation = (
                original_rotations[original_page] + extra_rotation
            ) % 360
            if actual_rotation != expected_rotation:
                return _error(
                    "organize_failed",
                    "Generated page rotation could not be validated",
                )

            actual_size = _media_size(out_page)
            expected_size = original_sizes[original_page]
            if actual_size is None or expected_size is None:
                return _error(
                    "organize_failed",
                    "Generated page dimensions could not be validated",
                )
            if (
                abs(actual_size[0] - expected_size[0]) > 0.01
                or abs(actual_size[1] - expected_size[1]) > 0.01
            ):
                return _error(
                    "organize_failed",
                    "Generated page dimensions did not match the original page",
                )
    except Exception as exc:
        return _error("organize_failed", f"Generated output could not be validated: {exc}")
    finally:
        if out_reader is not None:
            try:
                out_reader.close()
            except Exception:
                pass

    try:
        output_size = os.path.getsize(output_path)
    except OSError:
        output_size = 0

    return {
        "success": True,
        "output_path": output_path,
        "input_pages": page_count,
        "page_count": output_page_count,
        "deleted_pages": page_count - output_page_count,
        "rotated_pages": sum(1 for _, rotation in requested_pages if rotation != 0),
        "output_size": output_size,
    }


def main():
    try:
        if len(sys.argv) == 2 and sys.argv[1] == "--check":
            print(json.dumps(check_environment()))
            return

        if len(sys.argv) != 4:
            print(json.dumps(_error(
                "invalid_request",
                "Usage: python pdf_organizer.py <output.pdf> <input.pdf> <request.json>",
            )))
            return

        result = organize_pdf(sys.argv[1], sys.argv[2], sys.argv[3])
        print(json.dumps(result))
    except Exception:  # pragma: no cover - defensive, never leak tracebacks
        print(json.dumps(_error("organize_failed", "PDF organization failed")))


if __name__ == "__main__":
    main()