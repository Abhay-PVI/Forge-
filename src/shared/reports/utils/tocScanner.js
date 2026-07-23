// Generic scanner + numbering + renderer — works for any report, no report-specific logic.

export function renderSimpleList(entries, { key = "displayTitle" } = {}) {
  return entries
    .map((e) => {
      const pageNum = e.page != null ? e.page : "";
      return `<div class="toc-row toc-level-${e.level || 1}">
        <span class="toc-title">${e[key] || e.title}</span>
        <span class="toc-dots"></span>
        <span class="toc-page-num">${pageNum}</span>
      </div>`;
    })
    .join("\n");
}

export function renderSectionIfNotEmpty(title, entries, { key = "displayTitle" } = {}) {
  if (!entries || entries.length === 0) return "";
  return `<h2 class="heading">${title}</h2><div class="toc-section">${renderSimpleList(entries, { key })}</div>`;
}

export function scanAndNumberReportContent(bodyHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(bodyHtml, "text/html");

  const headingEls = Array.from(doc.querySelectorAll(".toc-heading"));
  const rawHeadings = headingEls.map((el) => ({
    title: el.textContent.trim(),
    level: Number(el.getAttribute("data-toc-level")) || 1,
  }));

  const numberedHeadings = assignHeadingNumbers(rawHeadings);

  headingEls.forEach((el, i) => {
    el.textContent = numberedHeadings[i].displayTitle;
  });

  const numberedBodyHtml = doc.body.innerHTML;

  const tables = Array.from(doc.querySelectorAll(".toc-table-caption")).map((el) => ({ title: el.textContent.trim() }));
  const figures = Array.from(doc.querySelectorAll(".toc-figure-caption")).map((el) => ({ title: el.textContent.trim() }));
  const abbreviations = Array.from(doc.querySelectorAll(".toc-abbreviation")).map((el) => ({
    term: el.getAttribute("data-term") || "",
    meaning: el.textContent.trim(),
  }));

  return { numberedBodyHtml, headings: numberedHeadings, tables, figures, abbreviations };
}

function assignHeadingNumbers(rawHeadings) {
  const counters = [];

  return rawHeadings.map((h) => {
    const levelIndex = h.level - 1;

    counters.length = levelIndex + 1;
    counters[levelIndex] = (counters[levelIndex] || 0) + 1;

    const number = counters.slice(0, levelIndex + 1).join(".");

    return {
      ...h,
      number,
      displayTitle: `${number} ${h.title}`,
    };
  });
}

if (typeof window !== "undefined") {
  window.__addAbbreviationRow = function (btn) {
    const page = btn.closest(".loa-page, #loa-content") || document;
    const tbody = page.querySelector(".abbreviations-table tbody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.className = "abbreviation-row";
    tr.innerHTML = `
      <td class="loa-term-cell" contenteditable="true">NEW</td>
      <td class="loa-meaning-cell" contenteditable="true">Description</td>
      <td class="loa-action-cell" data-pdf-export-exclude="true" style="width: 32px; text-align: center; vertical-align: middle;">
        <button type="button" class="loa-del-btn" title="Remove row" onclick="this.closest('tr').remove()">&times;</button>
      </td>
    `;
    tbody.appendChild(tr);
    const termCell = tr.querySelector(".loa-term-cell");
    if (termCell) termCell.focus();
  };

  window.__syncAndCleanAbbreviations = function (btn) {
    const container = btn.closest('[id$="-report"]') || document.querySelector('[id$="-report"]') || document.body;
    const table = (btn.closest(".loa-page, #loa-content") || document).querySelector(".abbreviations-table");
    if (!table || !container) return;

    // Collect body text (excluding TOC, LOA, and Cover pages)
    const bodyPages = Array.from(container.querySelectorAll(".report-page, .page"))
      .filter((p) => !p.classList.contains("loa-page") && !p.classList.contains("toc-page") && !p.classList.contains("cover-page"));

    const bodyText = (bodyPages.length > 0 ? bodyPages : [container])
      .map((el) => el.textContent || "")
      .join(" ");

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const unusedItems = [];

    rows.forEach((tr) => {
      const termCell = tr.querySelector(".loa-term-cell") || tr.cells[0];
      const meaningCell = tr.querySelector(".loa-meaning-cell") || tr.cells[1];
      if (!termCell) return;
      const term = termCell.textContent.trim();
      const meaning = meaningCell ? meaningCell.textContent.trim() : "";
      if (!term) return;

      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (!regex.test(bodyText)) {
        unusedItems.push({ term, meaning, tr });
      }
    });

    if (unusedItems.length === 0) {
      alert("Sync complete! All listed abbreviations are present in the report text.");
      return;
    }

    const termListStr = unusedItems
      .map((item) => `• ${item.term}: ${item.meaning}`)
      .join("\n");

    const confirmMessage = `The following ${unusedItems.length} abbreviation(s) were NOT found in the report text:\n\n${termListStr}\n\nDo you want to delete these unused abbreviation(s)?`;

    const userApproved = window.confirm(confirmMessage);
    if (userApproved) {
      unusedItems.forEach((item) => item.tr.remove());
      alert(`Deleted ${unusedItems.length} unused abbreviation(s).`);
    }
  };
}

export function renderAbbreviationsTable(entries) {
  if (!entries || entries.length === 0) return "";

  const uniqueMap = new Map();
  entries.forEach((e) => {
    const key = e.term.trim().toUpperCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { term: e.term.trim(), meaning: e.meaning.trim() });
    }
  });

  const sorted = Array.from(uniqueMap.values()).sort((a, b) =>
    a.term.localeCompare(b.term)
  );

  const rows = sorted
    .map(
      (e) => `
      <tr class="abbreviation-row">
        <td class="loa-term-cell" contenteditable="true">${e.term}</td>
        <td class="loa-meaning-cell" contenteditable="true">${e.meaning}</td>
        <td class="loa-action-cell" data-pdf-export-exclude="true" style="width: 32px; text-align: center; vertical-align: middle;">
          <button type="button" class="loa-del-btn" title="Remove row" onclick="this.closest('tr').remove()">&times;</button>
        </td>
      </tr>
    `
    )
    .join("\n");

  return `
    <h2 class="heading">List of Abbreviations</h2>
    <table class="abbreviations-table">
      <thead>
        <tr>
          <th style="width: 25%;">Abbreviation</th>
          <th>Term/Phrase/Name</th>
          <th class="loa-action-cell" data-pdf-export-exclude="true" style="width: 32px;"></th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="loa-edit-controls" data-pdf-export-exclude="true">
      <button type="button" class="loa-add-btn" onclick="window.__addAbbreviationRow && window.__addAbbreviationRow(this)">
        + Add Abbreviation Row
      </button>
      <button type="button" class="loa-clean-btn" onclick="window.__syncAndCleanAbbreviations && window.__syncAndCleanAbbreviations(this)">
        &#8635; Sync & Clean Unused
      </button>
    </div>
  `;
}
