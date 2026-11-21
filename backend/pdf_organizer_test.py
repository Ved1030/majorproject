#!/usr/bin/env python3
"""Tests for the pypdf-based PDF organizer."""

import io
import json
import os
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader
from reportlab.pdfgen import canvas

from pdf_organizer import _read_pdf, organize_pdf


def make_pdf(path, sizes, labels=None):
    labels = labels or [f"Page {index + 1}" for index in range(len(sizes))]
    pdf = canvas.Canvas(str(path))
    try:
        for index, (width, height) in enumerate(sizes):
            if index:
                pdf.showPage()
            pdf.setPageSize((width, height))
            pdf.setFont("Helvetica", 24)
            pdf.drawString(72, height - 96, labels[index])
    finally:
        pdf.save()


def organize_bytes(input_path, pages):
    with tempfile.TemporaryDirectory() as work_dir:
        request_path = os.path.join(work_dir, "request.json")
        output_path = os.path.join(work_dir, "output.pdf")
        with open(request_path, "w", encoding="utf-8") as request_file:
            json.dump({"pages": pages}, request_file)

        result = organize_pdf(output_path, str(input_path), request_path)
        if result.get("success"):
            with open(output_path, "rb") as output_file:
                data = output_file.read()
        else:
            data = b""
        return result, data


class PdfOrganizerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)

    def make_input(self, sizes, labels=None):
        path = Path(self.temp_dir.name) / f"input_{len(sizes)}_{len(os.listdir(self.temp_dir.name))}.pdf"
        make_pdf(path, sizes, labels)
        return path

    def assert_output(self, data, expected_labels, expected_sizes, expected_rotations):
        reader = PdfReader(io.BytesIO(data))
        self.assertEqual(len(reader.pages), len(expected_labels))
        for index, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            self.assertIn(expected_labels[index], text)
            size = (round(float(page.mediabox.width), 2), round(float(page.mediabox.height), 2))
            self.assertEqual(size, expected_sizes[index])
            self.assertEqual(int(page.get("/Rotate", 0)) % 360, expected_rotations[index])
        reader.close()

    def test_single_page_round_trip(self):
        source = self.make_input([(612, 792)], ["Only page"])
        result, data = organize_bytes(source, [{"originalPage": 0, "rotation": 0}])
        self.assertTrue(result["success"], result)
        self.assertEqual(result["page_count"], 1)
        self.assert_output(data, ["Only page"], [(612, 792)], [0])

    def test_seven_pages_reorder_rotate_and_delete(self):
        sizes = [(612, 792)] * 7
        source = self.make_input(sizes)
        pages = [
            {"originalPage": 2, "rotation": 90},
            {"originalPage": 0, "rotation": 0},
            {"originalPage": 6, "rotation": 180},
            {"originalPage": 4, "rotation": 270},
        ]
        result, data = organize_bytes(source, pages)
        self.assertTrue(result["success"], result)
        self.assertEqual(result["input_pages"], 7)
        self.assertEqual(result["page_count"], 4)
        self.assertEqual(result["deleted_pages"], 3)
        self.assertEqual(result["rotated_pages"], 3)
        self.assert_output(
            data,
            ["Page 3", "Page 1", "Page 7", "Page 5"],
            sizes[:4],
            [90, 0, 180, 270],
        )
        reader = PdfReader(io.BytesIO(data))
        all_text = "\n".join((page.extract_text() or "") for page in reader.pages)
        reader.close()
        for deleted_label in ["Page 2", "Page 4", "Page 6"]:
            self.assertNotIn(deleted_label, all_text)

    def test_fifty_pages_reversed(self):
        sizes = [(612, 792)] * 50
        source = self.make_input(sizes)
        pages = [
            {"originalPage": index, "rotation": 90 if index % 2 else 270}
            for index in range(49, -1, -1)
        ]
        result, data = organize_bytes(source, pages)
        self.assertTrue(result["success"], result)
        self.assertEqual(result["page_count"], 50)
        self.assertEqual(result["deleted_pages"], 0)

        reader = PdfReader(io.BytesIO(data))
        self.assertEqual(len(reader.pages), 50)
        self.assertIn("Page 50", reader.pages[0].extract_text() or "")
        self.assertIn("Page 1", reader.pages[-1].extract_text() or "")
        self.assertEqual(int(reader.pages[0].get("/Rotate", 0)) % 360, 90)
        self.assertEqual(int(reader.pages[-1].get("/Rotate", 0)) % 360, 270)
        reader.close()

    def test_mixed_page_sizes_are_preserved(self):
        sizes = [(612, 792), (842, 595), (300, 400), (1000, 500)]
        source = self.make_input(sizes)
        pages = [
            {"originalPage": 2, "rotation": 90},
            {"originalPage": 0, "rotation": 180},
            {"originalPage": 3, "rotation": 270},
            {"originalPage": 1, "rotation": 0},
        ]
        result, data = organize_bytes(source, pages)
        self.assertTrue(result["success"], result)
        self.assert_output(
            data,
            ["Page 3", "Page 1", "Page 4", "Page 2"],
            [sizes[2], sizes[0], sizes[3], sizes[1]],
            [90, 180, 270, 0],
        )

    def test_duplicate_pages_are_rejected(self):
        source = self.make_input([(612, 792), (612, 792)])
        result, _ = organize_bytes(
            source,
            [
                {"originalPage": 0, "rotation": 0},
                {"originalPage": 0, "rotation": 90},
            ],
        )
        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "INVALID_INPUT")

    def test_invalid_rotation_and_page_index_are_rejected(self):
        source = self.make_input([(612, 792), (612, 792)])
        invalid_rotation, _ = organize_bytes(
            source,
            [{"originalPage": 0, "rotation": 45}],
        )
        self.assertFalse(invalid_rotation["success"])
        self.assertEqual(invalid_rotation["code"], "INVALID_INPUT")

        invalid_page, _ = organize_bytes(
            source,
            [{"originalPage": 2, "rotation": 0}],
        )
        self.assertFalse(invalid_page["success"])
        self.assertEqual(invalid_page["code"], "INVALID_INPUT")

    def test_corrupt_and_encrypted_pdfs_are_rejected(self):
        corrupt_path = Path(__file__).with_name("bad_corrupt.pdf")
        if corrupt_path.exists():
            reader, error = _read_pdf(str(corrupt_path))
            self.assertIsNone(reader)
            self.assertEqual(error["code"], "CORRUPTED_FILE")

        protected_path = Path(__file__).with_name("bad_protected.pdf")
        if protected_path.exists():
            reader, error = _read_pdf(str(protected_path))
            self.assertIsNone(reader)
            self.assertEqual(error["code"], "PASSWORD_PROTECTED")


if __name__ == "__main__":
    unittest.main()