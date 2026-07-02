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
    .map((e) => `<tr><td>${e.term}</td><td>${e.meaning}</td></tr>`)
    .join("\n");

  return `
    <h2 class="heading">List of Abbreviations</h2>
    <table class="abbreviations-table">
      <thead>
        <tr><th>Abbreviation</th><th>Term/Phrase/Name</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}
