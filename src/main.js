import { MyXMLHttpRequest } from "./network";
import { unsafeWindow } from "$";

// Override the global XMLHttpRequest with MyXMLHttpRequest
unsafeWindow.XMLHttpRequest = MyXMLHttpRequest;

// #region Inline submission images for easier grading
const KNOWN_IMAGE_TYPES = ["jpg", "jpeg", "png", "bmp", "webp", "tiff"];

MyXMLHttpRequest.addHandler((xhr, method, url) => {
  if (url.pathname == "/v/quiz/new_get_subj_problem_result_detail/") {
    xhr.intercept(null, (responseText) => {
      try {
        const resp = JSON.parse(responseText);
        if (!resp.success) return;

        const {
          pics,
          attachments: { filelist },
        } = resp.data.answer_content;
        if (!Array.isArray(filelist) || filelist.length === 0) return;

        let found = false;
        for (const file of filelist) {
          if (KNOWN_IMAGE_TYPES.includes(file.fileType.toLowerCase())) {
            pics.push({
              pic: file.fileUrl,
              thumb: file.fileUrl,
            });
            found = true;
          }
        }

        if (found) {
          return JSON.stringify(resp);
        }
      } catch (err) {
        console.error("Error in response interceptor:", err);
      }
    });
  }
});
// #endregion

// #region Keyboard shortcuts for annotation actions
const IMAGE_CONTAINER_CLASS = "section.annotation-image__wrap";
const PDF_CONTAINER_CLASS = "div.pdf-viewer-page";

document.addEventListener("keydown", (event) => {
  // Ignore key events from input fields or content editable elements
  if (
    ["INPUT", "TEXTAREA"].includes(event.target.tagName) ||
    event.target.isContentEditable
  )
    return;

  const imageContainer = document.querySelector(IMAGE_CONTAINER_CLASS);
  const getImageActionButton = (name) =>
    imageContainer?.querySelector(
      `p.action-tip.action-btn.box-center[data-tip="${name}"]`
    );
  const getImagePenWidthButton = (index) =>
    imageContainer?.querySelector(
      `section.pen__line.box-center > p.action-btn.box-center:nth-child(${index})`
    );

  const pdfContainer = document.querySelector(PDF_CONTAINER_CLASS);
  const getPdfActionButton = (name) =>
    pdfContainer?.querySelector(`div.toolbar button[data-tooltype="${name}"]`);

  switch (event.key) {
    case "1":
      getImageActionButton("移动")?.click();
      getPdfActionButton("highlight")?.click();
      break;

    case "2":
      getImageActionButton("圈画")?.click();
      getPdfActionButton("draw")?.click();
      break;

    case "3":
      getImageActionButton("文字")?.click();
      getPdfActionButton("text")?.click();
      break;

    case "Q":
    case "q":
      getImagePenWidthButton(1)?.click();
      break;

    case "W":
    case "w":
      getImagePenWidthButton(2)?.click();
      break;

    case "E":
    case "e":
      getImagePenWidthButton(3)?.click();
      break;

    case "Z":
    case "z":
      if (event.ctrlKey || event.metaKey) {
        getImageActionButton("撤回")?.click();
        getPdfActionButton("undo")?.click();
      }
      break;

    case "Y":
    case "y":
      if (event.ctrlKey || event.metaKey) {
        getPdfActionButton("redo")?.click();
      }
      break;

    case "Escape":
      getImageActionButton("取消")?.click();
      break;

    case "Enter":
      getImageActionButton("保存")?.click();
      break;
  }
});
// #endregion

// #region Pen input fix for PDF viewer
// Track pen interaction state
document.addEventListener("pointerdown", (event) => {
  const container = event.target.closest(PDF_CONTAINER_CLASS);
  if (!container) return;

  if (event.pointerType === "pen") {
    container.dataset.penInteraction = "true";
  }
});

const cleanupPenState = () => {
  const containers = document.querySelectorAll(PDF_CONTAINER_CLASS);
  for (const container of containers) {
    delete container.dataset.penInteraction;
  }
};
document.addEventListener("pointerup", cleanupPenState);
document.addEventListener("pointercancel", cleanupPenState);

document.addEventListener(
  "touchmove",
  (event) => {
    const container = event.target.closest(PDF_CONTAINER_CLASS);
    if (!container) return;

    if (container.dataset.penInteraction === "true") {
      const activeButton = container.querySelector(
        "div.toolbar button.active[data-tooltype]"
      );
      if (activeButton?.dataset.tooltype === "draw") {
        // Prevent scrolling when drawing with pen
        event.preventDefault();
      }
    }
  },
  { passive: false }
);
// #endregion
