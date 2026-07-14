
"""Common PDF generation helper using Playwright.

The front‑end `exportPdf` function POSTs JSON `{ html: "<full html>" }` to
`/api/generate-pdf`.  This module provides a reusable async function that
creates a Chromium instance, renders the HTML, and returns the PDF bytes.
"""
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import asyncio
import time
import gc
import psutil
import os

python_process = psutil.Process(os.getpid())
_process = python_process

def log_memory(label: str):
    mem_mb = _process.memory_info().rss / 1024 / 1024
    print(f"[MEMORY] {label}: {mem_mb:.1f} MB")
    return mem_mb


async def generate_pdf_from_html(html: str, browser=None, *, format: str = "A4") -> bytes:
    """Render *html* in headless Chromium and return a PDF."""
    t0 = time.time()
    
    close_browser_needed = False
    p = None
    if browser is None:
        p = await async_playwright().start()
        browser = await p.chromium.launch(
            args=[
                "--proxy-server=direct://",
                "--proxy-bypass-list=*",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-first-run",
                "--no-sandbox",
            ]
        )
        close_browser_needed = True
        
    t1 = time.time()
    if close_browser_needed:
        print(f"[PROFILE] Playwright context setup + browser launch took: {t1 - t0:.3f}s")
    else:
        print(f"[PROFILE] Using global browser instance. Setup overhead: {t1 - t0:.3f}s")
        
    context = None
    page = None
    try:
        context = await browser.new_context()
        page = await context.new_page()
        t2 = time.time()
        print(f"[PROFILE] Page open took: {t2 - t1:.3f}s")
        
        await page.set_content(html, wait_until="networkidle")
        t3 = time.time()
        print(f"[PROFILE] Load content (networkidle) took: {t3 - t2:.3f}s")
        
        pdf_bytes = await page.pdf(
            format=format, 
            print_background=True,
            prefer_css_page_size=True,
        )
        t4 = time.time()
        print(f"[PROFILE] Playwright page.pdf print took: {t4 - t3:.3f}s")
        return pdf_bytes
    finally:
        if page:
            await page.close()
        if context:
            await context.close()
        if close_browser_needed:
            await browser.close()
            if p:
                await p.stop()
        t5 = time.time()
        print(f"[PROFILE] generate_pdf_from_html total time: {t5 - t0:.3f}s")


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
pdf_generation_semaphore = asyncio.Semaphore(1)


async def generate_pdf_with_toc(html: str, browser=None, *, format: str = "Letter") -> bytes:
    t_start = time.time()
    log_memory("Function start")
    
    close_browser_needed = False
    p = None
    if browser is None:
        p = await async_playwright().start()
        browser = await p.chromium.launch(
            args=[
                "--proxy-server=direct://",
                "--proxy-bypass-list=*",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-first-run",
                "--no-sandbox",
            ]
        )
        close_browser_needed = True
        
    t_init = time.time()
    if close_browser_needed:
        print(f"[PROFILE] Playwright context setup + browser launch took: {t_init - t_start:.3f}s")
    else:
        print(f"[PROFILE] Using global browser instance. Setup overhead: {t_init - t_start:.3f}s")
    log_memory("After browser launch")
        
    # Parse BeautifulSoup once to get headings and reuse the soup object
    soup = BeautifulSoup(html, "html.parser")
    
    # Collect headings, tables, figures
    headings = [
        {"title": h.get_text(strip=True), "level": int(h.get("data-toc-level", 1))}
        for h in soup.select(".toc-heading")
    ]
    tables = [
        {"title": t.get_text(strip=True), "level": 1}
        for t in soup.select(".toc-table-caption")
    ]
    figures = [
        {"title": f.get_text(strip=True), "level": 1}
        for f in soup.select(".toc-figure-caption")
    ]
    headings = headings + tables + figures
    
    t1 = time.time()
    print(f"[PROFILE] BS4 collect headings took: {t1 - t_init:.3f}s (Count: {len(headings)})")
    log_memory("After BS4 parse")
    
    async with pdf_generation_semaphore:
        context = None
        page = None
        try:
            context = await browser.new_context()
            page = await context.new_page()
            t2 = time.time()
            print(f"[PROFILE] Page open took: {t2 - t1:.3f}s")
            log_memory("After page/context creation")
            
            # Pass 1 Render (use original html string)
            print("[PROFILE] Starting Pass 1 Render...")
            await page.set_content(html, wait_until="networkidle")
            log_memory("After Pass 1 set_content")
            
            pass1_pdf = await page.pdf(format=format, print_background=True)
            t3 = time.time()
            print(f"[PROFILE] Pass 1 Render complete: {t3 - t2:.3f}s")
            log_memory("After Pass 1 page.pdf()")
            
            # PyMuPDF scan
            print("[PROFILE] Starting PyMuPDF scan...")
            toc_entries = extract_toc_entries(pass1_pdf, headings)
            t4 = time.time()
            print(f"[PROFILE] PyMuPDF scan complete: {t4 - t3:.3f}s (Entries matched: {len(toc_entries)})")
            log_memory("After PyMuPDF scan")
            
            del pass1_pdf
            log_memory("After del pass1_pdf")
            
            # BS4 Injection on the existing parsed soup
            print("[PROFILE] Starting BS4 Injection...")
            page_num_spans = soup.select(".toc-page-num")
            page_lookup = {clean_text(entry["title"]): entry["page"] for entry in toc_entries}
            matched_count = 0
            for span in page_num_spans:
                row = span.find_parent(class_="toc-row")
                if not row:
                    continue
                title_span = row.select_one(".toc-title")
                if not title_span:
                    continue
                title_text = clean_text(title_span.get_text())
                if title_text in page_lookup:
                    span.string = str(page_lookup[title_text])
                    matched_count += 1
            final_html = str(soup)
            del soup
            t5 = time.time()
            print(f"[PROFILE] BS4 Injection complete: {t5 - t4:.3f}s (Injected spans: {matched_count})")
            log_memory("After BS4 injection + del soup")
            
            # Pass 2 Render on SAME page
            print("[PROFILE] Starting Pass 2 Render on reused page...")
            await page.set_content(final_html, wait_until="networkidle")
            log_memory("After Pass 2 set_content")
            
            final_pdf = await page.pdf(
                format=format,
                print_background=True,
                prefer_css_page_size=True,
            )
            t6 = time.time()
            print(f"[PROFILE] Pass 2 Render complete: {t6 - t5:.3f}s")
            log_memory("After Pass 2 page.pdf()")
            
            return final_pdf
        finally:
            if page:
                await page.close()
            if context:
                await context.close()
            if close_browser_needed:
                await browser.close()
                if p:
                    await p.stop()
            gc.collect()
            log_memory("After final cleanup + gc.collect()")
            t7 = time.time()
            print(f"[PROFILE] generate_pdf_with_toc grand total time: {t7 - t_start:.3f}s")
