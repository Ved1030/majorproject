#!/usr/bin/env python3
"""
PDF Merge processor using pypdf.

Merges multiple PDF files in the exact supplied order, preserving page
dimensions, page rotations, text, vector graphics, embedded images, links
and bookmarks where supported by the library.

Usage:
    python pdf_merger.py <output.pdf> <input1.pdf> <input2.pdf> [inputN.pdf]
    python pdf_merger.py --check

A single JSON object is printed on the last line of stdout.
"""

import sys
import os
import json
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
        "too_many_files": "FILE_TOO_LARGE",
        "password_protected": "PASSWORD_PROTECTED",
        "corrupt": "CORRUPTED_FILE",
        "merge_failed": "CONVERSION_FAILED",
    }.get(error_key, "CONVERSION_FAILED")


def _error(error_key, message):
    return {"success": False, "error": message, "code": _code_for(error_key)}


def check_environment():
    """Report interpreter and dependency status without merging."""
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
            "Password-protected PDF cannot be merged without a password",
        )
    except Exception as exc:  # pragma: no cover - defensive
        return None, _error("corrupt", f"Failed to open PDF: {exc}")

    if getattr(reader, "is_encrypted", False):
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be merged without a password",
        )

    try:
        # Force parsing of the page tree to catch corrupt files early.
        pages = reader.pages
        page_count = len(pages)
    except FileNotDecryptedError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be merged without a password",
        )
    except WrongPasswordError:
        return None, _error(
            "password_protected",
            "Password-protected PDF cannot be merged without a password",
        )
    except PdfReadError as exc:
        return None, _error("corrupt", f"Corrupt or unreadable PDF: {exc}")
    except Exception as exc:  # pragma: no cover - defensive
        return None, _error("corrupt", f"Failed to read PDF pages: {exc}")

    return page_count, None


def merge_pdfs(output_path, input_paths):
    """Merge input PDFs in order into output_path. Returns a result dict."""
    if PdfReader is None or PdfWriter is None:
        return _error(
            "missing_dependency",
            f"pypdf import failed: {PYPDF_IMPORT_ERROR}",
        )

    if not input_paths:
        return _error("not_found", "No input PDFs provided")

    if len(input_paths) > 10:
        return _error("too_many_files", "Maximum of 10 PDF files can be merged at once")

    # Validate every input up front so one bad file does not crash the merge.
    readers = []
    total_pages = 0
    original_total_size = 0
    for path in input_paths:
        page_count, err = _validate_and_count(path)
        if err:
            return err
        try:
            original_total_size += os.path.getsize(path)
        except OSError:
            pass
        try:
            reader = PdfReader(path)
        except Exception as exc:  # pragma: no cover - defensive
            return _error("corrupt", f"Failed to open PDF: {exc}")
        readers.append(reader)
        total_pages += page_count

    writer = PdfWriter()
    try:
        for reader in readers:
            # append preserves page dimensions, rotations, content streams and
            # imports bookmarks/outlines where supported by pypdf.
            writer.append(reader, import_outline=True)

        # Identifying metadata helps traceability without altering content.
        writer.add_metadata({
            "/Title": "Merged by ZipDrop",
            "/Producer": "ZipDrop PDF Merge",
        })

        with open(output_path, "wb") as out_file:
            writer.write(out_file)
    except Exception as exc:
        return _error("merge_failed", f"PDF merge failed: {exc}")
    finally:
        for reader in readers:
            try:
                reader.close()
            except Exception:
                pass
        try:
            writer.close()
        except Exception:
            pass

    # Reopen the generated output to validate it.
    try:
        out_reader = PdfReader(output_path)
    except Exception as exc:
        return _error("merge_failed", f"Generated output could not be opened: {exc}")

    output_page_count = len(out_reader.pages)
    if output_page_count != total_pages:
        try:
            out_reader.close()
        except Exception:
            pass
        return _error(
            "merge_failed",
            f"Page count mismatch: expected {total_pages}, got {output_page_count}",
        )

    try:
        output_size = os.path.getsize(output_path)
    except OSError:
        output_size = 0

    try:
        out_reader.close()
    except Exception:
        pass

    return {
        "success": True,
        "output_path": output_path,
        "page_count": output_page_count,
        "input_files": len(input_paths),
        "original_total_size": original_total_size,
        "output_size": output_size,
    }


def main():
    try:
        if len(sys.argv) == 2 and sys.argv[1] == "--check":
            print(json.dumps(check_environment()))
            return

        # Usage: python pdf_merger.py <output.pdf> <input1.pdf> [input2.pdf ...]
        if len(sys.argv) < 3:
            print(json.dumps(_error("not_found", "Usage: python pdf_merger.py <output.pdf> <input1.pdf> [input2.pdf ...]")))
            return

        output_path = sys.argv[1]
        input_paths = sys.argv[2:]

        result = merge_pdfs(output_path, input_paths)
        print(json.dumps(result))
    except Exception as exc:  # pragma: no cover - defensive, never leak tracebacks
        print(json.dumps(_error("merge_failed", "PDF merge failed")))


if __name__ == "__main__":
    main()
