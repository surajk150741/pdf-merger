// Merge page: file selection, reordering, and submitting to the backend.
document.addEventListener("DOMContentLoaded", () => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const browseBtn = document.getElementById("browse-btn");
  const addMoreBtn = document.getElementById("add-more-btn");
  const clearBtn = document.getElementById("clear-btn");
  const mergeBtn = document.getElementById("merge-btn");
  const fileListSection = document.getElementById("file-list-section");
  const fileListEl = document.getElementById("file-list");
  const fileCountEl = document.getElementById("file-count");
  const errorBanner = document.getElementById("error-banner");

  if (!dropzone) return;

  let files = []; // { id, file }
  let dragSrcId = null;

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uid = () => `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  function addFiles(fileListArg) {
    const incoming = Array.from(fileListArg).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    incoming.forEach((file) => files.push({ id: uid(), file }));
    render();
  }

  function removeFile(id) {
    files = files.filter((f) => f.id !== id);
    render();
  }

  function clearAll() {
    files = [];
    render();
  }

  function render() {
    const hasFiles = files.length > 0;
    fileListSection.classList.toggle("hidden", !hasFiles);
    dropzone.classList.toggle("hidden", false); // keep dropzone always available
    fileCountEl.textContent = String(files.length);
    mergeBtn.disabled = files.length < 2;

    fileListEl.innerHTML = "";
    files.forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.draggable = true;
      li.dataset.id = entry.id;

      li.innerHTML = `
        <span class="drag-handle" aria-hidden="true">
          <span class="dots-row"><span></span><span></span></span>
          <span class="dots-row"><span></span><span></span></span>
          <span class="dots-row"><span></span><span></span></span>
        </span>
        <span class="file-index">${index + 1}</span>
        <span class="file-icon">PDF</span>
        <span class="file-meta">
          <div class="file-name">${escapeHtml(entry.file.name)}</div>
          <div class="file-size">${formatSize(entry.file.size)}</div>
        </span>
        <button type="button" class="file-remove" aria-label="Remove file" data-id="${entry.id}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      `;

      fileListEl.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.remove("hidden");
  }

  function clearError() {
    errorBanner.textContent = "";
    errorBanner.classList.add("hidden");
  }

  // --- Dropzone interactions ---
  dropzone.addEventListener("click", () => fileInput.click());
  browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  addMoreBtn?.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    addFiles(e.target.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });

  // --- List actions ---
  fileListEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".file-remove");
    if (btn) removeFile(btn.dataset.id);
  });

  clearBtn.addEventListener("click", clearAll);

  mergeBtn.addEventListener("click", async () => {
    clearError();
    const original = mergeBtn.innerHTML;
    mergeBtn.disabled = true;
    mergeBtn.textContent = "Merging…";

    const formData = new FormData();
    files.forEach((entry) => formData.append("files", entry.file, entry.file.name));

    try {
      const res = await fetch("/merge", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Something went wrong while merging your files.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError("Could not reach the server. Please try again.");
    } finally {
      mergeBtn.innerHTML = original;
      mergeBtn.disabled = files.length < 2;
    }
  });

  // --- Reordering via native drag & drop ---
  fileListEl.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".file-item");
    if (!item) return;
    dragSrcId = item.dataset.id;
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  fileListEl.addEventListener("dragend", (e) => {
    const item = e.target.closest(".file-item");
    item?.classList.remove("dragging");
    fileListEl.querySelectorAll(".file-item").forEach((el) => el.classList.remove("drag-over-item"));
    dragSrcId = null;
  });

  fileListEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const target = e.target.closest(".file-item");
    if (!target || target.dataset.id === dragSrcId) return;
    fileListEl.querySelectorAll(".file-item").forEach((el) => el.classList.remove("drag-over-item"));
    target.classList.add("drag-over-item");
  });

  fileListEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const target = e.target.closest(".file-item");
    if (!target || !dragSrcId || target.dataset.id === dragSrcId) return;

    const fromIndex = files.findIndex((f) => f.id === dragSrcId);
    const toIndex = files.findIndex((f) => f.id === target.dataset.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = files.splice(fromIndex, 1);
    files.splice(toIndex, 0, moved);
    render();
  });
});
