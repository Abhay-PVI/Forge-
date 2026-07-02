export function scanReportContent(bodyHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyHtml, "text/html");

    const rawHeadings = Array.from(doc.querySelectorAll(".toc-heading")).map((el) => ({
        title: el.textContent.trim(),
        level: Number(el.getAttribute("data-toc-level")) || 1,
    }));

    const headings = assignHeadingNumbers(rawHeadings);

    const tables = Array.from(doc.querySelectorAll(".toc-table-caption")).map((el) => ({
        title: el.textContent.trim(),
    }));

    const figures = Array.from(doc.querySelectorAll(".toc-figure-caption")).map((el) => ({
        title: el.textContent.trim(),
    }));

    const abbreviations = Array.from(doc.querySelectorAll(".toc-abbreviation")).map((el) => ({
        term: el.getAttribute("data-term") || "",
        meaning: el.textContent.trim(),
    }));

    return { headings, tables, figures, abbreviations };
}

// Generic numbering engine — works for any depth (1, 1.1, 1.2.1, 1.2.1.1, ...)
function assignHeadingNumbers(rawHeadings) {
    const counters = []; // counters[i] = current count at level i+1

    return rawHeadings.map((h) => {
        const levelIndex = h.level - 1; // level 1 -> index 0

        // Reset deeper counters when we move to a shallower/same level
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