# Adding Saffron's project documents

The Projects grid opens a shared project page. Each project can show three chapters:

1. **Project Design** — one PDF containing the presentation and its chosen first-page cover.
2. **Design & Technical Journal** — one or more separate journal PDFs.
3. **Model Photography** — a separate PDF when available.

Edit `projects-data.js` for each project. Set `pdf` to its design presentation, `journalPdfs` to an array of journal PDFs (title and path), and `modelPhotographyPdf` to the photography PDF path or `null` until it is ready. The project title, description, location, year and category also live here. These fields will eventually move into WordPress/Elementor rather than requiring code edits.

Example:

```js
pdf: "assets/pdfs/my-project/project-design.pdf",
journalPdfs: [
  { title: "DESIGN JOURNAL", path: "assets/pdfs/my-project/design-journal.pdf" },
  { title: "TECHNICAL JOURNAL", path: "assets/pdfs/my-project/technical-journal.pdf" }
],
modelPhotographyPdf: "assets/pdfs/my-project/model-photography.pdf"
```

Keep PDF paths relative to the website, in `assets/pdfs/` (subfolders are supported), with filenames matching the repository exactly. Rename new uploads to short, lowercase, hyphenated names where possible. The viewer supports existing file names containing spaces as well.

### Archway Markets

- Project Design: `assets/pdfs/Archway_Markets_Timber_Shop_Web.pdf` — live
- Design Journal: `assets/pdfs/5123ASA-Saffron Jones-Design Journal.pdf` — live
- Technical Journal: `assets/pdfs/Tech journal.pdf` — live
- Model Photography: not linked yet. The newly uploaded file is titled *Tech Journal*, so it is displayed as a journal rather than mislabelled as a separate photography collection. Set `modelPhotographyPdf` when a distinct photography PDF is identified.

The Projects grid cover is generated **only from the first page of the main project design PDF**, never from journals. Keep cover content away from document edges. The generated card image is stored in `assets/previews/<project-id>.jpg`.

All viewers load lazily as visitors scroll down, with their own page navigation, zoom, fullscreen, open and download actions. If PDF.js fails, an inline browser PDF viewer is used. Large PDFs (the current journals are roughly 30 MB each) may load slowly on mobile; compress them before launch if possible.

### Publishing

The PDFs are publicly accessible. Test through the deployed site or a local HTTP server, not `file://`, and only upload content Saffron is happy to publish. No upload dashboard exists in this static build. The future WordPress implementation should use custom fields or an Elementor-compatible project template with three file groups.
