
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


def _container_memory_mb():
    """Return cgroup memory usage when running inside a Linux container."""
    for path in (
        "/sys/fs/cgroup/memory.current",
        "/sys/fs/cgroup/memory/memory.usage_in_bytes",
    ):
        try:
            with open(path, "r", encoding="ascii") as memory_file:
                return int(memory_file.read().strip()) / 1024 / 1024
        except (FileNotFoundError, OSError, ValueError):
            continue
    return None


def log_memory(label: str):
    """Log RSS for Python and all currently running child processes.

    Playwright runs Chromium in child processes, so reporting only the Python
    process substantially understates the memory used by PDF generation.
    """
    python_process = psutil.Process(os.getpid())
    processes = [python_process]
    try:
        processes.extend(python_process.children(recursive=True))
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

    python_rss = 0
    child_rss = 0
    live_processes = 0
    for index, process in enumerate(processes):
        try:
            rss = process.memory_info().rss
            if index == 0:
                python_rss = rss
            else:
                child_rss += rss
            live_processes += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    python_mb = python_rss / 1024 / 1024
    child_mb = child_rss / 1024 / 1024
    tree_mb = python_mb + child_mb
    container_mb = _container_memory_mb()
    container_text = (
        f", container/cgroup={container_mb:.1f} MB"
        if container_mb is not None
        else ""
    )
    print(
        f"[MEMORY] {label}: tree RSS={tree_mb:.1f} MB "
        f"(Python={python_mb:.1f} MB, children={child_mb:.1f} MB, "
        f"child processes={max(0, live_processes - 1)}{container_text})"
    )
    return container_mb if container_mb is not None else tree_mb


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
            entries.append({
                "title": h["original_title"],
                "level": h["level"],
                "page": None,
            })
                    
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
TOC_PAGE_MARKER = "@@"


def _inject_toc_markers(soup: BeautifulSoup) -> list:
    """Reserve TOC number cells and return their titles in document order."""
    page_num_spans = soup.select(".toc-page-num")
    marker_titles = []
    for span in page_num_spans:
        row = span.find_parent(class_="toc-row")
        title_span = row.select_one(".toc-title") if row else None
        marker_titles.append(clean_text(title_span.get_text()) if title_span else "")
        span.clear()
        span.append(TOC_PAGE_MARKER)
    return marker_titles


def _patch_toc_page_numbers(
    pdf_bytes: bytes, toc_entries: list, expected_marker_count: int
) -> bytes:
    """Replace TOC markers in an existing PDF without re-rendering HTML."""
    if expected_marker_count == 0:
        return pdf_bytes

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        marker_locations = []
        for page_index, page in enumerate(doc):
            for rect in page.search_for(TOC_PAGE_MARKER):
                marker_locations.append((page_index, rect))

        marker_locations.sort(key=lambda item: (item[0], item[1].y0, item[1].x0))
        if len(marker_locations) != expected_marker_count:
            raise RuntimeError(
                "TOC marker count mismatch: "
                f"expected {expected_marker_count}, found {len(marker_locations)}"
            )
        if len(toc_entries) != expected_marker_count:
            raise RuntimeError(
                "TOC entry count mismatch: "
                f"expected {expected_marker_count}, got {len(toc_entries)}"
            )

        locations_by_page = {}
        for entry, (page_index, marker_rect) in zip(toc_entries, marker_locations):
            page = doc[page_index]
            redact_rect = fitz.Rect(
                marker_rect.x0 - 0.5,
                marker_rect.y0 - 0.5,
                marker_rect.x1 + 0.5,
                marker_rect.y1 + 0.5,
            )
            page.add_redact_annot(redact_rect, fill=(1, 1, 1), cross_out=False)
            locations_by_page.setdefault(page_index, []).append((entry, redact_rect))

        for page_index in locations_by_page:
            doc[page_index].apply_redactions()

        injected_count = 0
        for page_index, replacements in locations_by_page.items():
            page = doc[page_index]
            for entry, marker_rect in replacements:
                page_number = entry.get("page")
                if page_number is None:
                    continue
                text_rect = fitz.Rect(
                    marker_rect.x0 - 2,
                    marker_rect.y0 - 1,
                    marker_rect.x1 + 2,
                    marker_rect.y1 + 2,
                )
                spare_height = page.insert_textbox(
                    text_rect,
                    str(page_number),
                    fontname="helv",
                    fontsize=9,
                    color=(30 / 255, 41 / 255, 59 / 255),
                    align=fitz.TEXT_ALIGN_RIGHT,
                    overlay=True,
                )
                if spare_height < 0:
                    raise RuntimeError(
                        f"TOC page number {page_number} did not fit its marker cell"
                    )
                injected_count += 1

        print(
            f"[PROFILE] Patched {injected_count}/{expected_marker_count} "
            "TOC page numbers directly in the PDF"
        )
        return doc.tobytes(garbage=3, deflate=True)
    finally:
        doc.close()


def merge_pdf_documents(main_pdf: bytes, appendix_pdf: bytes) -> bytes:
    """Append a native PDF to the main report without rasterizing its pages."""
    if not appendix_pdf:
        return main_pdf

    main_doc = fitz.open(stream=main_pdf, filetype="pdf")
    appendix_doc = fitz.open(stream=appendix_pdf, filetype="pdf")
    try:
        appendix_pages = len(appendix_doc)
        target_rect = main_doc[-1].rect
        for page_number in range(appendix_pages):
            target_page = main_doc.new_page(
                width=target_rect.width,
                height=target_rect.height,
            )
            target_page.show_pdf_page(
                target_page.rect,
                appendix_doc,
                page_number,
                keep_proportion=True,
            )
        merged_pdf = main_doc.tobytes(garbage=3, deflate=True)
        print(
            f"[PROFILE] Merged {appendix_pages} native appendix PDF pages "
            "at the main report page size"
        )
        return merged_pdf
    finally:
        appendix_doc.close()
        main_doc.close()


async def generate_pdf_with_toc(html: str, browser=None, *, format: str = "Letter") -> bytes:
    """Generate a PDF while allowing only one full Chromium pipeline at a time."""
    async with pdf_generation_semaphore:
        return await _generate_pdf_with_toc_unlocked(html, browser, format=format)


async def _generate_pdf_with_toc_unlocked(
    html: str, browser=None, *, format: str = "Letter"
) -> bytes:
    t_start = time.time()
    log_memory("Function start")

    soup = BeautifulSoup(html, "html.parser")
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
    marker_titles = _inject_toc_markers(soup)
    marker_count = len(marker_titles)
    render_html = str(soup)
    del soup

    t_parse = time.time()
    print(
        f"[PROFILE] BS4 collect headings + TOC markers took: "
        f"{t_parse - t_start:.3f}s (Headings: {len(headings)}, markers: {marker_count})"
    )
    log_memory("After BS4 parse + marker injection")

    close_browser_needed = False
    p = None
    context = None
    page = None
    rendered_pdf = None
    try:
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
            print(
                f"[PROFILE] Playwright context setup + browser launch took: "
                f"{t_init - t_parse:.3f}s"
            )
        else:
            print(
                f"[PROFILE] Using global browser instance. Setup overhead: "
                f"{t_init - t_parse:.3f}s"
            )
        log_memory("After browser launch")

        context = await browser.new_context()
        page = await context.new_page()
        t_page = time.time()
        print(f"[PROFILE] Page open took: {t_page - t_init:.3f}s")
        log_memory("After page/context creation")

        print("[PROFILE] Starting single Chromium render...")
        await page.set_content(render_html, wait_until="networkidle")
        del render_html
        log_memory("After single-pass set_content")

        rendered_pdf = await page.pdf(
            format=format,
            print_background=True,
            prefer_css_page_size=True,
        )
        t_render = time.time()
        print(f"[PROFILE] Single Chromium render complete: {t_render - t_page:.3f}s")
        log_memory("After single-pass page.pdf()")
    finally:
        if page:
            await page.close()
        if context:
            await context.close()
        if close_browser_needed and browser:
            await browser.close()
        if p:
            await p.stop()
        gc.collect()
        log_memory("After Chromium cleanup + gc.collect()")

    if rendered_pdf is None:
        raise RuntimeError("Chromium did not produce a PDF")

    print("[PROFILE] Starting PyMuPDF TOC scan and in-place patch...")
    t_scan = time.time()
    toc_entries = extract_toc_entries(rendered_pdf, headings)
    page_lookup = {
        clean_text(entry["title"]): entry.get("page")
        for entry in toc_entries
        if entry.get("page") is not None
    }
    toc_replacements = [
        {"title": title, "page": page_lookup.get(title)}
        for title in marker_titles
    ]
    final_pdf = _patch_toc_page_numbers(
        rendered_pdf, toc_replacements, marker_count
    )
    del rendered_pdf
    gc.collect()
    t_done = time.time()
    matched_count = sum(
        entry.get("page") is not None for entry in toc_replacements
    )
    print(
        f"[PROFILE] PyMuPDF TOC patch complete: {t_done - t_scan:.3f}s "
        f"(TOC rows matched: {matched_count}/{len(toc_replacements)})"
    )
    log_memory("After TOC patch")
    print(
        f"[PROFILE] generate_pdf_with_toc grand total time: "
        f"{t_done - t_start:.3f}s"
    )
    return final_pdf
