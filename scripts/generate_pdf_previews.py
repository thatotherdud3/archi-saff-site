#!/usr/bin/env python3
"""Generate only project-grid covers, from page one of each main design PDF."""
from pathlib import Path
import re

import fitz
from PIL import Image


root = Path(__file__).resolve().parents[1]
data = (root / "projects-data.js").read_text(encoding="utf-8")
out_dir = root / "assets" / "previews"
pdf_root = (root / "assets" / "pdfs").resolve()
out_dir.mkdir(parents=True, exist_ok=True)

# The project catalogue is JS, not JSON. Read its top-level project blocks
# without executing JS or processing journal/photography PDFs as covers.
blocks = re.findall(r"(?ms)^  \{\s*\n(.*?)^  \},?", data)
if not blocks:
    raise RuntimeError("No projects found in projects-data.js")

for block in blocks:
    id_match = re.search(r'\bid:\s*"([a-z0-9-]+)"', block)
    pdf_match = re.search(r'^\s*pdf:\s*"([^"]+)"', block, re.M)
    if not id_match or not pdf_match:
        continue

    project_id, relative_pdf = id_match.group(1), pdf_match.group(1)
    if not relative_pdf.startswith("assets/pdfs/"):
        raise ValueError(f"Cover path outside assets/pdfs: {relative_pdf}")
    path = (root / relative_pdf).resolve()
    if not path.is_relative_to(pdf_root):
        raise ValueError(f"Unsafe cover path: {relative_pdf}")
    if not path.is_file():
        raise FileNotFoundError(f"Missing project design PDF: {path}")

    with fitz.open(path) as pdf:
        if not pdf.page_count:
            raise ValueError(f"Project design PDF has no pages: {path}")
        first_page = pdf[0]
        scale = 900 / first_page.rect.width
        pix = first_page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        dest = out_dir / f"{project_id}.jpg"
        image.save(dest, "JPEG", quality=78, optimize=True, progressive=True)
        print(f"{relative_pdf} -> {dest.relative_to(root)} ({dest.stat().st_size} bytes)")
