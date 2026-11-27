/* Archi/Saff PDF project reader. Progressive enhancement: PDF.js when available,
   browser PDF iframe fallback when the library cannot load. */
(() => {
  "use strict";

  const projects = window.ArchiSaffProjects || [];
  const $ = selector => document.querySelector(selector);
  const id = new URLSearchParams(location.search).get("id");
  const currentIndex = projects.findIndex(item => item.id === id);
  const project = projects[currentIndex];
  const reader = $("#pdfReader");
  if (!reader) return;

  const heading = $("#projectTitle");
  const number = $("#projectNumber");
  const category = $("#projectCategory");
  const locationLabel = $("#projectLocation");
  const year = $("#projectYear");
  const description = $("#projectDescription");
  const demoNotice = $("#pdfDemoNotice");
  const nextLink = $("#nextProject");
  const nextName = $("#nextProjectName");
  const stage = $("#pdfStage");
  const toolbar = $("#pdfToolbar");
  const loading = $("#pdfLoading");
  const state = $("#pdfState");
  const stateTitle = $("#pdfStateTitle");
  const stateText = $("#pdfStateText");
  const canvas = $("#pdfCanvas");
  const nativeFrame = $("#pdfNative");
  const previous = $("#pdfPrevious");
  const next = $("#pdfNext");
  const pageInput = $("#pdfPage");
  const pageCount = $("#pdfPageCount");
  const zoomOut = $("#pdfZoomOut");
  const zoomIn = $("#pdfZoomIn");
  const zoomLabel = $("#pdfZoomLabel");
  const fitButton = $("#pdfFit");
  const fullscreenButton = $("#pdfFullscreen");
  const openLink = $("#pdfOpen");
  const downloadLink = $("#pdfDownload");
  const documentLabel = $("#pdfDocumentLabel");
  const pageAnnouncement = $("#pdfPageAnnouncement");

  const setState = (title, detail) => {
    stage.hidden = true;
    toolbar.hidden = true;
    state.hidden = false;
    stateTitle.textContent = title;
    stateText.textContent = detail;
  };

  const safePdfUrl = value => {
    if (typeof value !== "string" ||
        !/^assets\/pdfs\/[a-z0-9_-]+\.pdf$/i.test(value)) return null;
    const url = new URL(value, document.baseURI);
    return url.origin === location.origin ? url.href : null;
  };

  if (!project) {
    document.title = "Project not found — Archi/Saff";
    heading.textContent = "PROJECT NOT FOUND";
    description.textContent = "This project is not in the current catalogue.";
    $("#projectMeta").hidden = true;
    nextLink.hidden = true;
    setState("PROJECT NOT FOUND", "Return to Selected Projects to choose a project.");
    return;
  }

  document.title = project.title + " — Archi/Saff";
  heading.textContent = project.title;
  number.textContent = project.number;
  category.textContent = project.category;
  locationLabel.textContent = project.location;
  year.textContent = project.year;
  description.textContent = project.description;
  demoNotice.hidden = !project.demo;
  const following = projects[(currentIndex + 1) % projects.length];
  nextLink.href = "project.html?id=" + encodeURIComponent(following.id);
  nextName.textContent = following.title;

  const pdfUrl = safePdfUrl(project.pdf);
  if (!pdfUrl) {
    setState("PROJECT PDF COMING SOON",
      "The portfolio layout is ready. Saffron's PDF will appear here once it has been added.");
    return;
  }

  openLink.href = pdfUrl;
  downloadLink.href = pdfUrl;
  downloadLink.download = project.id + ".pdf";
  documentLabel.textContent = project.demo ? "DEMONSTRATION PDF" : "PROJECT PDF";
  state.hidden = true;
  stage.hidden = false;
  loading.hidden = false;
  toolbar.hidden = false;

  let documentHandle = null;
  let currentPage = 1;
  let totalPages = 0;
  let zoom = 100;
  let activeRender = null;
  let requestId = 0;
  let expanded = false;
  let touchStart = null;

  const updateControls = () => {
    previous.disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;
    pageInput.max = String(totalPages || 1);
    pageInput.value = String(currentPage);
    pageCount.textContent = String(totalPages || "–");
    zoomLabel.textContent = zoom + "%";
    zoomOut.disabled = zoom <= 75;
    zoomIn.disabled = zoom >= 200;
    pageAnnouncement.textContent = totalPages
      ? "Page " + currentPage + " of " + totalPages
      : "";
  };

  const fitScale = pageWidth => {
    const availableWidth = Math.max(160, stage.clientWidth - 48);
    return availableWidth / pageWidth;
  };

  async function renderPage() {
    if (!documentHandle) return;
    const thisRequest = ++requestId;
    if (activeRender) {
      activeRender.cancel();
      try { await activeRender.promise; } catch (_) { /* Expected on cancel. */ }
    }
    loading.hidden = false;
    canvas.hidden = true;
    try {
      const page = await documentHandle.getPage(currentPage);
      if (thisRequest !== requestId) return;
      const normal = page.getViewport({scale: 1});
      const viewport = page.getViewport({scale: fitScale(normal.width) * zoom / 100});
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      // Cap rendered pixels to avoid memory spikes on older mobile phones.
      const maxPixels = 6500000;
      const renderRatio = Math.min(pixelRatio,
        Math.sqrt(maxPixels / (viewport.width * viewport.height)));
      canvas.width = Math.max(1, Math.floor(viewport.width * renderRatio));
      canvas.height = Math.max(1, Math.floor(viewport.height * renderRatio));
      canvas.style.width = Math.round(viewport.width) + "px";
      canvas.style.height = Math.round(viewport.height) + "px";
      const context = canvas.getContext("2d", { alpha: false });
      context.setTransform(renderRatio, 0, 0, renderRatio, 0, 0);
      activeRender = page.render({canvasContext: context, viewport});
      await activeRender.promise;
      if (thisRequest !== requestId) return;
      loading.hidden = true;
      canvas.hidden = false;
      updateControls();
    } catch (error) {
      if (thisRequest !== requestId || error?.name === "RenderingCancelledException") return;
      useNativeViewer();
    }
  }

  function showError(message) {
    loading.hidden = true;
    stage.hidden = true;
    toolbar.hidden = true;
    setState("PDF UNAVAILABLE", message);
    openLink.hidden = false;
    downloadLink.hidden = false;
    state.append(openLink, downloadLink);
  }

  function changePage(page) {
    if (!documentHandle || !Number.isFinite(page)) return;
    const limited = Math.max(1, Math.min(totalPages, Math.round(page)));
    if (limited === currentPage) return;
    currentPage = limited;
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
    updateControls();
    renderPage();
  }

  function changeZoom(amount) {
    if (!documentHandle) return;
    zoom = Math.max(75, Math.min(200, amount));
    updateControls();
    renderPage();
  }

  previous.addEventListener("click", () => changePage(currentPage - 1));
  next.addEventListener("click", () => changePage(currentPage + 1));
  pageInput.addEventListener("change", () => {
    const entered = Number(pageInput.value);
    if (!Number.isFinite(entered) || entered < 1 || entered > totalPages) {
      updateControls();
      return;
    }
    changePage(entered);
  });
  zoomOut.addEventListener("click", () => changeZoom(zoom - 25));
  zoomIn.addEventListener("click", () => changeZoom(zoom + 25));
  fitButton.addEventListener("click", () => changeZoom(100));

  const updateFullscreenLabel = () => {
    const active = expanded || document.fullscreenElement === reader;
    fullscreenButton.setAttribute("aria-label", active ? "Exit full screen" : "View full screen");
    fullscreenButton.textContent = active ? "EXIT FULL SCREEN" : "FULL SCREEN";
  };

  fullscreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement === reader) {
      await document.exitFullscreen();
      return;
    }
    if (expanded) {
      expanded = false;
      reader.classList.remove("pdf-reader-expanded");
      document.body.classList.remove("pdf-reader-open");
      updateFullscreenLabel();
      renderPage();
      return;
    }
    if (reader.requestFullscreen) {
      try {
        await reader.requestFullscreen();
        updateFullscreenLabel();
        renderPage();
        return;
      } catch (_) { /* iOS and some browsers do not support element fullscreen. */ }
    }
    expanded = true;
    reader.classList.add("pdf-reader-expanded");
    document.body.classList.add("pdf-reader-open");
    updateFullscreenLabel();
    renderPage();
  });
  document.addEventListener("fullscreenchange", () => {
    updateFullscreenLabel();
    renderPage();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && expanded) {
      expanded = false;
      reader.classList.remove("pdf-reader-expanded");
      document.body.classList.remove("pdf-reader-open");
      updateFullscreenLabel();
      renderPage();
    }
    if (event.target.closest("input,button,a,select,textarea")) return;
    if (event.target !== stage && !reader.contains(document.activeElement)) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      changePage(currentPage + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      changePage(currentPage - 1);
    }
  });

  stage.addEventListener("touchstart", event => {
    if (zoom !== 100 || event.touches.length !== 1) return;
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, {passive: true});
  stage.addEventListener("touchend", event => {
    if (!touchStart || zoom !== 100 || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    changePage(currentPage + (dx < 0 ? 1 : -1));
  }, {passive: true});

  let resizeTimer;
  window.addEventListener("resize", () => {
    if (!documentHandle || zoom !== 100) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderPage, 160);
  });

  const useNativeViewer = () => {
    // Keep the document visible if PDF.js, its worker, or canvas rendering fails.
    state.hidden = true;
    stage.hidden = false;
    toolbar.hidden = false;
    loading.hidden = true;
    canvas.hidden = true;
    nativeFrame.hidden = false;
    nativeFrame.src = pdfUrl;
    // Browser-native viewers have their own paging and zoom controls.
    previous.hidden = true;
    next.hidden = true;
    pageInput.closest(".pdf-pages").hidden = true;
    zoomOut.hidden = true;
    zoomIn.hidden = true;
    zoomLabel.hidden = true;
    fitButton.hidden = true;
    stage.setAttribute("aria-label", "PDF displayed in the browser's built-in viewer");
    pageAnnouncement.textContent = "Using your browser's PDF viewer. Its built-in controls handle pages and zoom.";
  };

  async function initialise() {
    if (!window.pdfjsLib) {
      useNativeViewer();
      return;
    }
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const task = window.pdfjsLib.getDocument({url: pdfUrl});
      documentHandle = await task.promise;
      totalPages = documentHandle.numPages;
      if (!totalPages) throw new Error("PDF has no pages");
      updateControls();
      await renderPage();
    } catch (error) {
      // An enhanced-renderer error does not mean the PDF is unavailable.
      // The original file already has a direct OPEN and DOWNLOAD link.
      useNativeViewer();
      console.warn("Archi/Saff PDF.js unavailable; using native PDF viewer.", error);
    }
  }

  initialise();
})();
