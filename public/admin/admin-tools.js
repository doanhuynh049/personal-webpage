(function (AdminTools) {
  "use strict";

  let apiFn = null;
  let showToastFn = null;
  let $ = null;
  let aiTarget = null;

  const GALLERY_LAYOUTS = {
    normal: { label: "1×1", className: "" },
    wide: { label: "2×1", className: "gallery-item--wide" },
    tall: { label: "1×2", className: "gallery-item--tall" },
    large: { label: "2×2", className: "gallery-item--large" },
  };

  function refreshPreview() {
    const iframe = document.getElementById("live-preview");
    if (!iframe) return;
    iframe.src = "/?preview=" + Date.now();
  }

  function initSortable(listEl, type) {
    if (!listEl) return;
    let dragEl = null;

    listEl.querySelectorAll(".sortable-item").forEach((card) => {
      const handle = card.querySelector(".drag-handle");
      if (!handle) return;

      handle.addEventListener("dragstart", (e) => {
        dragEl = card;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dragEl || dragEl === card) return;
        const rect = card.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) listEl.insertBefore(dragEl, card);
        else listEl.insertBefore(dragEl, card.nextSibling);
      });

      card.addEventListener("dragend", async () => {
        card.classList.remove("is-dragging");
        if (!dragEl) return;
        dragEl = null;
        const ids = [...listEl.querySelectorAll(".sortable-item")].map((el) => Number(el.dataset.id));
        try {
          await apiFn(`/api/${type}/reorder`, {
            method: "PUT",
            body: JSON.stringify({ ids }),
          });
          showToastFn("Order saved");
          refreshPreview();
        } catch (err) {
          showToastFn(err.message, true);
        }
      });
    });
  }

  function applyGalleryLayoutClass(card, layout) {
    card.classList.remove("gallery-item--wide", "gallery-item--tall", "gallery-item--large");
    const meta = GALLERY_LAYOUTS[layout] || GALLERY_LAYOUTS.normal;
    if (meta.className) card.classList.add(meta.className);
    const badge = card.querySelector(".gallery-size-badge");
    if (badge) badge.textContent = meta.label;
    card.dataset.layout = layout;
  }

  function layoutFromDragDelta(dx, dy) {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < 24 && ay < 24) return null;
    if (ax > 70 && ay > 70) return "large";
    if (ax > ay + 20) return "wide";
    if (ay > ax + 20) return "tall";
    if (ax > 40 || ay > 40) return ax >= ay ? "wide" : "tall";
    return "normal";
  }

  function updateGalleryPositionBadges(listEl) {
    listEl.querySelectorAll(".gallery-editor-item").forEach((el, i) => {
      const badge = el.querySelector(".gallery-editor-pos");
      if (badge) badge.textContent = String(i + 1);
    });
    const countEl = document.getElementById("gallery-count");
    if (countEl) {
      const n = listEl.querySelectorAll(".gallery-editor-item").length;
      countEl.textContent = `${n} photo${n === 1 ? "" : "s"}`;
    }
  }

  function bindGalleryResize(card, onLayoutChange) {
    const handle = card.querySelector(".gallery-resize-handle");
    if (!handle || handle.dataset.bound) return;
    handle.dataset.bound = "1";

    let startX = 0;
    let startY = 0;
    let previewLayout = null;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      previewLayout = card.dataset.layout || "normal";
      card.classList.add("is-resizing");

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const next = layoutFromDragDelta(dx, dy);
        if (next && next !== previewLayout) {
          previewLayout = next;
          applyGalleryLayoutClass(card, next);
        }
      }

      async function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        card.classList.remove("is-resizing");
        const layout = previewLayout || card.dataset.layout || "normal";
        if (onLayoutChange) await onLayoutChange(card, layout);
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  function initGalleryLayoutEditor(listEl, onReorder, onLayoutChange) {
    if (!listEl) return;

    listEl._galleryOnReorder = onReorder;
    listEl._galleryOnLayoutChange = onLayoutChange;

    if (!listEl.dataset.galleryEditorInit) {
      listEl.dataset.galleryEditorInit = "1";

      listEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragEl = listEl._dragEl;
        if (!dragEl) return;

        listEl.querySelectorAll(".gallery-editor-item.is-drop-target").forEach((el) => {
          el.classList.remove("is-drop-target");
        });

        const target = e.target.closest(".gallery-editor-item");
        if (!target || target === dragEl) return;

        target.classList.add("is-drop-target");
        const rect = target.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        if (after) listEl.insertBefore(dragEl, target.nextSibling);
        else listEl.insertBefore(dragEl, target);
        updateGalleryPositionBadges(listEl);
      });

      listEl.addEventListener("drop", async (e) => {
        e.preventDefault();
        const dragEl = listEl._dragEl;
        if (!dragEl) return;
        dragEl.classList.remove("is-dragging");
        listEl._dragEl = null;
        listEl.querySelectorAll(".gallery-editor-item.is-drop-target").forEach((el) => {
          el.classList.remove("is-drop-target");
        });
        updateGalleryPositionBadges(listEl);
        const ids = [...listEl.querySelectorAll(".gallery-editor-item")].map((el) => Number(el.dataset.id));
        if (listEl._galleryOnReorder) await listEl._galleryOnReorder(ids);
      });
    }

    listEl.querySelectorAll(".gallery-editor-item").forEach((card) => {
      const handle = card.querySelector(".drag-handle");
      if (handle && !handle.dataset.bound) {
        handle.dataset.bound = "1";
        handle.addEventListener("dragstart", (e) => {
          listEl._dragEl = card;
          card.classList.add("is-dragging");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", card.dataset.id);
        });
        card.addEventListener("dragend", () => {
          card.classList.remove("is-dragging");
          listEl._dragEl = null;
          listEl.querySelectorAll(".gallery-editor-item.is-drop-target").forEach((el) => {
            el.classList.remove("is-drop-target");
          });
        });
      }

      bindGalleryResize(card, listEl._galleryOnLayoutChange);
    });

    updateGalleryPositionBadges(listEl);
  }

  function initAllSortables() {
    initSortable(document.getElementById("education-list"), "education");
    initSortable(document.getElementById("jobs-list"), "jobs");
    initSortable(document.getElementById("roadmap-list"), "roadmap");
  }

  async function openAiPanel(section, textarea, context) {
    const drawer = document.getElementById("ai-drawer");
    const body = document.getElementById("ai-suggestion-text");
    const note = document.getElementById("ai-note");
    if (!drawer || !body || !textarea) return;

    aiTarget = textarea;
    drawer.hidden = false;
    body.textContent = "Generating suggestion…";
    note.textContent = "";

    try {
      const result = await apiFn("/api/ai/suggest", {
        method: "POST",
        body: JSON.stringify({ section, currentText: textarea.value, context }),
      });
      body.textContent = result.suggestion || "No suggestion returned.";
      note.textContent = result.note || (result.source === "ollama" ? "Generated via local Ollama" : "Template suggestions — install Ollama for free AI");
    } catch (err) {
      body.textContent = err.message;
    }
  }

  function closeAiPanel() {
    const drawer = document.getElementById("ai-drawer");
    if (drawer) drawer.hidden = true;
    aiTarget = null;
  }

  function applyAiSuggestion() {
    if (!aiTarget) return;
    const text = document.getElementById("ai-suggestion-text")?.textContent || "";
    if (text && !text.startsWith("Generating")) {
      aiTarget.value = text;
      showToastFn("Suggestion applied — review and Save");
      closeAiPanel();
    }
  }

  function bindAiButton(btn) {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.aiTarget;
      const section = btn.dataset.aiSection;
      const textarea = document.getElementById(targetId);
      if (!textarea) return;
      const context = {};
      if (btn.dataset.aiTitle) context.title = btn.dataset.aiTitle;
      if (btn.dataset.aiCompany) context.company = btn.dataset.aiCompany;
      if (btn.dataset.aiInstitution) context.institution = btn.dataset.aiInstitution;
      if (btn.dataset.aiStatus) context.status = btn.dataset.aiStatus;
      openAiPanel(section, textarea, context);
    });
  }

  function bindAiButtons(root) {
    (root || document).querySelectorAll("[data-ai-section]").forEach(bindAiButton);
  }

  function initPreviewPanel() {
    const panel = document.getElementById("preview-panel");
    const toggle = document.getElementById("toggle-preview");
    const refresh = document.getElementById("refresh-preview");

    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        panel.classList.toggle("is-collapsed");
        toggle.textContent = panel.classList.contains("is-collapsed") ? "Show Preview" : "Hide Preview";
      });
    }

    if (refresh) refresh.addEventListener("click", refreshPreview);
  }

  AdminTools.GALLERY_LAYOUTS = GALLERY_LAYOUTS;
  AdminTools.applyGalleryLayoutClass = applyGalleryLayoutClass;
  AdminTools.initPreviewPanel = initPreviewPanel;
  AdminTools.init = function ({ api, showToast, query }) {
    apiFn = api;
    showToastFn = showToast;
    $ = query;
    initPreviewPanel();
    document.getElementById("ai-close")?.addEventListener("click", closeAiPanel);
    document.getElementById("ai-close-2")?.addEventListener("click", closeAiPanel);
    document.getElementById("ai-apply")?.addEventListener("click", applyAiSuggestion);
    document.getElementById("ai-drawer-backdrop")?.addEventListener("click", closeAiPanel);
  };

  AdminTools.refreshPreview = refreshPreview;
  AdminTools.initAllSortables = initAllSortables;
  AdminTools.initGalleryLayoutEditor = initGalleryLayoutEditor;
  AdminTools.bindAiButtons = bindAiButtons;
})(window.AdminTools = window.AdminTools || {});
