/* Archi/Saff reusable project document readers.
   Each document has independent PDF.js controls, lazy loading, and a native PDF fallback. */
(() => {
  "use strict";

  const projects = window.ArchiSaffProjects || [];
  const projectId = new URLSearchParams(location.search).get("id");
  const index = projects.findIndex(project => project.id === projectId);
  const project = projects[index];
  const mount = document.querySelector("#projectDocuments");
  const template = document.querySelector("#projectPdfTemplate");
  if (!mount || !template) return;

  const byId = id => document.getElementById(id);
  const safePdfUrl = path => {
    if (typeof path !== "string" ||
        !/^assets\/pdfs\/(?:[a-z0-9._ -]+\/)*[a-z0-9._ -]+\.pdf$/i.test(path) ||
        path.split("/").some(part => part === "." || part === "..")) return null;
    const url = new URL(path, document.baseURI);
    return url.origin === location.origin ? url.href : null;
  };

  if (!project) {
    document.title = "Project not found — Archi/Saff";
    byId("projectTitle").textContent = "PROJECT NOT FOUND";
    byId("projectDescription").textContent = "Return to Selected Projects to choose a project.";
    byId("projectMeta").hidden = true;
    byId("nextProject").hidden = true;
    mount.innerHTML = '<p class="project-documents-loading">PROJECT NOT FOUND</p>';
    return;
  }

  document.title = project.title + " — Archi/Saff";
  byId("projectTitle").textContent = project.title;
  byId("projectNumber").textContent = project.number;
  byId("projectCategory").textContent = project.category;
  byId("projectLocation").textContent = project.location;
  byId("projectYear").textContent = project.year;
  byId("projectDescription").textContent = project.description;
  byId("pdfDemoNotice").hidden = !project.demo;

  const following = projects[(index + 1) % projects.length];
  byId("nextProject").href = "project.html?id=" + encodeURIComponent(following.id);
  byId("nextProjectName").textContent = following.title;

  const documents = [
    {
      key: "design", number: "01", title: "PROJECT DESIGN",
      info: "PRESENTATION / PROPOSAL",
      files: project.pdf ? [{title: "PROJECT PRESENTATION", path: project.pdf}] : []
    },
    {
      key: "journal", number: "02", title: "DESIGN & TECHNICAL JOURNAL",
      info: "RESEARCH / PROCESS / DETAIL",
      files: Array.isArray(project.journalPdfs) ? project.journalPdfs : []
    },
    {
      key: "models", number: "03", title: "MODEL PHOTOGRAPHY",
      info: "PHYSICAL MODELS / STUDIES",
      files: project.modelPhotographyPdf ?
        [{title: "MODEL PHOTOGRAPHY", path: project.modelPhotographyPdf}] : []
    }
  ];

  const showPending = (container, text) => {
    const pending = document.createElement("div");
    pending.className = "project-pdf-pending";
    const copy = document.createElement("p");
    copy.textContent = text;
    pending.append(copy);
    container.append(pending);
  };

  function createPdfReader(file, key, documentIndex) {
    const article = template.content.firstElementChild.cloneNode(true);
    const pick = selector => article.querySelector(selector);
    const reader = pick(".pdf-reader");
    const toolbar = pick(".pdf-toolbar");
    const stage = pick(".pdf-stage");
    const state = pick(".pdf-state");
    const stateTitle = pick(".pdf-state-title");
    const stateText = pick(".pdf-state-text");
    const loadButton = pick(".pdf-load-button");
    const loading = pick(".pdf-loading");
    const canvas = pick(".pdf-canvas");
    const frame = pick(".pdf-native");
    const back = pick(".pdf-previous");
    const forward = pick(".pdf-next");
    const pageInput = pick(".pdf-page-input");
    const count = pick(".pdf-page-count");
    const minus = pick(".pdf-zoom-out");
    const plus = pick(".pdf-zoom-in");
    const fit = pick(".pdf-fit");
    const percentage = pick(".pdf-zoom-label");
    const fullscreen = pick(".pdf-fullscreen");
    const open = pick(".pdf-open");
    const download = pick(".pdf-download");
    const help = pick(".pdf-reader-help");
    const label = pick(".pdf-document-label");
    const name = typeof file.title === "string" ? file.title : "PROJECT PDF";
    const url = safePdfUrl(file.path);
    label.textContent = name + " / PDF";
    frame.title = name + " (browser PDF viewer)";
    stage.setAttribute("aria-label", name + " pages");
    canvas.setAttribute("aria-label", name + " — current page");
    pageInput.setAttribute("aria-label", name + " page number");

    if (!url) {
      stateTitle.textContent = "DOCUMENT NOT LINKED";
      stateText.textContent = "The PDF for this document has not been added yet.";
      loadButton.hidden = true;
      return article;
    }

    open.href = url;
    download.href = url;
    download.download = (project.id + "-" + key + "-" + (documentIndex + 1) + ".pdf");
    stateTitle.textContent = "DOCUMENT READY";
    stateText.textContent = "This PDF loads automatically when it enters view. You can also open it now.";

    let pdf = null;
    let pageNumber = 1;
    let total = 0;
    let zoom = 100;
    let currentRender = null;
    let generation = 0;
    let started = false;
    let expanded = false;
    let touchStart = null;
    let resizeTimer;

    function updateControls() {
      back.disabled = !pdf || pageNumber <= 1;
      forward.disabled = !pdf || pageNumber >= total;
      pageInput.max = String(total || 1);
      pageInput.value = String(pageNumber);
      count.textContent = total ? String(total) : "—";
      percentage.textContent = zoom + "%";
      minus.disabled = zoom <= 75;
      plus.disabled = zoom >= 200;
      help.textContent = total ? "Page " + pageNumber + " of " + total : "";
    }

    function useNativeViewer(error) {
      // Enhanced rendering can fail while the PDF remains perfectly readable.
      ++generation;
      if (currentRender) currentRender.cancel();
      currentRender = null;
      pdf = null;
      loading.hidden = true;
      canvas.hidden = true;
      stage.hidden = false;
      state.hidden = true;
      toolbar.hidden = false;
      frame.hidden = false;
      if (frame.src !== url) frame.src = url;
      for (const element of [back, forward, minus, plus, fit, percentage]) {
        element.hidden = true;
      }
      pick(".pdf-pages").hidden = true;
      help.textContent = "Using your browser's PDF controls. Open or download the original if the preview is unavailable.";
      if (error) console.warn("Archi/Saff: native PDF fallback for " + name, error);
    }

    async function draw() {
      if (!pdf) return;
      const sequence = ++generation;
      if (currentRender) {
        currentRender.cancel();
        try { await currentRender.promise; } catch (_) { /* Cancellation expected. */ }
        currentRender = null;
      }
      if (sequence !== generation || !pdf) return;
      loading.hidden = false;
      canvas.hidden = true;
      try {
        const page = await pdf.getPage(pageNumber);
        if (sequence !== generation || !pdf) return;
        const original = page.getViewport({scale: 1});
        const width = Math.max(180, stage.clientWidth - (matchMedia("(max-width: 600px)").matches ? 20 : 48));
        const viewport = page.getViewport({scale: width / original.width * zoom / 100});
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = Math.min(dpr, Math.sqrt(6500000 / (viewport.width * viewport.height)));
        canvas.width = Math.max(1, Math.floor(viewport.width * scale));
        canvas.height = Math.max(1, Math.floor(viewport.height * scale));
        canvas.style.width = Math.round(viewport.width) + "px";
        canvas.style.height = Math.round(viewport.height) + "px";
        const context = canvas.getContext("2d", {alpha: false});
        if (!context) throw new Error("Canvas unavailable");
        context.setTransform(scale, 0, 0, scale, 0, 0);
        currentRender = page.render({canvasContext: context, viewport});
        await currentRender.promise;
        if (sequence !== generation || !pdf) return;
        currentRender = null;
        loading.hidden = true;
        canvas.hidden = false;
        updateControls();
      } catch (error) {
        if (sequence !== generation || error?.name === "RenderingCancelledException") return;
        useNativeViewer(error);
      }
    }

    function moveTo(nextPage) {
      if (!pdf || !Number.isFinite(nextPage)) return;
      const target = Math.max(1, Math.min(total, Math.round(nextPage)));
      if (target === pageNumber) return;
      pageNumber = target;
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
      updateControls();
      draw();
    }

    function changeZoom(value) {
      if (!pdf) return;
      zoom = Math.max(75, Math.min(200, value));
      updateControls();
      draw();
    }

    async function load() {
      if (started) return;
      started = true;
      state.hidden = true;
      stage.hidden = false;
      loading.hidden = false;
      toolbar.hidden = false;
      updateControls();
      if (!window.pdfjsLib) {
        useNativeViewer();
        return;
      }
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const task = window.pdfjsLib.getDocument({url});
        pdf = await task.promise;
        total = pdf.numPages;
        if (!total) throw new Error("PDF has no pages");
        updateControls();
        await draw();
      } catch (error) {
        useNativeViewer(error);
      }
    }

    loadButton.addEventListener("click", load);
    back.addEventListener("click", () => moveTo(pageNumber - 1));
    forward.addEventListener("click", () => moveTo(pageNumber + 1));
    pageInput.addEventListener("change", () => {
      const entered = Number(pageInput.value);
      if (!Number.isFinite(entered) || entered < 1 || entered > total) {
        updateControls();
      } else {
        moveTo(entered);
      }
    });
    minus.addEventListener("click", () => changeZoom(zoom - 25));
    plus.addEventListener("click", () => changeZoom(zoom + 25));
    fit.addEventListener("click", () => changeZoom(100));

    const updateFullscreen = () => {
      const active = expanded || document.fullscreenElement === reader;
      fullscreen.textContent = active ? "EXIT FULL SCREEN" : "FULL SCREEN";
      fullscreen.setAttribute("aria-label", active ? "Exit PDF full screen" : "View PDF full screen");
    };

    fullscreen.addEventListener("click", async () => {
      if (document.fullscreenElement === reader) {
        await document.exitFullscreen();
        return;
      }
      if (expanded) {
        expanded = false;
        reader.classList.remove("pdf-reader-expanded");
        document.body.classList.remove("pdf-reader-open");
        updateFullscreen();
        if (pdf) draw();
        return;
      }
      if (reader.requestFullscreen) {
        try {
          await reader.requestFullscreen();
          updateFullscreen();
          if (pdf) draw();
          return;
        } catch (_) { /* In-page expansion for browsers without fullscreen. */ }
      }
      expanded = true;
      reader.classList.add("pdf-reader-expanded");
      document.body.classList.add("pdf-reader-open");
      updateFullscreen();
      if (pdf) draw();
    });

    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement === reader || !document.fullscreenElement) {
        updateFullscreen();
        if (pdf && started) draw();
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && expanded) {
        expanded = false;
        reader.classList.remove("pdf-reader-expanded");
        document.body.classList.remove("pdf-reader-open");
        updateFullscreen();
        if (pdf) draw();
      }
    });
    stage.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        moveTo(pageNumber + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        moveTo(pageNumber - 1);
      }
    });
    stage.addEventListener("touchstart", event => {
      if (zoom !== 100 || event.touches.length !== 1) return;
      touchStart = {x: event.touches[0].clientX, y: event.touches[0].clientY};
    }, {passive: true});
    stage.addEventListener("touchend", event => {
      if (!touchStart || zoom !== 100 || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        moveTo(pageNumber + (dx < 0 ? 1 : -1));
      }
    }, {passive: true});
    window.addEventListener("resize", () => {
      if (!pdf || zoom !== 100) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 160);
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, observe) => {
        if (entries.some(entry => entry.isIntersecting)) {
          observe.disconnect();
          load();
        }
      }, {rootMargin: "300px 0px"});
      observer.observe(article);
    }
    return article;
  }

  mount.replaceChildren();
  const hasFiles = documents.some(section => section.files.length);
  if (!hasFiles) {
    const section = document.createElement("section");
    section.className = "project-document-section";
    section.innerHTML = '<div class="project-document-heading"><h2>PROJECT DOCUMENTATION</h2></div>';
    showPending(section, "Project documents will appear here once Saffron has provided them.");
    mount.append(section);
    return;
  }

  for (const chapter of documents) {
    const section = document.createElement("section");
    section.className = "project-document-section";
    section.setAttribute("aria-labelledby", "chapter-" + chapter.key);
    const header = document.createElement("div");
    header.className = "project-document-heading";
    const title = document.createElement("h2");
    title.id = "chapter-" + chapter.key;
    const number = document.createElement("span");
    number.className = "chapter-number";
    number.textContent = chapter.number + " /";
    title.append(number, document.createTextNode(chapter.title));
    const meta = document.createElement("span");
    meta.className = "chapter-meta";
    meta.textContent = chapter.info;
    const actions = document.createElement("div");
    actions.className = "chapter-actions";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "chapter-toggle";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-controls", "chapter-content-" + chapter.key);
    toggle.setAttribute("aria-label", "Collapse " + chapter.title + " section");
    toggle.textContent = "COLLAPSE";
    actions.append(meta, toggle);
    header.append(title, actions);

    const body = document.createElement("div");
    body.className = "project-document-body";
    body.id = "chapter-content-" + chapter.key;
    if (chapter.files.length) {
      chapter.files.forEach((file, fileIndex) => {
        body.append(createPdfReader(file, chapter.key, fileIndex));
      });
    } else {
      showPending(body,
        chapter.key === "models"
          ? "Model photography will appear here once its separate PDF has been provided."
          : "This document is coming soon.");
    }
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      body.hidden = expanded;
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.setAttribute("aria-label", (expanded ? "Expand " : "Collapse ") + chapter.title + " section");
      toggle.textContent = expanded ? "EXPAND" : "COLLAPSE";
    });
    section.append(header, body);
    mount.append(section);
  }
})();
