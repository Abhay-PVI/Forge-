import { API_BASE_URL } from "../../../features/electrical/pv/pv-design/api/apiConfig";

function waitForImages(doc) {
  const images = Array.from(doc.images || []);
  return Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        img.onload = img.onerror = () => resolve();
      });
    })
  );
}

async function inlineImages(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const images = doc.querySelectorAll("img");

  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        img.setAttribute("src", base64);
      } catch (err) {
        console.warn(`Failed to inline image: ${src}`, err);
      }
    })
  );

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export function exportPdf(elementId, fileName = "Design Basis Report", pageSize = "letter") {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("Report not found");
    return;
  }

  const printWindow = window.open("", "_blank");
  const docTitle = fileName.replace(".pdf", "");
  const sizeValue = pageSize.toLowerCase() === "a4" ? "A4" : "letter";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>

        <style>
          @page {
            size: ${sizeValue}; margin: 10mm;
          }

          body {
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
              display: table-header-group;   /* ✅ Repeat header on every page */
            }

            tfoot {
              display: table-footer-group;
            }

            table {
              page-break-inside: auto;
            }
          }
        </style>
      </head>

      <body>
        ${element.outerHTML}

        <!-- Master Print boundary override stylesheet placed at the bottom of the body -->
        <style>
          @page {
            size: ${sizeValue} !important;
            margin: 10mm !important;
          }

          @page :first {
            margin: 0 !important;
          }

          /* Cover page print overrides - no margin, no padding, full-bleed graphic layout */
          .cover-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          /* Force layout sizing overrides on all report pages (Document Control, TOC, LOT) to fit standard bounds */
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

          /* Continuous pages should flow naturally without breaks */
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

          /* Ensure images, grids, and tables respect page boundaries */
          table, img, div {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Center align tables and prevent layout overflow */
          table {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        </style>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = async () => {
    await waitForImages(printWindow.document);
    printWindow.focus();
    printWindow.print();

    setTimeout(() => { printWindow.close(); }, 500);
  };
}



export async function exportPdfServer(elementId, fileName = "Design Basis Report", pageSize = "letter") {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("Report not found");
    return;
  }

  const docTitle = fileName.replace(".pdf", "");
  const sizeValue = pageSize.toLowerCase() === "a4" ? "A4" : "Letter";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          @page {
            size: ${sizeValue}; margin: 10mm;
          }
          body {
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
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <style>
          @page {
            size: ${sizeValue} !important;
            margin: 10mm !important;
          }
          @page :first {
            margin: 0 !important;
          }
          .cover-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
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
      </body>
    </html>
  `;

  const inlinedHtml = await inlineImages(htmlContent);

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html: inlinedHtml }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docTitle.endsWith(".pdf") ? docTitle : `${docTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate PDF. Please try again.");
  }
}


export async function exportPdfWithToc(elementId, fileName = "Design Basis Report", pageSize = "letter") {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("Report not found");
    return;
  }

  const docTitle = fileName.replace(".pdf", "");
  const sizeValue = pageSize.toLowerCase() === "a4" ? "A4" : "Letter";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          @page {
            size: ${sizeValue}; margin: 10mm;
          }
          body {
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
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <style>
          @page {
            size: ${sizeValue} !important;
            margin: 10mm !important;
          }
          @page :first {
            margin: 0 !important;
          }
          .cover-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
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
      </body>
    </html>
  `;

  const inlinedHtml = await inlineImages(htmlContent);

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-pdf-with-toc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html: inlinedHtml }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docTitle.endsWith(".pdf") ? docTitle : `${docTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PDF generation with TOC failed:", err);
    alert("Failed to generate PDF with TOC. Please try again.");
  }
}