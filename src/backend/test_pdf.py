import asyncio
import os
import sys

# Add current folder to sys.path so we can import pdf_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import bs4
from pdf_utils import generate_pdf_with_toc, collect_headings_from_html, extract_toc_entries, generate_pdf_from_html

def mock_number_headings(html_content: str):
    soup = bs4.BeautifulSoup(html_content, "html.parser")
    heading_els = soup.select(".toc-heading")
    counters = []
    for h in heading_els:
        level = int(h.get("data-toc-level", 1))
        level_index = level - 1
        while len(counters) < level_index + 1:
            counters.append(0)
        counters = counters[:level_index + 1]
        counters[level_index] += 1
        num_str = ".".join(str(c) for c in counters)
        original_text = h.get_text(strip=True)
        h.string = f"{num_str} {original_text}"
    return str(soup)

async def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(backend_dir)
    
    # Load templates
    pv_template_path = os.path.join(project_dir, "features", "electrical", "pv", "pv-design", "templates", "pvReportTemplate.html")
    with open(pv_template_path, "r", encoding="utf-8") as f:
        body_template = f.read()

    cover_path = os.path.join(project_dir, "shared", "reports", "copy", "coverPage.html")
    with open(cover_path, "r", encoding="utf-8") as f:
        cover = f.read()
        
    doc_control_path = os.path.join(project_dir, "shared", "reports", "copy", "documentControlPage.html")
    with open(doc_control_path, "r", encoding="utf-8") as f:
        doc_control = f.read()
        
    toc_path = os.path.join(project_dir, "shared", "reports", "copy", "tableOfContents.html")
    with open(toc_path, "r", encoding="utf-8") as f:
        toc = f.read()
        
    lot_path = os.path.join(project_dir, "shared", "reports", "copy", "listOfTables.html")
    with open(lot_path, "r", encoding="utf-8") as f:
        lot = f.read()
        
    loa_path = os.path.join(project_dir, "shared", "reports", "copy", "listOfAbbreviations.html")
    with open(loa_path, "r", encoding="utf-8") as f:
        loa = f.read()

    # Number headings
    numbered_body = mock_number_headings(body_template)

    # Simple placeholder fills
    soup_numbered = bs4.BeautifulSoup(numbered_body, "html.parser")
    headings = [
        {"title": h.get_text(strip=True), "level": int(h.get("data-toc-level", 1))}
        for h in soup_numbered.select(".toc-heading")
    ]
    
    toc_rows = []
    for h in headings:
        level_class = f"toc-level-{h['level']}"
        toc_rows.append(
            f'<div class="toc-row {level_class}">'
            f'<span class="toc-title">{h["title"]}</span>'
            f'<span class="toc-dots"></span>'
            f'<span class="toc-page-num"></span>'
            f'</div>'
        )
    toc_placeholder = "\n".join(toc_rows)

    # Assemble HTML
    complete_html = f"{cover}\n{doc_control}\n{toc}\n{lot}\n{loa}\n{numbered_body}"
    complete_html = complete_html.replace("{{TOC_PLACEHOLDER}}", toc_placeholder)
    complete_html = complete_html.replace("{{LIST_OF_TABLES_PLACEHOLDER}}", "")
    complete_html = complete_html.replace("{{LIST_OF_FIGURES_PLACEHOLDER}}", "")
    complete_html = complete_html.replace("{{LIST_OF_ABBREVIATIONS_PLACEHOLDER}}", "")

    # Run two-pass pdf generator
    print("Starting generation...")
    pdf_bytes = await generate_pdf_with_toc(complete_html, format="Letter")
    print(f"Finished. Generated PDF bytes: {len(pdf_bytes)}")

if __name__ == "__main__":
    asyncio.run(main())
