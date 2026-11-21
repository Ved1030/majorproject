#!/usr/bin/env python3
"""
PDF Split processor using pypdf.

Splits a single PDF into multiple output PDFs using one of three modes:
  - ranges:   user-defined page ranges (e.g. 1-5, 6-10)
  - every_n:  every N pages per output file
  - every_page: one output file per page

Preserves page content, dimensions, rotation, searchable text, images and
vector graphics by importing each source page into a fresh PdfWriter.

Usage:
    python pdf_splitter.py <output_dir> <input.pdf> <mode> [mode_args]
    python pdf_splitter.py --check

Modes:
    ranges   <output_dir> <input.pdf> ranges  '<json array of {start,end}>'
    every_n  <output_dir> <input.pdf> every_n <n>
    every_page <output_dir> <input.pdf> every_page

A single JSON object is printed on the last line of stdout.
"""

import sys
import os
import json
import re
import traceback
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


def _code_for(error_key):
    return {
        "missing_dependency": "MISSING_DEPENDENCY",
        "not_found": "NOT_FOUND",
        "empty_file": "EMPTY_FILE",
        "not_pdf": "INVALID_INPUT",
        "invalid_ranges": "INVALID_INPUT",
        "password_protected": "PASSWORD_PROTECTED",
        "corrupt": "CORRUPTED_FILE",
        "split_failed": "CONVERSION_FAILED",
    }.get(error_key, "CONVERSION_FAILED")


def _error(error_key, message):
    return {"success": False, "error": message, "code": _code_for(error_key)}


def check_environment():
    """Report interpreter and dependency status without splitting."""
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
            header = f.read(5)
        return header == PDF_SIGNATURE
    except OSError:
        return False


def _sanitize_base(name):
    """Derive a safe filesystem base name from an input filename."""
    base = os.path.splitext(os.path.basename(name))[0]
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base)
    return base or "document"


def _validate_and_count(path):
    """Open and validate a single PDF. Returns (page_count, None) or (None, error_dict)."""
    if not os.path.exists(path):
        return None, _error("not_found", f"Input file not found: {path}")

    try:
        file_size = os.path.getsize(path)
    except OSError:
        return None, _error("not_found", f"Cannot read input file: {path}")

    if file_size == 0:
        return None, _error("empty_file", "Empty file uploaded")

    if not _is_pdf_signature(path):
        return None, _error("not_pdf", "File is not a valid PDF")

    try:
        reader = PdfReader(path)
    except PdfReadError as exc:
        return None, _error("corrupt", f"Corrupt or unreadable PDF: {exc}")
    except WrongPasswordError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be split without a password",
        )
    except Exception as exc:  # pragma: no cover - defensive
        return None, _error("corrupt", f"Failed to open PDF: {exc}")

    if getattr(reader, "is_encrypted", False):
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be split without a password",
        )

    try:
        # Force parsing of the page tree to catch corrupt files early.
        pages = reader.pages
        page_count = len(pages)
    except FileNotDecryptedError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be split without a password",
        )
    except WrongPasswordError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be split without a password",
        )
    except PdfReadError as exc:
        return None, _error("corrupt", f"Corrupt or unreadable PDF: {exc}")
    except Exception as exc:  # pragma: no cover - defensive
        return None, _error("corrupt", f"Failed to read PDF pages: {exc}")

    return page_count, None


def _parse_ranges(raw, total_pages):
    """Parse and validate a JSON array of {start, end} ranges.

    Returns (list_of_(start,end), None) or (None, error_dict).
    Ranges are inclusive and 1-based. Overlapping ranges are rejected.
    """
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None, _error("invalid_ranges", "Ranges must be a valid JSON array")

    if not isinstance(data, list) or len(data) == 0:
        return None, _error("invalid_ranges", "At least one page range is required")

    parsed = []
    for idx, entry in enumerate(data):
        if not isinstance(entry, dict):
            return None, _error(
                "invalid_ranges",
                f"Range #{idx + 1} must be an object with start and end",
            )
        start = entry.get("start")
        end = entry.get("end")
        if not isinstance(start, int) or isinstance(start, bool):
            return None, _error(
                "invalid_ranges",
                f"Range #{idx + 1} start must be a whole number",
            )
        if not isinstance(end, int) or isinstance(end, bool):
            return None, _error(
                "invalid_ranges",
                f"Range #{idx + 1} end must be a whole number",
            )
        if start < 1:
            return None, _error(
                "invalid_ranges",
                f"Range #{idx + 1} start page must be at least 1",
            )
        if end < start:
            return None, _error(
                "invalid_ranges",
                f"Range #{idx + 1} end page ({end}) must be greater than or equal to start page ({start})",
            )
        if end > total_pages:
            return None, _error(
                "invalid_ranges",
                f"Range #{idx + 1} end page ({end}) exceeds total pages ({total_pages})",
            )
        parsed.append((start, end))

    # Reject overlapping ranges.
    parsed.sort(key=lambda r: (r[0], r[1]))
    for i in range(1, len(parsed)):
        prev_start, prev_end = parsed[i - 1]
        cur_start, cur_end = parsed[i]
        if cur_start <= prev_end:
            return None, _error(
                "invalid_ranges",
                f"Ranges overlap: pages {prev_start}-{prev_end} and {cur_start}-{cur_end} share page(s)",
            )

    return parsed, None


def _write_split(output_dir, base, reader, page_numbers, part_label):
    """Write a single split PDF containing the given 1-based page numbers.

    Returns the output filename.
    """
    writer = PdfWriter()
    for p in page_numbers:
        # add_page preserves content, mediabox (dimensions), rotation and all
        # page attributes (text, images, vector graphics).
        writer.add_page(reader.pages[p - 1])

    writer.add_metadata({
        "/Title": "Split by ZipDrop",
        "/Producer": "ZipDrop PDF Split",
    })

    filename = f"{base}_{part_label}.pdf"
    output_path = os.path.join(output_dir, filename)
    with open(output_path, "wb") as out_file:
        writer.write(out_file)

    try:
        writer.close()
    except Exception:
        pass

    return filename


def split_pdfs(output_dir, input_path, mode, mode_arg):
    """Split input_path into multiple PDFs in output_dir. Returns a result dict."""
    if PdfReader is None or PdfWriter is None:
        return _error(
            "missing_dependency",
            f"pypdf import failed: {PYPDF_IMPORT_ERROR}",
        )

    if not os.path.isdir(output_dir):
        try:
            os.makedirs(output_dir, exist_ok=True)
        except OSError as exc:
            return _error("not_found", f"Cannot create output directory: {exc}")

    page_count, err = _validate_and_count(input_path)
    if err:
        return err

    base = _sanitize_base(input_path)
    reader = PdfReader(input_path)

    outputs = []
    try:
        if mode == "ranges":
            ranges, err = _parse_ranges(mode_arg, page_count)
            if err:
                return err
            part_index = 1
            for start, end in ranges:
                page_numbers = list(range(start, end + 1))
                filename = _write_split(
                    output_dir, base, reader, page_numbers,
                    f"pages_{start}-{end}",
                )
                outputs.append({
                    "filename": filename,
                    "pages": f"{start}-{end}",
                    "page_count": len(page_numbers),
                    "page_numbers": page_numbers,
                })
                part_index += 1

        elif mode == "every_n":
            try:
                n = int(mode_arg)
            except (TypeError, ValueError):
                return _error("invalid_ranges", "Pages per file must be a whole number")
            if n < 1:
                return _error("invalid_ranges", "Pages per file must be at least 1")

            part_index = 1
            for start in range(1, page_count + 1, n):
                end = min(start + n - 1, page_count)
                page_numbers = list(range(start, end + 1))
                filename = _write_split(
                    output_dir, base, reader, page_numbers,
                    f"pages_{start}-{end}",
                )
                outputs.append({
                    "filename": filename,
                    "pages": f"{start}-{end}",
                    "page_count": len(page_numbers),
                    "page_numbers": page_numbers,
                })
                part_index += 1

        elif mode == "every_page":
            for p in range(1, page_count + 1):
                filename = _write_split(output_dir, base, reader, [p], f"page_{p}")
                outputs.append({
                    "filename": filename,
                    "pages": str(p),
                    "page_count": 1,
                    "page_numbers": [p],
                })

        else:
            return _error("invalid_ranges", f"Unknown split mode: {mode}")

    except Exception as exc:
        return _error("split_failed", f"PDF split failed: {exc}")
    finally:
        try:
            reader.close()
        except Exception:
            pass

    if not outputs:
        return _error("split_failed", "No output PDFs were generated")

    # Validate each generated output can be reopened.
    for out in outputs:
        out_path = os.path.join(output_dir, out["filename"])
        try:
            out_size = os.path.getsize(out_path)
        except OSError:
            out_size = 0
        out["size"] = out_size
        try:
            tmp = PdfReader(out_path)
            out["page_count"] = len(tmp.pages)
            tmp.close()
        except Exception as exc:
            return _error("split_failed", f"Generated output could not be validated: {exc}")

    return {
        "success": True,
        "mode": mode,
        "input_pages": page_count,
        "outputs": outputs,
    }


def main():
    try:
        if len(sys.argv) == 2 and sys.argv[1] == "--check":
            print(json.dumps(check_environment()))
            return

        # Usage: python pdf_splitter.py <output_dir> <input.pdf> <mode> [mode_arg]
        if len(sys.argv) < 4:
            print(json.dumps(_error("not_found",
                "Usage: python pdf_splitter.py <output_dir> <input.pdf> <mode> [mode_arg]")))
            return

        output_dir = sys.argv[1]
        input_path = sys.argv[2]
        mode = sys.argv[3]
        mode_arg = sys.argv[4] if len(sys.argv) >= 5 else ""

        result = split_pdfs(output_dir, input_path, mode, mode_arg)
        print(json.dumps(result))
    except Exception as exc:  # pragma: no cover - defensive, never leak tracebacks
        print(json.dumps(_error("split_failed", "PDF split failed")))


if __name__ == "__main__":
    main()
