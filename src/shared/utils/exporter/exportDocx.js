import { saveAs } from "file-saver";

export async function exportDocx(elementId, fileName) {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("Report not found");
    return;
  }

  // Define headers for Microsoft Word HTML/XML compatibility
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Design Basis Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            margin-bottom: 20px;
          }
          th {
            background-color: #163c7a !important;
            color: white !important;
            border: 1px solid #163c7a;
            padding: 8px;
            text-align: center;
          }
          td {
            border: 1px solid #d0d7e2;
            padding: 6px;
            vertical-align: top;
          }
          .page-break {
            page-break-before: always;
          }
          .cover-page {
            text-align: center;
            padding: 40px;
          }
        </style>
      </head>
      <body>
  `;
  const footer = "</body></html>";
  
  const htmlContent = header + element.innerHTML + footer;
  
  // Create Word document Blob
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const finalName = fileName.toLowerCase().endsWith('.docx') ? fileName : `${fileName}.docx`;
  saveAs(blob, finalName);
}