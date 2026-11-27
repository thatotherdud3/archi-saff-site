# Adding Saffron's PDF projects

The Projects page is already linked to a reusable project viewer. No new HTML page is needed per project.

1. Add each exported project PDF to `assets/pdfs/` (e.g. `assets/pdfs/hillside-house.pdf`). Keep filenames short and use lowercase letters, digits and hyphens.
2. Open `projects-data.js`. Find the matching project entry and change `pdf: null` to `pdf: "assets/pdfs/hillside-house.pdf"`.
3. Replace its placeholder `title`, `category`, `location`, `year` and `description` when Saffron supplies final content.
4. **Archway Markets / Timber Shop** is already entered as project `001`. Upload the supplied optimised two-page PDF as `assets/pdfs/archway-markets.pdf`, then change its `pdf: null` to `pdf: "assets/pdfs/archway-markets.pdf"` in `projects-data.js`. The demo PDF remains in the repo for reference but is no longer linked to a project. The project year is deliberately marked TBC pending confirmation.
5. Open `projects.html`, select the card and verify page count, zoom, next/previous, fullscreen, open and download on desktop and mobile.

The PDF viewer uses a pinned PDF.js CDN script to render documents into a canvas, and falls back to the browser's built-in PDF viewer if the library is unavailable. PDFs are only loaded when a visitor opens a project page, not on the grid page. If a project's `pdf` is `null`, a clean coming-soon state appears instead.

### File and deployment notes

- Commit PDFs to this static site's `assets/pdfs` folder. Avoid very large PDFs; optimise/compress them for web delivery before publishing. GitHub imposes repository file limits.
- Test the site through its deployed URL or a local HTTP server (not `file://`). The viewer expects same-origin PDFs in the assets folder.
- Never link confidential project documents here: files published in the public website are accessible and downloadable.
- This is a public **viewer**, not an upload dashboard. Replacing PDFs is currently a repository update; a future WordPress CMS can manage the same data model.
