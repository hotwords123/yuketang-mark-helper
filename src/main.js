import { MyXMLHttpRequest } from "./network";

// Override the global XMLHttpRequest with MyXMLHttpRequest
window.XMLHttpRequest = MyXMLHttpRequest;

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
