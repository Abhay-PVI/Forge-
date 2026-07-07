
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
    
    # Build a map of all page texts (clean) for efficient lookup
    page_texts = [clean_text(doc[i].get_text()) for i in range(len(doc))]
    
    # Dynamically detect where the body starts:
    # The TOC/pre-amble pages contain heading TITLES as plain text (in toc-row spans).
    # The body pages contain those same titles as actual headings.
    # Strategy: find the FIRST page (from page 0) where the first heading appears,
    # then find the SECOND occurrence of that heading — the body page.
    # Simpler approach: find how many pages appear BEFORE any heading appears for the
    # second time (body), using the first heading as a sentinel.
    body_start_page = 1  # 1-indexed, default fallback
    
    if cleaned_headings:
        first_title = cleaned_headings[0]["title"]
        occurrences = [
            i for i, pt in enumerate(page_texts) if first_title in pt
        ]
        if len(occurrences) >= 2:
            # Second occurrence is the body (first is the TOC row)
            body_start_page = occurrences[1] + 1  # convert to 1-indexed
        elif len(occurrences) == 1:
            # Only one occurrence — must be the body
            body_start_page = occurrences[0] + 1
    
    # Safety floor: body can't start before page 3 (cover + doc-control minimum)
    body_start_page = max(3, body_start_page)
    print(f"[DEBUG] Dynamically detected body_start_page as {body_start_page}")

    for h in cleaned_headings:
        matched = False
        start_search_idx = max(0, body_start_page - 1)
        
        # Search FORWARD from body start to get first occurrence in body
        # (avoids picking TOC/pre-amble repeated text)
        for page_num in range(start_search_idx, len(doc)):
            if h["title"] in page_texts[page_num]:
                entries.append({
                    "title": h["original_title"],
                    "level": h["level"],
                    "page": page_num + 1,  # 1-indexed
                })
                matched = True
                break
        
        # Fallback: case-insensitive forward search
        if not matched:
            for page_num in range(start_search_idx, len(doc)):
                if h["title"].lower() in page_texts[page_num].lower():
                    entries.append({
                        "title": h["original_title"],
                        "level": h["level"],
                        "page": page_num + 1,
                    })
                    matched = True
                    break
        
        if not matched:
            print(f"[DEBUG] Could not find heading on any page: {h['title']!r}")
                    
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