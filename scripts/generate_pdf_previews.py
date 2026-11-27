#!/usr/bin/env python3
"""Make real first-page card previews from published project PDFs."""
from pathlib import Path
import fitz
from PIL import Image
import io

source = Path("assets/pdfs")
destination = Path("assets/previews")
destination.mkdir(parents=True, exist_ok=True)

for pdf_file in sorted(source.glob("*.pdf")):
    if pdf_file.stem == "reader-demo":
        continue
    try:
        with fitz.open(pdf_file) as document:
            if not len(document):
                continue
            page = document[0]
            scale = 900 / page.rect.width
            pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            output = destination / (pdf_file.stem + ".jpg")
            image.save(output, "JPEG", quality=78, optimize=True, progressive=True)
            print(f"{pdf_file} -> {output} ({output.stat().st_size} bytes)")
    except Exception as error:
        print(f"Could not render {pdf_file}: {error}")
        raise
