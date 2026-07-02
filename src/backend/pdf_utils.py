
"""Common PDF generation helper using Playwright.

The front‑end `exportPdf` function POSTs JSON `{ html: "<full html>" }` to
`/api/generate-pdf`.  This module provides a reusable async function that
creates a Chromium instance, renders the HTML, and returns the PDF bytes.
"""
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import asyncio

async def generate_pdf_from_html(html: str, *, format: str = "A4") -> bytes:
    """Render *html* in headless Chromium and return a PDF.

    Parameters
    ----------
    html: str
        Complete HTML document (including `<html>`/`<head>`/`<body>`).
    format: str, optional
        Paper format accepted by Playwright – ``"Letter"`` or ``"A4"``.
        Defaults to ``"A4"``.
    Returns
    -------
    bytes
        PDF binary data.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html, wait_until="networkidle")
        pdf_bytes = await page.pdf(
            format=format, 
            print_background=True,
        )
        await browser.close()
        return pdf_bytes

# Helper for synchronous contexts (e.g., test scripts)
def generate_pdf_sync(html: str, *, format: str = "A4") -> bytes:
    """Blocking wrapper around :func:`generate_pdf_from_html`.

    Useful when the caller is not async (e.g., FastAPI dependency
    functions that are async but need a quick one‑liner).
    """
    return asyncio.run(generate_pdf_from_html(html, format=format))


def collect_headings_from_html(html: str):
    """Generic — works for any report, collects headings, tables, and figures."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Collect headings
    headings = [
        {"title": h.get_text(strip=True), "level": int(h.get("data-toc-level", 1))}
        for h in soup.select(".toc-heading")
    ]
    
    # Collect tables
    tables = [
        {"title": t.get_text(strip=True), "level": 1}
        for t in soup.select(".toc-table-caption")
    ]
    
    # Collect figures
    figures = [
        {"title": f.get_text(strip=True), "level": 1}
        for f in soup.select(".toc-figure-caption")
    ]
    
    return headings + tables + figures

import re

def clean_text(text: str) -> str:
    """Collapse all whitespace groups (newlines, tabs, spaces) into a single space and strip."""
    return re.sub(r"\s+", " ", text).strip()

def extract_toc_entries(pdf_bytes: bytes, headings: list):
    """Find which page each heading text appears on."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    entries = []
    
    # Pre-clean the heading titles
    cleaned_headings = [
        {
            "title": clean_text(h["title"]),
            "original_title": h["title"],
            "level": h["level"]
        }
        for h in headings
    ]
    
    # First, find where the first heading/table lands (start of the report body)
    body_start_page = 1
    if cleaned_headings:
        first_heading = cleaned_headings[0]
        # Search backward to find where the first heading appears in the body
        for page_num in range(len(doc) - 1, -1, -1):
            page_text = clean_text(doc[page_num].get_text())
            if first_heading["title"] in page_text:
                body_start_page = page_num + 1
                break
    
    # Force body start page to be at least 4 (pages 1-3 are Cover, Doc Control, TOC)
    body_start_page = max(4, body_start_page)
    print(f"[DEBUG] Identified body_start_page as {body_start_page}")

    for h in cleaned_headings:
        # Search from the last page to the body start page to avoid matching in TOC/LOT/LOF/LOA
        matched = False
        start_search_idx = max(0, body_start_page - 1)
        for page_num in range(len(doc) - 1, start_search_idx - 1, -1):
            page_text = clean_text(doc[page_num].get_text())
            if h["title"] in page_text:
                entries.append({
                    "title": h["original_title"],
                    "level": h["level"],
                    "page": page_num + 1,  # 1-indexed for human-readable TOC
                })
                matched = True
                break
        
        # Fallback: if not matched case-sensitively, try case-insensitive
        if not matched:
            for page_num in range(len(doc) - 1, start_search_idx - 1, -1):
                page_text = clean_text(doc[page_num].get_text()).lower()
                if h["title"].lower() in page_text:
                    entries.append({
                        "title": h["original_title"],
                        "level": h["level"],
                        "page": page_num + 1,
                    })
                    break
                    
    doc.close()
    return entries





def render_toc_html(entries: list) -> str:
    """Generic — builds dotted-leader TOC markup from any entries list."""
    rows = []
    for e in entries:
        level_class = f"toc-level-{e['level']}"
        rows.append(
            f'<div class="toc-row {level_class}">'
            f'<span class="toc-title">{e["title"]}</span>'
            f'<span class="toc-dots"></span>'
            f'<span class="toc-page-num">{e["page"]}</span>'
            f'</div>'
        )
    return "\n".join(rows)    


# pdf_utils.py
async def generate_pdf_with_toc(html: str, *, format: str = "Letter") -> bytes:
    """
    Two-pass TOC-aware PDF generation.

    Pass 1: Render the full HTML to a temporary PDF to discover page numbers.
    Pass 2: Inject page numbers into .toc-page-num spans, re-render final PDF.

    The frontend sends the complete assembled HTML (cover + TOC + body).
    The TOC rows already exist with empty .toc-page-num spans.
    """
    # --- Pass 1: render to PDF to find where headings land ---
    headings = collect_headings_from_html(html)
    print(f"[DEBUG] Collected headings count: {len(headings)}")
    for i, h in enumerate(headings[:5]):
        print(f"[DEBUG] Heading {i}: {h}")

    pass1_pdf = await generate_pdf_from_html(html, format=format)
    print(f"[DEBUG] Pass 1 PDF generated. Bytes: {len(pass1_pdf)}")

    toc_entries = extract_toc_entries(pass1_pdf, headings)
    print(f"[DEBUG] Extracted TOC entries count: {len(toc_entries)}")
    for i, entry in enumerate(toc_entries[:5]):
        print(f"[DEBUG] Matched Entry {i}: {entry}")

    # --- Inject page numbers into the HTML ---
    soup = BeautifulSoup(html, "html.parser")
    page_num_spans = soup.select(".toc-page-num")
    print(f"[DEBUG] Found {len(page_num_spans)} .toc-page-num spans in HTML")

    # Build a lookup: heading title -> page number
    page_lookup = {}
    for entry in toc_entries:
        page_lookup[entry["title"]] = entry["page"]

    # For each TOC row, find its title sibling and inject the page number
    matched_count = 0
    for span in page_num_spans:
        row = span.find_parent(class_="toc-row")
        if not row:
            continue
        title_span = row.select_one(".toc-title")
        if not title_span:
            continue
        title_text = title_span.get_text(strip=True)
        if title_text in page_lookup:
            span.string = str(page_lookup[title_text])
            matched_count += 1

    print(f"[DEBUG] Injected page numbers into {matched_count} spans")
    final_html = str(soup)

    # --- Pass 2: render the final PDF with page numbers filled in ---
    return await generate_pdf_from_html(final_html, format=format)