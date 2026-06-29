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

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();

    setTimeout(() => { printWindow.close(); }, 500); 
  }; 
}