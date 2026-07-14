import { API_BASE_URL } from "../../../features/electrical/pv/pv-design/api/apiConfig";


async function inlineImages(htmlString) {
  const startInlining = performance.now();
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const images = doc.querySelectorAll("img");

  console.log(`[PROFILE] Starting inlineImages for ${images.length} images (parallel fetches).`);

  await Promise.all(
    Array.from(images).map(async (img, idx) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const startFetch = performance.now();
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        img.setAttribute("src", base64);
        const endFetch = performance.now();
        console.log(`[PROFILE] Image [${idx}] fetch and encode took ${(endFetch - startFetch).toFixed(2)}ms: ${src.substring(0, 80)}`);
      } catch (err) {
        console.warn(`Failed to inline image: ${src}`, err);
      }
    })
  );

  const endInlining = performance.now();
  console.log(`[PROFILE] inlineImages total time: ${(endInlining - startInlining).toFixed(2)}ms`);
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}


function buildSolarAppendixValues(values = {}) {
  const storedValues = values.solarAppendixValues || {};
  const variantPrefixes = ["wp", "pstc", "voc", "vmp", "isc", "imp"];
  const keys = variantPrefixes.flatMap((prefix) =>
    Array.from({ length: 6 }, (_, index) => `${prefix}_${index + 1}`)
  );
  keys.push("temp_coeff_voc", "temp_coeff_pm", "temp_coeff_isc");

  const appendixValues = {};
  keys.forEach((key) => {
    const value = storedValues[key] ?? values[key];
    if (value !== undefined && value !== null && value !== "") {
      appendixValues[key] = value;
    }
  });

  appendixValues.tempMin =
    values.tempMin ?? storedValues.tempMin ?? values.temp_min ?? -5;
  appendixValues.tempMax =
    values.tempMax ?? storedValues.tempMax ?? values.temp_max ?? 32;
  return appendixValues;
}




export async function exportPdfWithToc(
  elementId,
  fileName = "Design Basis Report",
  pageSize = "letter",
  options = {}
) {
  const startTotal = performance.now();
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("Report not found");
    return;
  }

  const docTitle = fileName.replace(".pdf", "");
  const sizeValue = pageSize.toLowerCase() === "a4" ? "A4" : "Letter";

  // Parse HTML and extract styles to avoid preceding text nodes or wrappers in body
  const parser = new DOMParser();
  const tempDoc = parser.parseFromString(element.innerHTML, "text/html");
  const styleTags = Array.from(tempDoc.querySelectorAll("style"));
  let stylesText = "";
  styleTags.forEach((style) => {
    stylesText += style.textContent + "\n";
    style.remove();
  });

  // Preview-only placeholders and legacy rasterized appendix pages must never
  // enter Chromium. The native appendix PDF is merged by the backend instead.
  tempDoc
    .querySelectorAll('[data-pdf-export-exclude="true"]')
    .forEach((node) => node.remove());
  tempDoc
    .querySelectorAll(".appendix-page ~ .page")
    .forEach((node) => node.remove());

  const bodyContent = tempDoc.body.innerHTML.trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          /* Styles collected from the report templates. Print rules below are
             deliberately declared afterward so template-level @page rules
             cannot override the PDF export layout. */
          ${stylesText}

          @page {
            size: ${sizeValue};
            width: auto;
            height: auto;
            margin: 10mm;
          }

          @page cover {
            size: ${sizeValue};
            width: auto;
            height: auto;
            margin: 0;
          }

          html,
          body {
            width: 100%;
            font-family: "Segoe UI", sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          img {
            max-width: 100%;
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            th {
              color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            table {
              page-break-inside: auto;
            }
          }
          .cover-page {
            page: cover;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .report-page {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .page {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          table, img, div {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          table {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;

  const inlinedHtml = await inlineImages(htmlContent);

  try {
    const requestPayload = { html: inlinedHtml };
    if (options.includeSolarAppendix) {
      requestPayload.solar_appendix_values = buildSolarAppendixValues(
        options.solarAppendixValues || {}
      );
    }

    const payloadSizeMB = (new Blob([JSON.stringify(requestPayload)]).size / (1024 * 1024)).toFixed(2);
    console.log(`[PROFILE] POST Payload size: ${payloadSizeMB} MB`);

    const startPost = performance.now();
    console.log("[PROFILE] Sending POST request to backend...");

    const response = await fetch(`${API_BASE_URL}/api/generate-pdf-with-toc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const endPost = performance.now();
    console.log(`[PROFILE] POST request + backend generation complete. Duration: ${(endPost - startPost).toFixed(2)}ms`);

    const startBlob = performance.now();
    const blob = await response.blob();
    const endBlob = performance.now();
    console.log(`[PROFILE] Converting response to blob took ${(endBlob - startBlob).toFixed(2)}ms`);

    const endTotal = performance.now();
    console.log(`[PROFILE] exportPdfWithToc GRAND TOTAL: ${(endTotal - startTotal).toFixed(2)}ms`);
    return blob;
  } catch (err) {
    console.error("PDF generation with TOC failed:", err);
    alert("Failed to generate PDF with TOC. Please try again.");
    throw err;
  }
}
