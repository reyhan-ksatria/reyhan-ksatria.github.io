// Element references and table state; content arrays come from data.js
const $ = id => document.getElementById(id);
const tbody = $("course-body"), searchInput = $("course-search"), noResult = $("no-result"), resultCount = $("result-count");
const prevBtn = $("prev-btn"), nextBtn = $("next-btn"), pageNumber = $("page-number");
const rowsPerPage = 10;
let filtered = courses, currentPage = 1;

// Score bar width equals the score out of 100, and its color is the grade color used in the grade mix so each color means one grade
const scoreCell = (s, g) => s === null ? '<span class="score-na">Not published</span>' : `<span class="score"><span class="score-bar${g === "A" ? " is-a" : g === "B+" ? " is-bplus" : ""}"><i style="width: ${Math.min(100, s)}%"></i></span>${s.toFixed(2)}</span>`;
const gradeCell = g => g === null ? '<span class="grade grade-none">In progress</span>' : `<span class="grade ${g === "A" ? "grade-a" : "grade-bplus"}">${g}</span>`;

// Render the current page of filtered courses and update pager state; when nothing matches, the note suggests a different keyword and, while a grade filter is on, switching it back to All
function renderTable() {
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    currentPage = Math.min(currentPage, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    tbody.innerHTML = pageRows.map(([rank, name, credits, score, grade]) => `<tr><td class="num">${rank ?? "–"}</td><td>${name}</td><td class="num">${credits}</td><td>${scoreCell(score, grade)}</td><td>${gradeCell(grade)}</td></tr>`).join("");
    noResult.hidden = filtered.length > 0; noResult.textContent = `No course matches that search. Try a different keyword${gradeFilter ? " or switch the grade filter to All" : ""}.`;
    resultCount.textContent = filtered.length === courses.length ? `${courses.length} courses` : `${filtered.length} of ${courses.length} courses`;
    pageNumber.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || filtered.length === 0;
}

// Filter by course name and by the selected grade chip, then return to the first page
let gradeFilter = "";
function applyFilter() {
    const q = searchInput.value.trim().toLowerCase();
    filtered = courses.filter(([, name, , , grade]) => (!q || name.toLowerCase().includes(q)) && (!gradeFilter || grade === gradeFilter));
    currentPage = 1; $("search-clear").hidden = !q;
    renderTable();
}
searchInput.addEventListener("input", applyFilter);
$("search-clear").addEventListener("click", () => { searchInput.value = ""; applyFilter(); searchInput.focus(); });
document.querySelectorAll("[data-grade]").forEach(b => b.addEventListener("click", () => { gradeFilter = b.dataset.grade; document.querySelectorAll("[data-grade]").forEach(x => x.setAttribute("aria-pressed", x === b)); applyFilter(); }));

// Pagination buttons step one page at a time
prevBtn.addEventListener("click", () => { currentPage--; renderTable(); });
nextBtn.addEventListener("click", () => { currentPage++; renderTable(); });

// Build the grade mix bar, legend, and course count from the course list
function renderGradeMix() {
    const graded = courses.filter(c => c[4] !== null);
    const groups = [["A", "var(--grade-a)"], ["B+", "var(--grade-b)"]].map(([g, color]) => ({ g, color, n: graded.filter(c => c[4] === g).length }));
    $("mix-bar").innerHTML = groups.map(({ n, color }) => `<span style="width: ${n / graded.length * 100}%; background: ${color}"></span>`).join("");
    $("mix-legend").innerHTML = groups.map(({ g, n, color }) => `<li><span class="swatch" style="background: ${color}"></span><b>${g}</b> ${n} courses (${(n / graded.length * 100).toFixed(1)}%)</li>`).join("") + "<li>No grades below B+</li>";
    $("stat-courses").textContent = graded.length;
}

// External links open in a new tab while local PDFs and anchors stay simple
const linkAttrs = href => /^https?:|\.(pdf|png|jpe?g|webp)$/i.test(href) ? ' target="_blank" rel="noopener"' : "";

// Preview pane beside a research entry: an embedded PDF, an image, or a blank frame until a preview is added
const previewPane = r => !r.preview ? '<div class="paper-preview is-empty" aria-hidden="true"></div>' : /\.pdf$/i.test(r.preview) ? `<div class="paper-preview"><iframe src="${r.preview}#toolbar=0&view=FitH" title="${r.title}" loading="lazy"></iframe></div>` : `<div class="paper-preview"><img src="${r.preview}" alt="First page of ${r.title}" loading="lazy"></div>`;

// Render research entries from data.js with the text on the left and the preview centered above its link on the right; the preview opens the same document as the link, and an entry without a file shows a muted note in place of the link
const researchLink = r => r.file ? `<a href="${r.file}"${linkAttrs(r.file)} class="text-link">${r.linkLabel || "View document"}</a>` : `<span class="text-link is-pending" aria-disabled="true">${r.pendingLabel || "Coming soon"}</span>`;
function renderResearch() {
    $("research-list").innerHTML = research.map(r => `<article class="paper"${r.id ? ` id="${r.id}"` : ""}${hueStyle(researchHue[r.type])}><div class="paper-body"><div class="paper-meta"><span class="tag">${r.type}</span>${r.period ? `<time>${r.period}</time>` : ""}</div><h3>${r.title}</h3><p>${r.summary}</p></div><div class="paper-side">${r.file ? `<a href="${r.file}"${linkAttrs(r.file)} class="preview-link" tabindex="-1" aria-hidden="true">${previewPane(r)}</a>` : previewPane(r)}${researchLink(r)}</div></article>`).join("");
}

// Render the first project listed for each main field as a card with a cover scene for its field, then a field chip under the cover, the title, summary, and a footer showing Free with the ZIP size when known and a light Get project link that fills with the field color on hover and asks for confirmation before downloading the project ZIP from its zip path, or from files/projects named after the project title when zip is empty, plus the intro and the bundle banner with one fanned folder for every main field found in the bundle
const zipPath = p => p.zip || `files/projects/${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.zip`;
const folderIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>';

// Cover scenes for each field drawn on a 360 by 120 canvas, with the important parts kept in the middle so narrow cards still show them: a farm field in the rain with rows of young apple trees and tomato bushes stepping back toward a line of trees and misty mountains whose peaks are rounded and slopes gently curved with a little roughness, both ranges lifted together so the near one stays clearly below the far one and above the line of trees, and snow on the two highest peaks under a dark rainy sky with an occasional flash of lightning, every apple tree and tomato bush in fresh but not saturated greens, leaning with a wind from the left at its own slow, medium, or fast pace, nearer and windward plants swinging further, beside a large apple tree on the left whose crown sways from its trunk, two newspapers stamped true and fake under a magnifying glass that zigzags unevenly from text to text from the top left to the top right and then retraces its path for language, a patient monitor over a faint Delhi skyline of separate towers, domes, and minarets tracing a jagged heartbeat line with evenly spaced spikes that grow in two turbulent stretches, the calm stretch after the last spike a little longer than the one before the first, warming in color along the way, for time series, three glasses of red, rosé, and white wine standing with soft contact shadows beside a bottle with a gold grape medallion on a lit tabletop for clustering, a row of houses at dusk under a golden sale price line that keeps redrawing with a warm comet fading in and out along it for regression, and two bank cards with a dark glass fingerprint sensor whose ridges glow cyan well inside its frame under a laser that sweeps across both, the fraud card flashing a red warning light and the legit card glowing a steady green for classification
const coverArt = (() => {
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const gust = (x, k) => { const u = rnd(), tier = u < 0.3 ? 0.7 : u < 0.75 ? 1.3 : 2.2, a = (2 + k * 4) * (1.25 - x / 360 * 0.6) * (0.8 + rnd() * 0.4); return `--d: ${(rnd() * 3).toFixed(2)}s; --t: ${tier.toFixed(2)}s; --a: ${a.toFixed(2)}deg`; };
    const bush = (x, y, k) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(2)})"><ellipse class="plant-shadow" cx="0" cy="1" rx="11" ry="2.4"/><g class="plant" style="${gust(x, k)}"><circle cx="-6" cy="-7" r="6.5" fill="url(#ca-bush)"/><circle cx="6" cy="-7" r="6.5" fill="url(#ca-bush)"/><circle cx="0" cy="-12" r="7.5" fill="url(#ca-bush)"/><circle cx="-2" cy="-5" r="1.9" fill="url(#ca-tomato)"/><circle cx="5" cy="-9" r="1.7" fill="url(#ca-tomato)"/><circle cx="-6" cy="-12" r="1.5" fill="url(#ca-tomato)"/></g></g>`;
    const sapling = (x, y, k) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(2)})"><ellipse class="plant-shadow" cx="0" cy="1" rx="10" ry="2.2"/><g class="plant" style="${gust(x, k)}"><path class="sapling-trunk" d="M0 0V-10"/><circle cx="0" cy="-17" r="9" fill="url(#ca-bush)"/><circle cx="-5" cy="-13" r="5.5" fill="url(#ca-bush)"/><circle cx="5" cy="-14" r="5.5" fill="url(#ca-bush)"/><circle cx="-4" cy="-18" r="1.7" fill="url(#ca-apple)"/><circle cx="3" cy="-13" r="1.7" fill="url(#ca-apple)"/><circle cx="4" cy="-21" r="1.5" fill="url(#ca-apple)"/><circle cx="-6" cy="-12" r="1.5" fill="url(#ca-apple)"/></g></g>`;
    const fieldRows = [[67, .36], [77, .52], [91, .74], [110, 1]].map(([y, k], r) => { const gap = 44 * k, plant = r % 2 ? bush : sapling; let x = -10 + rnd() * gap, row = ""; while (x < 372) { row += plant(x, y + (rnd() - 0.5) * 1.5, k * (0.9 + rnd() * 0.2)); x += gap * (0.85 + rnd() * 0.3); } return `<path class="furrow" d="M-10 ${y + 2}H370" style="stroke-width: ${(9 * k).toFixed(1)}"/><g>${row}</g>`; }).join("");
    const bigTree = (x, k, d) => `<g class="sway-tree" style="--d: ${d}s; transform-origin: ${x}px 120px"><path class="big-trunk" d="M${x - 3 * k} 122C${x - 2 * k} 104 ${x - 3 * k} 90 ${x - 1 * k} ${120 - 50 * k}L${x + 1.5 * k} ${120 - 50 * k}C${x + 3 * k} 90 ${x + 3 * k} 104 ${x + 4 * k} 122Z"/><path class="big-branch" d="M${x} ${120 - 40 * k}L${x - 9 * k} ${120 - 52 * k}M${x + 1 * k} ${120 - 44 * k}L${x + 10 * k} ${120 - 55 * k}"/><g class="canopy" style="--d: ${d}s; transform-origin: ${x}px ${(120 - 46 * k).toFixed(1)}px">${[[-12, -58, 11, "dark"], [12, -60, 11, "dark"], [0, -70, 14, ""], [-9, -76, 10, ""], [10, -76, 10, ""], [0, -84, 9, "lit"], [-14, -66, 8, ""], [15, -67, 8, ""]].map(([dx, dy, r, t]) => `<circle cx="${(x + dx * k).toFixed(1)}" cy="${(120 + dy * k).toFixed(1)}" r="${(r * k).toFixed(1)}" fill="url(#ca-canopy)"${t ? ` class="leaf-${t}"` : ""}/>`).join("")}${[[-6, -64], [8, -70], [-2, -78], [12, -60], [-12, -70]].map(([dx, dy]) => `<circle cx="${(x + dx * k).toFixed(1)}" cy="${(120 + dy * k).toFixed(1)}" r="${(2.2 * k).toFixed(1)}" fill="url(#ca-apple)"/>`).join("")}</g></g>`;
    const ridge = (pts, n) => { const xs = Array.from({ length: n + 1 }, (_, i) => -10 + i * 380 / n), ys = xs.map(x => { let y = 0; for (let k = 0; k < pts.length - 1; k++) if (x >= pts[k][0] && x <= pts[k + 1][0]) { const t = (x - pts[k][0]) / (pts[k + 1][0] - pts[k][0]), e = (1 - Math.cos(Math.PI * t)) / 2; y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * e; } return y + (rnd() - 0.5) * 1.2; }); return { xs, ys, d: "M" + xs.map((x, i) => `${x.toFixed(1)} ${ys[i].toFixed(1)}`).join("L") }; };
    const far = ridge([[-10, 48], [40, 20.2], [72, 27.2], [110, 11.8], [150, 28.6], [190, 17.4], [236, 30], [272, 14.6], [312, 27.2], [370, 18.8]], 95), near = ridge([[-10, 56], [30, 36], [70, 44], [120, 30], [170, 46], [220, 35], [270, 44], [320, 32], [370, 40]], 76);
    const farRidge = far.d, nearRidge = near.d, snowLine = far.xs.map(x => `${x.toFixed(1)} ${(16 + 2.8 * Math.exp(-(((x - 110) / 40) ** 2)) + 1.7 * Math.exp(-(((x - 272) / 40) ** 2)) + Math.sin(x / 6) * 0.8 + (rnd() - 0.5) * 1.2).toFixed(1)}`).reverse().join("L").replace(/^/, "L");
    const treeLine = Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 14.5 + rnd() * 6).toFixed(1)}" cy="${(57 + rnd() * 2).toFixed(1)}" r="${(5 + rnd() * 4).toFixed(1)}"/>`).join("");
    const vision = `<defs><linearGradient id="ca-sky" x2="0" y2="1"><stop offset="0" stop-color="#2c3340"/><stop offset=".6" stop-color="#5d6776"/><stop offset="1" stop-color="#8d969c"/></linearGradient><linearGradient id="ca-ground" x2="0" y2="1"><stop offset="0" stop-color="#506e3b"/><stop offset="1" stop-color="#344f2a"/></linearGradient><clipPath id="ca-far-clip"><path d="${farRidge}V64H-10Z"/></clipPath><linearGradient id="ca-mist" x2="0" y2="1"><stop offset="0" stop-color="#9aa4ab" stop-opacity="0"/><stop offset="1" stop-color="#9aa4ab" stop-opacity=".55"/></linearGradient><radialGradient id="ca-bush" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8bbb5c"/><stop offset=".55" stop-color="#4f8a3a"/><stop offset="1" stop-color="#2f5f28"/></radialGradient><radialGradient id="ca-canopy" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#78a84e"/><stop offset=".6" stop-color="#437a34"/><stop offset="1" stop-color="#284f24"/></radialGradient><radialGradient id="ca-apple" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff7a6a"/><stop offset=".5" stop-color="#d7192f"/><stop offset="1" stop-color="#8a0a1c"/></radialGradient><radialGradient id="ca-tomato" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff9a6a"/><stop offset=".5" stop-color="#ee3f1f"/><stop offset="1" stop-color="#a81d0c"/></radialGradient><pattern id="ca-rain" width="31" height="58" patternUnits="userSpaceOnUse"><path d="M6 2l-3 10M22 14l-3 11M14 33l-2.5 9M29 42l-3 10M2 47l-2 7" stroke="#dbe6f0" stroke-width=".7" stroke-linecap="round" opacity=".5"/></pattern><pattern id="ca-rain2" width="23" height="47" patternUnits="userSpaceOnUse"><path d="M17 5l-2.4 8M8 24l-2.6 9M20 36l-2 6" stroke="#c5d3e0" stroke-width=".55" stroke-linecap="round" opacity=".38"/></pattern></defs><rect width="360" height="120" fill="url(#ca-sky)"/><path class="mountain-far" d="${farRidge}V64H-10Z"/><g clip-path="url(#ca-far-clip)"><path class="mountain-snow" d="M-10 0H370${snowLine}Z"/></g><path class="mountain-near" d="${nearRidge}V66H-10Z"/><rect y="34" width="360" height="30" fill="url(#ca-mist)"/><g class="tree-line">${treeLine}</g><rect y="60" width="360" height="60" fill="url(#ca-ground)"/>${fieldRows}${bigTree(58, .97, 0)}<rect class="rain rain-back" x="-60" y="-94" width="480" height="320" fill="url(#ca-rain2)"/><rect class="rain" x="-60" y="-116" width="480" height="340" fill="url(#ca-rain)"/><rect class="flash" width="360" height="120"/>`;
    const paper = (x, y, r, cls, stamp) => `<g transform="translate(${x} ${y}) rotate(${r})"><g class="news ${cls}"><rect class="sheet" x="-62" y="-46" width="124" height="96" rx="2"/><rect class="mast" x="-52" y="-38" width="104" height="9" rx="1"/><path class="rule" d="M-52 -25h104M-52 -23h104"/><rect class="headline" x="-52" y="-18" width="70" height="6" rx="1"/><rect class="headline" x="-52" y="-9" width="52" height="6" rx="1"/><rect class="photo" x="24" y="-18" width="28" height="22" rx="1"/><path class="col" d="M-52 6h46M-52 12h46M-52 18h40M-52 24h46M-52 30h34M-52 36h46M2 12h50M2 18h50M2 24h44M2 30h50M2 36h38"/><g class="stamp" transform="translate(-6 8) rotate(-14)"><rect x="-26" y="-11" width="52" height="22" rx="3"/><text x="0" y="5" text-anchor="middle">${stamp}</text></g></g></g>`;
    const language = `<defs><linearGradient id="ca-desk" x2="1" y2="1"><stop offset="0" stop-color="#2a1420"/><stop offset="1" stop-color="#4a1e33"/></linearGradient><radialGradient id="ca-glass" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".6" stop-color="#cfe6ff" stop-opacity=".22"/><stop offset="1" stop-color="#9cc6ef" stop-opacity=".35"/></radialGradient><filter id="ca-frost" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".8"/></filter><filter id="ca-paper-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity=".45"/></filter></defs><rect width="360" height="120" fill="url(#ca-desk)"/><path class="desk-glow" d="M0 0H360V120H0Z"/><g transform="translate(26 7) scale(.85)">${paper(140, 62, -8, "is-true", "TRUE")}${paper(222, 56, 6, "is-fake", "FAKE")}</g><g class="lens-move"><path class="lens-handle" d="M13 13l14 14"/><rect class="lens-collar" x="10" y="10" width="7" height="5" rx="1.5" transform="rotate(45 13.5 12.5)"/><circle class="lens" r="15" fill="url(#ca-glass)" filter="url(#ca-frost)"/><path class="lens-glare" d="M-9 -6a11 11 0 0 1 9 -6"/><circle class="lens-rim" r="15"/></g>`;
    let v = 0; const raw = Array.from({ length: 181 }, (_, i) => { const vol = i > 40 && i < 80 ? 9 : i > 118 && i < 150 ? 7 : 3; v = v * 0.55 + (rnd() - 0.5) * 2 * vol; const beat = [26, 46, 67, 87, 107, 128, 148].reduce((b, p) => i >= p && i - p < 3 ? i - p : b, 9); return v + (beat === 0 ? -26 : beat === 1 ? 22 : beat === 2 ? -8 : 0) * (vol / 6 + 0.5); });
    const lo = Math.min(...raw), hi = Math.max(...raw), trace = raw.map((y, i) => `${(i * 2).toFixed(0)},${(14 + (y - lo) / (hi - lo) * 92).toFixed(1)}`).join(" ");
    const skylineItems = [["t", 14, 78], ["t", 10, 58], ["m", 6, 92], ["t", 18, 96], ["d", 26, 30], ["t", 12, 66], ["t", 16, 104], ["t", 20, 72], ["t", 10, 88], ["d", 22, 26], ["t", 22, 100], ["t", 12, 76], ["t", 18, 110], ["m", 6, 96], ["t", 14, 82], ["t", 20, 94], ["d", 20, 24], ["t", 16, 106], ["t", 12, 80], ["t", 22, 98], ["t", 10, 70], ["m", 6, 90], ["t", 18, 88], ["t", 14, 108], ["t", 20, 74], ["t", 12, 92]]; let sx = 2;
    const towers = skylineItems.map(([t, w, h]) => { const x = sx; sx += w + 3; if (t === "d") { const r = w / 2, cx = x + r, y = 120 - h; return `<path d="M${x} 120V${y}A${r} ${(r * 1.15).toFixed(1)} 0 0 1 ${x + w} ${y}V120Z"/><path class="spire" d="M${cx} ${(y - r * 1.15).toFixed(1)}v-6"/>`; } if (t === "m") return `<path d="M${x} 120V${120 - h}L${x + w / 2} ${120 - h - 8}L${x + w} ${120 - h}V120Z"/>`; return `<rect x="${x}" y="${120 - h}" width="${w}" height="${h}"/>${h > 85 ? `<rect class="antenna" x="${x + w / 2 - 0.5}" y="${120 - h - 7}" width="1" height="7"/>` : ""}`; }).join("");
    const series = `<defs><pattern id="ca-grid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#16243f" stroke-width=".7"/></pattern><pattern id="ca-grid2" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#22365e" stroke-width="1"/></pattern><radialGradient id="ca-crt" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#0b1730"/><stop offset="1" stop-color="#03060f"/></radialGradient><linearGradient id="ca-sweep"><stop offset="0" stop-color="#9fe8ff" stop-opacity="0"/><stop offset="1" stop-color="#9fe8ff" stop-opacity=".22"/></linearGradient><linearGradient id="ca-heat" gradientUnits="userSpaceOnUse" x1="0" x2="360" y1="0" y2="0"><stop offset="0" stop-color="#4ee6c8"/><stop offset=".2" stop-color="#7fd7ff"/><stop offset=".32" stop-color="#ffb24a"/><stop offset=".42" stop-color="#ff5d7a"/><stop offset=".55" stop-color="#c49bff"/><stop offset=".66" stop-color="#7fd7ff"/><stop offset=".78" stop-color="#ffb24a"/><stop offset=".88" stop-color="#ff5d7a"/><stop offset="1" stop-color="#4ee6c8"/></linearGradient><linearGradient id="ca-city-fade" x2="0" y2="1"><stop offset="0" stop-color="#5a7bb8" stop-opacity=".05"/><stop offset="1" stop-color="#5a7bb8" stop-opacity=".32"/></linearGradient><clipPath id="ca-reveal"><rect class="reveal" width="360" height="120"/></clipPath></defs><rect width="360" height="120" fill="url(#ca-crt)"/><g class="delhi" fill="url(#ca-city-fade)">${towers}</g><rect width="360" height="120" fill="url(#ca-grid)"/><rect width="360" height="120" fill="url(#ca-grid2)"/><polyline class="trace-dim" points="${trace}"/><g clip-path="url(#ca-reveal)"><polyline class="trace" points="${trace}"/></g><rect class="sweep" x="-36" width="36" height="120" fill="url(#ca-sweep)"/><circle class="live-dot" cx="266" cy="13" r="3"/><text class="hud" x="273" y="16.2">LIVE</text>`;
    const glass = (x, wine, top, k) => `<g transform="translate(${x} 34)"><g clip-path="url(#ca-bowl)"><g class="wine" style="--k: ${k}"><rect x="-30" y="20" width="60" height="30" fill="${wine}"/><ellipse cx="0" cy="20" rx="22" ry="2.6" fill="${top}"/></g></g><path class="bowl" d="M-20 0C-22 22-14 40 0 42C14 40 22 22 20 0Z"/><path class="shine" d="M-15 4C-16 18-12 30-5 36"/><rect class="stem" x="-1.4" y="42" width="2.8" height="24"/><ellipse class="foot" cx="0" cy="67" rx="15" ry="2.8"/></g>`;
    const bokeh = Array.from({ length: 9 }, () => `<circle cx="${(rnd() * 360).toFixed(0)}" cy="${(rnd() * 70).toFixed(0)}" r="${(6 + rnd() * 12).toFixed(0)}" fill="${["#ffb86b", "#ff8fa8", "#ffd9a0"][Math.floor(rnd() * 3)]}" opacity="${(0.12 + rnd() * 0.2).toFixed(2)}"/>`).join("");
    const groups = `<defs><linearGradient id="ca-room" x2="0" y2="1"><stop offset="0" stop-color="#241228"/><stop offset="1" stop-color="#4a2238"/></linearGradient><linearGradient id="ca-wood" x2="0" y2="1"><stop offset="0" stop-color="#3a2014"/><stop offset="1" stop-color="#1c0e08"/></linearGradient><linearGradient id="ca-top" x2="0" y2="1"><stop offset="0" stop-color="#4a2a1c"/><stop offset="1" stop-color="#7a4a30"/></linearGradient><linearGradient id="ca-bottle" x2="1"><stop offset="0" stop-color="#0c2418"/><stop offset=".45" stop-color="#2c5a40"/><stop offset="1" stop-color="#0a1d13"/></linearGradient><filter id="ca-soft"><feGaussianBlur stdDeviation="4"/></filter><clipPath id="ca-bowl"><path d="M-20 0C-22 22-14 40 0 42C14 40 22 22 20 0Z"/></clipPath></defs><rect width="360" height="120" fill="url(#ca-room)"/><g filter="url(#ca-soft)">${bokeh}</g><rect y="94" width="360" height="17" fill="url(#ca-top)"/><path class="table-edge" d="M0 94.5H360"/><rect y="111" width="360" height="9" fill="url(#ca-wood)"/><path class="table-lip" d="M0 111H360"/>${[96, 160, 216, 272].map((x, i) => `<ellipse class="contact" cx="${x}" cy="${i ? 101.6 : 103}" rx="${i ? 17 : 15}" ry="2.4"/>`).join("")}<g transform="translate(96 0)"><path d="M-4 10h8v16c0 6 12 10 12 22v52a3 3 0 0 1-3 3h-26a3 3 0 0 1-3-3V48c0-12 12-16 12-22Z" fill="url(#ca-bottle)"/><rect class="foil" x="-4.5" y="8" width="9" height="11" rx="1.5"/><rect class="neck-band" x="-4.6" y="22" width="9.2" height="4" rx="1"/><path class="bottle-gloss" d="M-11 50c-1.4 10-1.4 32 0 44h1.8c-1.2-12-1.2-34 0-44Z"/><g class="medal"><circle cx="1" cy="68" r="8"/><circle class="medal-ring" cx="1" cy="68" r="6.4"/><g class="grapes" transform="translate(1 68) scale(.7) translate(.2 -69.5)"><circle cx="-2" cy="65" r="1.6"/><circle cx="1.6" cy="65" r="1.6"/><circle cx="-3.8" cy="68" r="1.6"/><circle cx="-0.2" cy="68" r="1.6"/><circle cx="3.4" cy="68" r="1.6"/><circle cx="-2" cy="71" r="1.6"/><circle cx="1.6" cy="71" r="1.6"/><circle cx="-0.2" cy="74" r="1.6"/></g></g></g>${glass(160, "#6e0f2c", "#a3264a", 0)}${glass(216, "#d9718c", "#f1a2b5", 1)}${glass(272, "#dcbf62", "#f4e2a2", 2)}`;
    const houses = [[-14, 34, 18], [26, 30, 22], [62, 40, 14], [108, 30, 20], [144, 42, 16], [192, 32, 24], [230, 38, 15], [274, 34, 21], [314, 40, 18]].map(([x, w, h], i) => { const y = 120 - h - 12; return `<g class="house"><path d="M${x - 4} ${y + 2}L${x + w / 2} ${y - 14}L${x + w + 4} ${y + 2}Z"/><rect x="${x}" y="${y}" width="${w}" height="${h + 12}"/>${i % 3 === 0 ? `<rect x="${x + w - 9}" y="${y - 14}" width="5" height="10"/>` : ""}${[[6, 4], [w - 14, 4], [6, h - 2], [w - 14, h - 2]].filter(([, dy]) => dy + 7 < h + 10).filter((_, k) => (i + k) % 4 !== 3).map(([dx, dy]) => `<rect class="win" x="${x + dx}" y="${y + dy}" width="8" height="7" rx="1"/>`).join("")}</g>`; }).join("");
    const pricePts = [[50, 66], [77, 61], [102, 64], [127, 54], [153, 57], [179, 45], [204, 48], [231, 37], [256, 34], [282, 26], [310, 19]];
    const scatter = `<defs><linearGradient id="ca-dusk" x2="0" y2="1"><stop offset="0" stop-color="#1f3466"/><stop offset=".55" stop-color="#b8648a"/><stop offset="1" stop-color="#f4a76f"/></linearGradient><radialGradient id="ca-sun"><stop offset="0" stop-color="#ffe3a0"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient><linearGradient id="ca-under" x2="0" y2="1"><stop offset="0" stop-color="#ffc56b" stop-opacity=".22"/><stop offset="1" stop-color="#ffc56b" stop-opacity="0"/></linearGradient><linearGradient id="ca-side"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".15" stop-color="#fff"/><stop offset=".85" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="ca-side-fade"><rect x="50" width="260" height="120" fill="url(#ca-side)"/></mask></defs><rect width="360" height="120" fill="url(#ca-dusk)"/><circle cx="210" cy="104" r="46" fill="url(#ca-sun)"/><polygon class="price-area" mask="url(#ca-side-fade)" points="50,120 ${pricePts.map(p => p.join(",")).join(" ")} 310,120" fill="url(#ca-under)"/><polyline class="price" pathLength="1" points="${pricePts.map(p => p.join(",")).join(" ")}"/><polyline class="price-comet" pathLength="1" points="${pricePts.map(p => p.join(",")).join(" ")}"/>${pricePts.map(([x, y], i) => `<circle class="price-dot" cx="${x}" cy="${y}" r="2" style="--i: ${i}"/>`).join("")}<circle class="price-pulse" cx="310" cy="19" r="4"/><path class="ground" d="M0 108H360V120H0Z"/>${houses}`;
    const card = (x, y, r, cls) => `<g transform="translate(${x} ${y}) rotate(${r})"><g class="bank ${cls}"><rect class="card-face" x="-60" y="-38" width="120" height="76" rx="8"/><path class="card-sheen" d="M-60 10L40 -38H60V-10L-28 38H-60Z"/><rect class="chip" x="-48" y="-14" width="17" height="13" rx="2.5"/><path class="chip-line" d="M-48 -7.5h17M-42 -14v13M-37 -14v13"/><path class="wave" d="M-24 -12a7 7 0 0 1 0 9M-20 -14a10 10 0 0 1 0 13M-16 -16a13 13 0 0 1 0 17"/><path class="card-strip" d="M-48 14h64M-48 24h30"/><g><rect class="finger-ring" x="30" y="10" width="24" height="19" rx="5"/><g class="finger" clip-path="url(#ca-holo-clip)"><rect class="finger-pad" x="31" y="11" width="22" height="17" rx="4"/><path class="finger-ridge" transform="translate(42 19.5) scale(.8) translate(-42 -19)" d="M37 25c0-6 2.5-10 5-10s5 4 5 10M39.5 25c0-4.5 1.2-7 2.5-7s2.5 2.5 2.5 7M42 25v-4.5M35 21c.8-5 3.6-8 7-8s6.2 3 7 8"/></g></g><rect class="alarm" x="-60" y="-38" width="120" height="76" rx="8"/><circle class="led" cx="${cls === "is-fraud" ? -46 : 46}" cy="-26" r="4"/></g></g>`;
    const tree = `<defs><linearGradient id="ca-vault" x2="1" y2="1"><stop offset="0" stop-color="#0b1610"/><stop offset="1" stop-color="#1c3424"/></linearGradient><linearGradient id="ca-gold" x2="1" y2="1"><stop offset="0" stop-color="#f3d47a"/><stop offset=".5" stop-color="#b98a2e"/><stop offset="1" stop-color="#e6c463"/></linearGradient><linearGradient id="ca-holo" x2="1" y2="1"><stop offset="0" stop-color="#8fe9ff"/><stop offset=".35" stop-color="#c8a8ff"/><stop offset=".65" stop-color="#ffb8d9"/><stop offset="1" stop-color="#ffe29a"/></linearGradient><clipPath id="ca-holo-clip"><rect x="31" y="11" width="22" height="17" rx="4"/></clipPath><radialGradient id="ca-sensor" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#1d3a4a"/><stop offset="1" stop-color="#071318"/></radialGradient><linearGradient id="ca-laser" x2="1"><stop offset="0" stop-color="#7dff8a" stop-opacity="0"/><stop offset=".5" stop-color="#7dff8a"/><stop offset="1" stop-color="#7dff8a" stop-opacity="0"/></linearGradient></defs><rect width="360" height="120" fill="url(#ca-vault)"/><path class="ray" d="M240 0L300 0L190 120L130 120Z"/><path class="ray" d="M320 0L340 0L250 120L230 120Z"/>${card(136, 64, -10, "is-fraud")}${card(226, 58, 7, "is-legit")}<rect class="laser" x="58" y="0" width="250" height="2.4" fill="url(#ca-laser)"/>`;
    const art = { "Computer Vision": vision, "NLP": language, "Time Series": series, "Clustering": groups, "Regression": scatter, "Classification": tree };
    return f => `<svg class="cover-art" viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${art[f] || vision}</svg>`;
})();
function renderProjects() {
    const seen = new Set(), shown = projects.filter(p => !seen.has(p.fields[0]) && seen.add(p.fields[0]));
    $("project-list").innerHTML = shown.map(p => `<li class="card pcard"${hueStyle(fieldHue[p.fields[0]])}><div class="pcard-cover">${coverArt(p.fields[0])}</div><div class="pcard-body"><span class="pcard-chip">${fieldIcon(p.fields[0])}${p.fields[0]}</span><h3>${p.title}</h3><p>${p.summary}</p><div class="pcard-foot"><span class="pcard-meta">Free${p.size ? ` · ${p.size}` : ""}</span><a href="${zipPath(p)}" download class="download-btn" data-project="${projects.indexOf(p)}">${folderIcon}Get project</a></div></div></li>`).join("");
    $("projects-lede").textContent = `These ${["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][shown.length] ?? shown.length} projects are free to download. More are available in the Machine Learning Bundle, which is built for learning, research, and portfolio building.`;
    $("banner-stack").innerHTML = [...new Set(bundle.projects.map(p => p.fields[0]))].map((f, i, all) => `<span class="stack-folder" style="--hue: var(--${fieldHue[f]}); --i: ${i - (all.length - 1) / 2}">${fieldIcon(f)}</span>`).join("");
}

// Generic line icons for skills, a code bracket for programming, a bar chart with a trend for statistics, and a formula page for typesetting, plus the medal on certificate stubs
const skillIcons = { "Python": '<path d="M8 7.5L3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.5 5.5l-3 13"/>', "R": '<path d="M3.5 20.5h17"/><path d="M6.5 20.5v-6M11 20.5V9M15.5 20.5v-8M20 20.5V5"/><path d="M5 11l5-4.5 4.5 3L20 3.5"/>', "LaTeX": '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4"/><path d="M14 11H9.5l2.6 2.6-2.6 2.6H14"/>' };
const medalIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 13.6L7.4 21l4.6-2.5 4.6 2.5-1.6-7.4"/><circle cx="12" cy="9" r="5.6"/><path class="star" d="M12 6.2l.85 1.75 1.9.25-1.4 1.3.35 1.9-1.7-.95-1.7.95.35-1.9-1.4-1.3 1.9-.25Z"/></svg>';

// Render the experience timeline with any role label beside its title, the skill cards with their uses, and the certificate cards from data.js, where only the link on a certificate opens its file
function renderExperience() {
    $("experience-list").innerHTML = experience.map(x => `<li><h3>${x.title}${x.role ? `<span class="role-tag">${x.role}</span>` : ""}</h3><p>${x.detail}</p>${x.period ? `<time>${x.period}</time>` : ""}</li>`).join("");
    $("skill-list").innerHTML = skills.map(k => `<article class="card skill"><svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">${skillIcons[k.title] || skillIcons.Python}</svg><h4>${k.title}</h4><ul class="chips">${k.uses.map(u => `<li>${u}</li>`).join("")}</ul></article>`).join("");
    $("cert-list").innerHTML = certificates.map(c => `<article class="card cert"><div class="cert-stub">${medalIcon}</div><div class="cert-body"><div class="cert-head"><h4>${c.title}</h4>${c.items ? `<ul class="cert-pill">${c.items.map(i => `<li title="${i.name}">${i.code}</li>`).join("")}</ul>` : ""}</div><p>${c.issuer}</p>${c.file ? `<a href="${c.file}"${linkAttrs(c.file)} class="text-link">${c.linkLabel || "View certificate"}</a>` : ""}</div></article>`).join("");
    $("skill-count").textContent = skills.length; $("cert-count").textContent = certificates.length;
}

// At a glance: the academic card gets its credit total, grade mix, and five best courses from data.js
function renderGlance() {
    const graded = courses.filter(c => c[4] !== null);
    $("stat-credits").textContent = courses.reduce((s, c) => s + c[2], 0);
    const groups = [["A", "var(--grade-a)"], ["B+", "var(--grade-b)"]].map(([g, color]) => ({ g, color, n: graded.filter(c => c[4] === g).length }));
    $("glance-mix").innerHTML = groups.map(({ n, color }) => `<span style="width: ${n / graded.length * 100}%; background: ${color}"></span>`).join("");
    $("glance-mix-legend").innerHTML = groups.map(({ g, n, color }) => `<span><i style="background: ${color}"></i><b>${n}</b> Grade ${g}</span>`).join("");
    $("glance-top").innerHTML = courses.filter(c => c[0] && c[0] <= 5).sort((p, q) => p[0] - q[0]).map(c => `<li><span>${c[1]}</span><em>${c[3].toFixed(2)}</em></li>`).join("");
}

// Download confirmation: a download button opens a dialog naming the project with its field, ZIP size, and folder contents, and the file is only saved from the dialog's own button; it closes with Cancel, a click outside, or Esc
const dlConfirm = $("dl-confirm"), dlGo = $("dl-go");
const contentIcons = { Notebook: '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 15.5h6"/>', README: '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4"/><path d="M10 11.5v5l1.8-2 1.8 2v-5"/>', Dataset: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>', Checkpoints: '<path d="M5 4h11l3 3v13H5Z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>', Images: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="8.7" r="1.55"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>', Submission: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 9v11.5"/>' };
document.addEventListener("click", e => {
    const btn = e.target.closest(".download-btn[data-project]"); if (!btn || !dlConfirm.showModal) return;
    e.preventDefault(); const p = projects[+btn.dataset.project], f = p.fields[0];
    dlConfirm.setAttribute("style", `--hue: var(--${fieldHue[f]})`);
    $("dl-field").innerHTML = `${fieldIcon(f)}${f}`; $("dl-title").textContent = `Download ${p.title}?`;
    $("dl-size").textContent = p.size || ""; $("dl-size").hidden = !p.size;
    $("dl-contents").innerHTML = (p.contents || []).map(c => `<li><svg viewBox="0 0 24 24" aria-hidden="true">${contentIcons[c] || contentIcons.Notebook}</svg>${c}</li>`).join(""); $("dl-contents").hidden = !p.contents;
    dlGo.href = zipPath(p); dlGo.setAttribute("download", ""); dlConfirm.showModal(); dlGo.focus();
});
dlGo.addEventListener("click", () => dlConfirm.close());
$("dl-cancel").addEventListener("click", () => dlConfirm.close());
dlConfirm.addEventListener("click", e => { if (e.target === dlConfirm) dlConfirm.close(); });

// Certificate images open in a lightbox above the page, closed by the button, a click outside the image, or Esc; PDFs and web pages keep opening in a new tab
const lightbox = $("lightbox"), lbImg = $("lightbox-img"), lbMissing = $("lightbox-missing"), isImage = href => /\.(png|jpe?g|webp)$/i.test(href);
function openLightbox(c) {
    lbMissing.hidden = true; lbImg.hidden = false; lbImg.alt = `${c.title} certificate`; lbImg.src = c.file;
    $("lightbox-caption").textContent = `${c.title} · ${c.issuer}`;
    lightbox.showModal(); $("lightbox-close").focus();
}
lbImg.addEventListener("error", () => { lbImg.hidden = true; lbMissing.hidden = false; });
$("lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", e => { if (e.target === lightbox) lightbox.close(); });
lightbox.addEventListener("close", () => lbImg.removeAttribute("src"));
$("cert-list").addEventListener("click", e => {
    const link = e.target.closest("a[href]"), card = e.target.closest(".cert"); if (!link || !card) return;
    const c = certificates[[...card.parentNode.children].indexOf(card)];
    if (c && isImage(c.file) && lightbox.showModal) { e.preventDefault(); openLightbox(c); }
});

// The GPA ring fills once the ring itself scrolls into view, so a tall stack of cards on phones still triggers it, or right away when motion is reduced
const statsBand = $("stats");
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) statsBand.classList.add("is-in");
else new IntersectionObserver((entries, obs) => { if (entries[0].isIntersecting) { obs.disconnect(); statsBand.classList.add("is-in"); } }, { threshold: 0.6 }).observe(statsBand.querySelector(".gpa-ring"));

// Theme toggle flips the data-theme attribute and remembers the choice
const themeToggle = $("theme-toggle"), themeLabel = themeToggle.querySelector(".theme-label");
const syncThemeLabel = () => themeLabel.textContent = document.documentElement.dataset.theme === "dark" ? "Light Mode" : "Dark Mode";
themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncThemeLabel(); paintSky(performance.now() / 1000);
    if (viewMode === "3d") render3d();
});

// Highlight the nav link of the section currently in view
const navLinks = document.querySelectorAll(".nav-link");
const sections = ["top", "about", "academic", "research", "projects", "experience", "skills", "contact"].map($);
function syncActiveLink() {
    const atBottom = innerHeight + scrollY >= document.body.offsetHeight - 4;
    const current = atBottom ? "contact" : sections.filter(s => s.getBoundingClientRect().top < 160).pop()?.id ?? "top";
    navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
    placeNavIndicator();
    const max = document.documentElement.scrollHeight - innerHeight;
    $("scroll-progress").style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}
addEventListener("scroll", syncActiveLink, { passive: true });

// The indicator glides to the active link, vertically in the sidebar and horizontally in the top bar on small screens, where the bar also slides sideways to bring a newly active link to the middle
let navShown = null;
function placeNavIndicator() {
    const ind = $("nav-indicator"), active = document.querySelector(".nav-link.active");
    if (!ind || !active) return;
    ind.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`; ind.style.width = `${active.offsetWidth}px`; ind.style.height = `${active.offsetHeight}px`;
    const nav = active.parentElement;
    if (active !== navShown && nav.scrollWidth > nav.clientWidth) { nav.scrollTo({ left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2, behavior: navShown ? "smooth" : "instant" }); navShown = active; }
}
addEventListener("resize", placeNavIndicator);

// Survival plot geometry, survival functions, and the zoom window over days and probability
const plotSvg = $("survival-plot"), plotTip = $("plot-tip"), NS = "http://www.w3.org/2000/svg";
const PW = 720, PH = 360, pad = { l: 78, r: 20, t: 14, b: 56 }, innerW = PW - pad.l - pad.r, innerH = PH - pad.t - pad.b;
const lastEvent = thesisKM[thesisKM.length - 1][0], fullView = { x0: 0, x1: 930, y0: 0, y1: 1.05 };
let view = { ...fullView }, reveal = 0, animating = false, brushStart = null, ui = {};
const weibullS = t => Math.exp(-Math.pow(t / thesisFit.tau, thesisFit.k));
const kmS = t => { let s = 1; for (const [ti, si] of thesisKM) { if (ti > t) break; s = si; } return s; };

// Map data to SVG coordinates for the current view and back again
const sx = t => pad.l + (t - view.x0) / (view.x1 - view.x0) * innerW;
const sy = s => pad.t + (view.y1 - s) / (view.y1 - view.y0) * innerH;
const toData = (px, py) => ({ t: view.x0 + (px - pad.l) / innerW * (view.x1 - view.x0), s: view.y1 - (py - pad.t) / innerH * (view.y1 - view.y0) });
const svgPoint = e => { const p = plotSvg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(plotSvg.getScreenCTM().inverse()); };
const inPlot = p => p.x >= pad.l && p.x <= PW - pad.r && p.y >= pad.t && p.y <= PH - pad.b;

// Tick step of 1, 2, or 5 times a power of ten giving about five intervals, so the full view gets 0.2 and 200
const niceStep = range => { const raw = range / 5, mag = 10 ** Math.floor(Math.log10(raw)), f = raw / mag; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag; };
const ticks = (lo, hi) => { const step = niceStep(hi - lo), out = []; for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10)); return { out, step }; };
const decimals = step => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
const el = (parent, tag, attrs = {}) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); parent.appendChild(e); return e; };

// Draw axes, grid, both survival curves, and the cursor layer for the current view
function renderPlot() {
    plotSvg.textContent = "";
    const clip = el(el(plotSvg, "defs"), "clipPath", { id: "plot-clip" });
    ui.clipRect = el(clip, "rect", { x: pad.l, y: pad.t, width: innerW * reveal, height: innerH });

    // Horizontal gridlines with probability labels
    const yt = ticks(view.y0, view.y1);
    yt.out.forEach(v => { el(plotSvg, "line", { x1: pad.l, x2: PW - pad.r, y1: sy(v), y2: sy(v), class: "plot-grid" }); el(plotSvg, "text", { x: pad.l - 10, y: sy(v) + 4, "text-anchor": "end", class: "plot-label" }).textContent = v.toFixed(decimals(yt.step)); });

    // Vertical gridlines with day labels
    const xt = ticks(view.x0, view.x1);
    xt.out.forEach(v => { el(plotSvg, "line", { x1: sx(v), x2: sx(v), y1: pad.t, y2: PH - pad.b, class: "plot-grid" }); el(plotSvg, "text", { x: sx(v), y: PH - pad.b + 20, "text-anchor": "middle", class: "plot-label" }).textContent = v.toFixed(decimals(xt.step)); });

    // Axis lines and titles
    el(plotSvg, "line", { x1: pad.l, x2: PW - pad.r, y1: PH - pad.b, y2: PH - pad.b, class: "plot-axis" });
    el(plotSvg, "line", { x1: pad.l, x2: pad.l, y1: pad.t, y2: PH - pad.b, class: "plot-axis" });
    el(plotSvg, "text", { x: pad.l + innerW / 2, y: PH - 10, "text-anchor": "middle", class: "plot-title-axis" }).textContent = "Time (days)";
    el(plotSvg, "text", { x: 16, y: pad.t + innerH / 2, "text-anchor": "middle", transform: `rotate(-90 16 ${pad.t + innerH / 2})`, class: "plot-title-axis plot-title-y" }).textContent = "Survival Probability";

    // Both curves share a clip bounded exactly by the axes, which also drives the reveal animation
    const g = el(plotSvg, "g", { "clip-path": "url(#plot-clip)" });
    el(g, "path", { class: "plot-km", d: `M${sx(0)},${sy(1)} ` + thesisKM.map(([t, s]) => `H${sx(t).toFixed(2)} V${sy(s).toFixed(2)}`).join(" ") });
    const t0 = Math.max(0, view.x0), t1 = Math.min(lastEvent, view.x1);
    el(g, "path", { class: "plot-weibull", d: "M" + Array.from({ length: 241 }, (_, i) => { const t = t0 + (t1 - t0) * i / 240; return `${sx(t).toFixed(2)},${sy(weibullS(t)).toFixed(2)}`; }).join(" L") });

    // Cursor line, curve markers, and brush rectangle stay hidden until used
    ui.cursor = el(plotSvg, "line", { y1: pad.t, y2: PH - pad.b, class: "plot-cursor", visibility: "hidden" });
    ui.dotKm = el(plotSvg, "circle", { r: 5, class: "dot-km", visibility: "hidden" });
    ui.dotW = el(plotSvg, "circle", { r: 5, class: "dot-weibull", visibility: "hidden" });
    ui.brush = el(plotSvg, "rect", { class: "plot-brush", visibility: "hidden" });
}

// Place the cursor at the nearest whole day and show the readout of both survival values
function showCursor(t) {
    const inside = t >= Math.max(0, view.x0) && t <= Math.min(lastEvent, view.x1);
    [ui.cursor, ui.dotKm, ui.dotW].forEach(n => n.setAttribute("visibility", inside ? "visible" : "hidden"));
    plotTip.hidden = !inside;
    if (!inside) return;
    t = Math.round(t);
    const x = sx(t), km = kmS(t), w = weibullS(t), inRange = v => v >= view.y0 && v <= view.y1 ? "visible" : "hidden";
    ui.cursor.setAttribute("x1", x); ui.cursor.setAttribute("x2", x);

    // Each marker only shows when its value lies inside the visible probability range
    ui.dotKm.setAttribute("cx", x); ui.dotKm.setAttribute("cy", sy(km)); ui.dotKm.setAttribute("visibility", inRange(km));
    ui.dotW.setAttribute("cx", x); ui.dotW.setAttribute("cy", sy(w)); ui.dotW.setAttribute("visibility", inRange(w));
    plotTip.innerHTML = `<b>Day ${Math.round(t)}</b><span class="tk tk-km"><span>Kaplan–Meier</span><span>${km.toFixed(4)}</span></span><span class="tk tk-w"><span>Weibull</span><span>${w.toFixed(4)}</span></span><span class="tk"><span>Difference</span><span>${Math.abs(km - w).toFixed(4)}</span></span>`;
    const pct = x / PW * 100;
    plotTip.style.left = pct > 55 ? "" : `calc(${pct}% + 14px)`;
    plotTip.style.right = pct > 55 ? `calc(${100 - pct}% + 14px)` : "";
}

const hideCursor = () => { [ui.cursor, ui.dotKm, ui.dotW].forEach(n => n.setAttribute("visibility", "hidden")); plotTip.hidden = true; };

// Sweep both curves in from left to right at an even pace that only eases at the very ends, with the cursor riding the leading edge from day 0
function animateReveal() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { reveal = 1; ui.clipRect.setAttribute("width", innerW); return; }
    animating = true;
    const start = performance.now(), dur = 3200, ease = p => p < .1 ? 5 * p * p : p > .9 ? 1 - 5 * (1 - p) ** 2 : 1.25 * p - .125;
    const frame = now => {
        const p = Math.min(1, (now - start) / dur);
        reveal = ease(p);
        ui.clipRect.setAttribute("width", innerW * reveal);
        showCursor(view.x0 + reveal * (view.x1 - view.x0));
        if (p < 1) requestAnimationFrame(frame); else { animating = false; hideCursor(); }
    };
    requestAnimationFrame(frame);
}

// Zoom text shows one factor when both axes match, otherwise time and probability separately
const zoomText = (zx, zy) => Math.abs(zx - zy) / zy < 0.05 ? `Zoom ${zx.toFixed(1)}×` : `Zoom ${zx.toFixed(1)}× <small>time</small> ${zy.toFixed(1)}× <small>probability</small>`;
const zoomFactors = (w, h) => [(fullView.x1 - fullView.x0) / Math.max(20, w), (fullView.y1 - fullView.y0) / Math.max(0.02, h)];

// A non-increasing curve misses the box [a, b] x [lo, hi] when it is above it at b or below it at a
const curveMisses = (f, a, b, lo, hi) => f(b) > hi || f(a) < lo;

// Place the zoom badge in the first plot corner both curves leave empty, starting from the lower left
function placeZoomBadge(label) {
    const svgBox = plotSvg.getBoundingClientRect(), unit = PW / svgBox.width, gap = 10 * unit;
    const bw = (label.offsetWidth * unit + gap) / innerW * (view.x1 - view.x0), bh = (label.offsetHeight * unit + gap) / innerH * (view.y1 - view.y0);
    const corners = [
        { box: [view.x0, view.x0 + bw, view.y0, view.y0 + bh], css: { left: pad.l, bottom: pad.b } },
        { box: [view.x1 - bw, view.x1, view.y1 - bh, view.y1], css: { right: pad.r, top: pad.t } },
        { box: [view.x1 - bw, view.x1, view.y0, view.y0 + bh], css: { right: pad.r, bottom: pad.b } },
        { box: [view.x0, view.x0 + bw, view.y1 - bh, view.y1], css: { left: pad.l, top: pad.t } }
    ];
    const free = corners.find(({ box: [a, b, lo, hi] }) => curveMisses(kmS, a, b, lo, hi) && curveMisses(weibullS, a, b, lo, hi)) ?? corners[0];
    ["left", "right", "top", "bottom"].forEach(side => label.style[side] = side in free.css ? `calc(${free.css[side] / (side === "left" || side === "right" ? PW : PH) * 100}% + 10px)` : "");
}

// Zoom badge shows the current factor relative to the full chart and stays hidden at full scale
function updateZoomLevel() {
    const [zx, zy] = zoomFactors(view.x1 - view.x0, view.y1 - view.y0), label = $("zoom-level");
    label.hidden = true;
    if (zx <= 1.001 && zy <= 1.001) return;
    label.innerHTML = zoomText(zx, zy);
    label.hidden = false;
    placeZoomBadge(label);
}

// Live label beside the brush shows the zoom the selection will produce, flipping inward near the chart edges
function showBrushLevel(x, y) {
    const a = toData(brushStart.x, brushStart.y), b = toData(x, y), label = $("brush-level");
    const [zx, zy] = zoomFactors(Math.abs(b.t - a.t), Math.abs(b.s - a.s));
    label.innerHTML = zoomText(zx, zy);
    const right = Math.max(x, brushStart.x), bottom = Math.max(y, brushStart.y), top = Math.min(y, brushStart.y);
    const flipX = right > PW * 0.7, flipY = bottom > PH - pad.b - 30;
    label.style.left = flipX ? "" : `calc(${right / PW * 100}% + 8px)`;
    label.style.right = flipX ? `calc(${(PW - Math.min(x, brushStart.x)) / PW * 100}% + 8px)` : "";
    label.style.top = flipY ? `calc(${top / PH * 100}% - 34px)` : `calc(${bottom / PH * 100}% + 8px)`;
    label.hidden = false;
}

// Clamp a requested window to the data domain and keep a minimum size, then redraw
function setView(next) {
    const w = Math.max(20, Math.min(fullView.x1, next.x1 - next.x0)), h = Math.max(0.02, Math.min(fullView.y1, next.y1 - next.y0));
    const x0 = Math.min(Math.max(fullView.x0, next.x0), fullView.x1 - w), y0 = Math.min(Math.max(fullView.y0, next.y0), fullView.y1 - h);
    view = { x0, x1: x0 + w, y0, y1: y0 + h };
    renderPlot();
    updateZoomLevel();
}

// Zoom buttons scale the 2D window around its center or restore the full view, and hand over to the 3D camera in 3D mode
document.querySelectorAll("[data-zoom]").forEach(btn => btn.addEventListener("click", () => {
    if (viewMode === "3d") return zoom3d(btn.dataset.zoom);
    if (animating) return;
    const mode = btn.dataset.zoom, f = mode === "in" ? 0.5 : 2, cx = (view.x0 + view.x1) / 2, cy = (view.y0 + view.y1) / 2;
    setView(mode === "reset" ? fullView : { x0: cx - (view.x1 - view.x0) * f / 2, x1: cx + (view.x1 - view.x0) * f / 2, y0: cy - (view.y1 - view.y0) * f / 2, y1: cy + (view.y1 - view.y0) * f / 2 });
}));

// Mouse drag draws a brush rectangle and zooms into it on release
plotSvg.addEventListener("pointerdown", e => {
    const p = svgPoint(e);
    if (animating || e.pointerType !== "mouse" || e.button !== 0 || !inPlot(p)) return;
    brushStart = p; plotSvg.setPointerCapture(e.pointerId); hideCursor();
});
plotSvg.addEventListener("pointermove", e => {
    if (animating) return;
    const p = svgPoint(e);
    if (brushStart) {
        const x = Math.max(pad.l, Math.min(PW - pad.r, p.x)), y = Math.max(pad.t, Math.min(PH - pad.b, p.y));
        Object.entries({ x: Math.min(x, brushStart.x), y: Math.min(y, brushStart.y), width: Math.abs(x - brushStart.x), height: Math.abs(y - brushStart.y), visibility: "visible" }).forEach(([k, v]) => ui.brush.setAttribute(k, v));
        showBrushLevel(x, y);
        return;
    }
    inPlot(p) ? showCursor(toData(p.x, p.y).t) : hideCursor();
});
plotSvg.addEventListener("pointerup", e => {
    if (!brushStart) return;
    const p = svgPoint(e), a = toData(brushStart.x, brushStart.y), b = toData(p.x, p.y);
    brushStart = null; ui.brush.setAttribute("visibility", "hidden"); $("brush-level").hidden = true;
    if (Math.abs(sx(b.t) - sx(a.t)) > 10 && Math.abs(sy(b.s) - sy(a.s)) > 10) setView({ x0: Math.min(a.t, b.t), x1: Math.max(a.t, b.t), y0: Math.min(a.s, b.s), y1: Math.max(a.s, b.s) });
});
plotSvg.addEventListener("pointerleave", () => { if (!brushStart && !animating) hideCursor(); });
plotSvg.addEventListener("dblclick", () => { if (!animating) setView(fullView); });

// Negative log-likelihood of the Weibull model on the thesis data, the same objective the notebook minimizes
const negLogLik = (k, tau) => { let f = 0; for (const [t, d] of thesisData) f += (t / tau) ** k - d * (Math.log(k) + (k - 1) * Math.log(t) - k * Math.log(tau)); return f; };

// Surface domain, camera with a look-at target, and playback state for the 3D view
const canvas3d = $("likelihood-3d"), ctx3d = canvas3d.getContext("2d"), hud = $("hud-3d");
let fsScale = 1, fsBase = null;

// Keep the iteration readout on one line beside the full screen button, easing its font down slightly when needed and wrapping only on charts too narrow for one line
const fitHud = () => {
    hud.style.cssText = ""; let size = parseFloat(getComputedStyle(hud).fontSize); const floor = size - 2;
    while (hud.scrollWidth > hud.clientWidth + 1 && size > floor) { size -= 0.5; hud.style.fontSize = `${size}px`; }
    if (hud.scrollWidth > hud.clientWidth + 1) hud.style.cssText = "white-space: normal; flex-wrap: wrap;";
};
const dom = { k0: 0.8, k1: 1.85, t0: 320, t1: 520, n: 44 }, lastIter = bfgsPath.length - 1;
const camHome = { yaw: -0.7, pitch: 0.55, zoom: 1, tx: 0, ty: 0, tz: 0.5 };
let cam = { ...camHome }, grid = null, progress = 1, playing = false, playStart = 0, playFrom = 0, drag3d = null, spin = 0, opened3d = false, projectedPath = [];

// Evaluate the objective on the grid once and keep its range for coloring and height
function buildGrid() {
    const z = Array.from({ length: dom.n + 1 }, (_, i) => Array.from({ length: dom.n + 1 }, (_, j) => negLogLik(dom.k0 + (dom.k1 - dom.k0) * i / dom.n, dom.t0 + (dom.t1 - dom.t0) * j / dom.n)));
    const flat = z.flat().concat(bfgsPath.map(p => p[3]));
    grid = { z, fmin: Math.min(...flat), fmax: Math.max(...flat) };
}

// Three nested grids near the minimum so contours stay smooth from the outer rings down to the innermost ones at the closest zoom
const contourGrids = [
    { k0: 1.27, k1: 1.37, t0: 410, t1: 428, n: 90, levels: [7, 8, 9, 10] },
    { k0: 1.304, k1: 1.330, t0: 414.3, t1: 421.2, n: 100, levels: [1, 2, 3, 4, 5, 6] },
    { k0: 1.3141, k1: 1.3196, t0: 416.9, t1: 418.6, n: 90, levels: [-3, -2, -1, 0] }
];
let contours = null;

// Marching squares on one grid gives contour segments as pairs of (k, tau) points at one level
function contourSegments(g, z, level) {
    const segs = [], n = g.n, K = i => g.k0 + (g.k1 - g.k0) * i / n, T = j => g.t0 + (g.t1 - g.t0) * j / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], v = c.map(([a, b]) => z[a][b]), cross = [];
        for (let e = 0; e < 4; e++) {
            const a = e, b = (e + 1) % 4;
            if ((v[a] - level) * (v[b] - level) < 0) { const t = (level - v[a]) / (v[b] - v[a]); cross.push([lerp(K(c[a][0]), K(c[b][0]), t), lerp(T(c[a][1]), T(c[b][1]), t)]); }
        }
        if (cross.length >= 2) segs.push([cross[0], cross[1]]);
        if (cross.length === 4) segs.push([cross[2], cross[3]]);
    }
    return segs;
}

// Contour levels double in spacing away from the optimum; segments are traced once and reused every frame
function buildContours() {
    contours = contourGrids.flatMap(g => {
        const z = Array.from({ length: g.n + 1 }, (_, i) => Array.from({ length: g.n + 1 }, (_, j) => negLogLik(g.k0 + (g.k1 - g.k0) * i / g.n, g.t0 + (g.t1 - g.t0) * j / g.n)));
        return g.levels.map(i => { const level = grid.fmin + 0.00005 * 2 ** i; return { level, segs: contourSegments(g, z, level) }; });
    });
}

// World coordinates put k and tau on [-1, 1] and the objective on [0, 1]
const toWorld = (k, tau, f) => [(k - dom.k0) / (dom.k1 - dom.k0) * 2 - 1, (tau - dom.t0) / (dom.t1 - dom.t0) * 2 - 1, (f - grid.fmin) / (grid.fmax - grid.fmin)];
const lerp = (a, b, t) => a + (b - a) * t, smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Orthographic camera around a target point: yaw spins, pitch tilts, zoom scales, with a wider fit on tall phone canvases
function project([x, y, z], W, H) {
    x -= cam.tx; y -= cam.ty; z -= cam.tz;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const xr = x * cy - y * sy, yr = x * sy + y * cy, zc = z * 1.1, scale = Math.min(W / (H / W > 0.7 ? 3.1 : 3.6), H / 2.75) * cam.zoom;
    return { X: W / 2 + xr * scale, Y: H * 0.46 - (zc * cp + yr * sp) * scale, depth: yr * cp - zc * sp };
}

// Progress clamped to [0, 1] maps to a step i and an eased flight position e; the first step gets a longer slice for its long line search, and steps that tried several alphas spend the first part of their slice probing before the flight
const easeFlight = u => u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
const searchShare = i => lineSearch[i].length > 1 ? (i === 0 ? 0.72 : 0.45) : 0;
const stepWeight = Array.from({ length: 13 }, (_, i) => i === 0 ? 3.2 : 1), weightSum = stepWeight.reduce((a, b) => a + b, 0);
function pathAt(p) {
    p = Math.min(1, Math.max(0, p));
    let left = p * weightSum, i = 0;
    while (i < lastIter - 1 && left >= stepWeight[i]) { left -= stepWeight[i]; i++; }
    const u = Math.min(1, left / stepWeight[i]), sh = searchShare(i), fu = sh ? Math.max(0, (u - sh) / (1 - sh)) : u;
    return { s: i + u, i, u, e: easeFlight(fu), search: sh ? Math.min(1, u / sh) : 1, reached: u >= 0.999 ? i + 1 : i };
}

// Line search trial points x_r + alpha p_r in world space; trials far off the surface are capped just above the rim
const trialCache = [];
function trialsFor(i) {
    if (trialCache[i]) return trialCache[i];
    const [, k0, t0] = bfgsPath[i], [pk, pt] = searchDir[i];
    return trialCache[i] = lineSearch[i].map(([a, kind, phase, ix], m) => {
        const k = k0 + a * pk, tau = t0 + a * pt, f = negLogLik(k, tau), w = toWorld(k, tau, f);
        return { a, kind, phase, ix, k, tau, f, m, w: [w[0], w[1], Math.min(1.3, w[2])] };
    });
}

// Each step flies as an arc above the surface whose height scales with the step length, like a launch and landing
const iterWorld = () => bfgsPath.map(([, k, tau, f]) => toWorld(k, tau, f));
function arcPoint(Wp, i, e) {
    const A = Wp[i], B = Wp[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    return [lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e) + 0.45 * len * 4 * e * (1 - e)];
}

// Zoom for each step so its flight spans about two thirds of the view, deep enough that even the last sub-micro steps are visible
const stepZoom = Wp => Wp.slice(0, -1).map((A, i) => Math.min(5e8, Math.max(1.2, 2.3 / (Math.hypot(Wp[i + 1][0] - A[0], Wp[i + 1][1] - A[1]) || 1e-9))));

// Scale panel: a map-style ruler for a round distance in tau at the current zoom
const scaleBar = $("scale-3d");
const niceNum = d => { if (d >= 0.01) return String(+d.toPrecision(1)); const [m, e] = d.toExponential(0).split("e"); return `${m} × 10<sup>${e.replace("-", "−")}</sup>`; };
function updateScaleBar(at, Wp, W, H, dpr) {
    const c = [0, 1, 2].map(q => lerp(Wp[at.i][q], Wp[at.i + 1][q], at.e)), dyPerTau = 2 / (dom.t1 - dom.t0);
    const a = project(c, W, H), b = project([c[0], c[1] + dyPerTau, c[2]], W, H), pxPerTau = Math.hypot(b.X - a.X, b.Y - a.Y) / dpr;
    const raw = 110 / pxPerTau, mag = 10 ** Math.floor(Math.log10(raw)), d = [1, 2, 5, 10].map(m => m * mag).find(v => v * pxPerTau >= 64) ?? 10 * mag;
    scaleBar.querySelector(".sb-ruler").style.width = `${Math.min(170, d * pxPerTau)}px`;
    scaleBar.querySelector(".sb-max").innerHTML = niceNum(d);
    scaleBar.hidden = false;
}

// Trials as counted in the thesis tables: line search alphas, with the zoom steps nested inside the trial that triggered them
const trialCount = i => { const nI = lineSearch[i].filter(t => t[2] === "i").length, nJ = lineSearch[i].filter(t => t[2] === "j").length, base = `${nI} ${nI === 1 ? "trial" : "trials"}`; return nJ ? `${base} (${nJ} zoom steps)` : base; };

// Step sizes print plainly when they are round and to four significant digits otherwise
const fmtAlpha = a => Number.isInteger(a) ? String(a) : String(+a.toPrecision(4));

// Gradient norms read as a decimal when large and as a power of ten when small
const sci = g => { if (g >= 0.01) return g.toFixed(4); const [m, e] = g.toExponential(2).split("e"); return `${m} × 10<sup>${e.replace("-", "−")}</sup>`; };

// Fixed space palette for the 3D view so the glow reads the same in light and dark mode
const space = { grid: [110, 170, 255], ring: [120, 215, 255], label: "#9aa6cc", star: [232, 240, 255], sunCore: "255, 246, 214", sunGlow: "255, 196, 92", comet: "255, 120, 70" };

// Eruption schedule in seconds after the comet touches the star: the detonation at contact, then aftershocks of falling strength
const AFTERSHOCKS = [[1.7, 0.85], [3.4, 0.65], [5.3, 0.5], [7.9, 0.32]];
const kick = (t, at, decay) => t < at ? 0 : Math.exp(-(t - at) * decay);

// Shock front after the impact as a function of screen position: points near the expanding ring are pushed outward from the sun
let shock = null;
function shockPush(X, Y) {
    if (!shock) return [X, Y];
    const dx = X - shock.X, dy = Y - shock.Y, d = Math.hypot(dx, dy) || 1, f = shock.A * Math.exp(-(((d - shock.R) / shock.w) ** 2));
    return [X + dx / d * f, Y + dy / d * f];
}

// Two seeded star layers spread log-uniformly in radius; each repeats every factor of six in zoom and crossfades, so zooming in feels endless
const starField = (() => { let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; return Array.from({ length: 700 }, () => { const ang = rnd() * 6.2832, rad = 1.4 * 6 ** -rnd(); return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, r: 0.4 + rnd() * 1.1, a: 0.3 + rnd() * 0.7, tw: rnd() * 6.28 }; }); })();
let lastZoomLog = 0;
function drawStars(W, H, dpr, now) {
    const g = ctx3d.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, "#111a3a"); g.addColorStop(0.55, "#080d22"); g.addColorStop(1, "#04060f");
    ctx3d.fillStyle = g; ctx3d.fillRect(0, 0, W, H);
    drawNebula(W, H);
    const zl = Math.log(cam.zoom), warp = Math.min(1, Math.abs(zl - lastZoomLog) * 12); lastZoomLog = zl;
    const cy = Math.cos(cam.yaw * 0.35), sy = Math.sin(cam.yaw * 0.35), R = Math.max(W, H) * 0.6;
    for (let layer = 0; layer < 2; layer++) {
        const phase = (zl / Math.log(6) + layer / 2) % 1, grow = 6 ** phase, fade = Math.sin(Math.PI * phase);
        starField.forEach((st, i) => {
            if (i % 2 !== layer) return;
            const x = (st.x * cy - st.y * sy) * grow, y = (st.x * sy + st.y * cy) * grow + (cam.pitch - 0.55) * 0.3;
            const [X, Y] = shockPush(W / 2 + x * R, H / 2 + y * R);
            if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) return;
            const alpha = st.a * fade * (0.75 + 0.25 * Math.sin(now / 900 + st.tw));
            ctx3d.strokeStyle = ctx3d.fillStyle = `rgba(${space.star}, ${alpha})`;
            if (warp > 0.05) { const k = 1 - warp * 0.25; ctx3d.lineWidth = st.r * dpr; ctx3d.beginPath(); ctx3d.moveTo(W / 2 + (X - W / 2) * k, H / 2 + (Y - H / 2) * k); ctx3d.lineTo(X, Y); ctx3d.stroke(); }
            else { ctx3d.beginPath(); ctx3d.arc(X, Y, st.r * dpr, 0, Math.PI * 2); ctx3d.fill(); }
        });
    }
}

// Trials beyond the canvas get one small chevron on the nearest edge, with a short label while paused
function offscreenMarker(p, label, W, H, dpr, alpha) {
    const cx = W / 2, cy = H / 2, dx = p.X - cx, dy = p.Y - cy, m = 22 * dpr, t = Math.min((W / 2 - m) / Math.abs(dx || 1e-9), (H / 2 - m) / Math.abs(dy || 1e-9));
    const X = cx + dx * t, Y = cy + dy * t, ang = Math.atan2(dy, dx);
    ctx3d.save(); ctx3d.translate(X, Y); ctx3d.rotate(ang); ctx3d.fillStyle = `rgba(255, 140, 120, ${0.4 + 0.5 * alpha})`;
    ctx3d.beginPath(); ctx3d.moveTo(7 * dpr, 0); ctx3d.lineTo(-4 * dpr, -5 * dpr); ctx3d.lineTo(-4 * dpr, 5 * dpr); ctx3d.closePath(); ctx3d.fill(); ctx3d.restore();
    if (playing) return;
    ctx3d.fillStyle = `rgba(230, 236, 255, ${0.35 + 0.5 * alpha})`; ctx3d.font = `${10 * dpr}px ${getComputedStyle(document.body).fontFamily}`; ctx3d.textAlign = dx > 0 ? "right" : "left"; ctx3d.textBaseline = "middle";
    ctx3d.fillText(label, X - Math.cos(ang) * 12 * dpr, Y - Math.sin(ang) * 12 * dpr + 12 * dpr);
}
let projectedRocks = [], cometPan = 0, cometScreen = null, sunScreen = null, cometHeat = 0, lastHead = null;

// Nebula clouds are painted once per canvas size into an offscreen layer and drift slightly with the camera for depth
let nebula = null;
function drawNebula(W, H) {
    if (!nebula || nebula.width !== W || nebula.height !== H) {
        nebula = document.createElement("canvas"); nebula.width = W; nebula.height = H;
        const c = nebula.getContext("2d"), R = Math.max(W, H);
        [[0.18, 0.28, 0.42, "120, 80, 200", 0.16], [0.82, 0.22, 0.36, "60, 110, 220", 0.14], [0.68, 0.8, 0.45, "150, 70, 170", 0.1], [0.3, 0.75, 0.3, "70, 140, 220", 0.08], [0.5, 0.45, 0.6, "90, 80, 190", 0.06]].forEach(([x, y, r, rgb, a]) => {
            const g = c.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * R);
            g.addColorStop(0, `rgba(${rgb}, ${a})`); g.addColorStop(0.5, `rgba(${rgb}, ${a * 0.4})`); g.addColorStop(1, `rgba(${rgb}, 0)`);
            c.fillStyle = g; c.fillRect(0, 0, W, H);
        });
    }
    const dx = Math.sin(cam.yaw) * W * 0.03, dy = (cam.pitch - 0.55) * H * 0.04;
    ctx3d.globalCompositeOperation = "lighter"; ctx3d.drawImage(nebula, dx, dy); ctx3d.globalCompositeOperation = "source-over";
}

// Tick spacing of 1, 2, or 5 times a power of ten giving about the requested number of lines, and the decimals it needs
const tickStep = (span, count) => { const raw = span / count, mag = 10 ** Math.floor(Math.log10(raw)), f = raw / mag; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag; };
const tickDecimals = step => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));

// Clip a screen segment to the canvas shrunk by margin m, returning null when it misses
function clipTo(a, b, W, H, m) {
    let t0 = 0, t1 = 1;
    const dx = b.X - a.X, dy = b.Y - a.Y, edges = [[-dx, a.X - m], [dx, W - m - a.X], [-dy, a.Y - m], [dy, H - m - a.Y]];
    for (const [p, q] of edges) { if (p === 0) { if (q < 0) return null; continue; } const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r); if (t0 > t1) return null; }
    return [{ X: a.X + dx * t0, Y: a.Y + dy * t0 }, { X: a.X + dx * t1, Y: a.Y + dy * t1 }];
}

// Height of the coordinate plane: the floor of the well when far away, the height of the camera focus when close
const planeZ = () => lerp(0, cam.tz, smooth(1.5, 4, cam.zoom));

// Map-style coordinate grid on that plane: round k and tau lines that densify with zoom, each labelled where it meets the lower screen edge, dimmed during playback
function drawCoordGrid(W, H, dpr, body, flood = 0) {
    const z = planeZ(), span = 3.6 / cam.zoom, kc = dom.k0 + (cam.tx + 1) / 2 * (dom.k1 - dom.k0), tc = dom.t0 + (cam.ty + 1) / 2 * (dom.t1 - dom.t0);
    const kSpan = span * (dom.k1 - dom.k0) / 2, tSpan = span * (dom.t1 - dom.t0) / 2, sk = tickStep(kSpan, 6), st = tickStep(tSpan, 6), far = cam.zoom < 4;
    const kLo = far ? dom.k0 : kc - kSpan, kHi = far ? dom.k1 : kc + kSpan, tLo = far ? dom.t0 : tc - tSpan, tHi = far ? dom.t1 : tc + tSpan;
    const Pz = (k, tau) => { const x = (k - dom.k0) / (dom.k1 - dom.k0) * 2 - 1, y = (tau - dom.t0) / (dom.t1 - dom.t0) * 2 - 1; return project([x, y, z], W, H); };
    const lines = [];
    for (let k = Math.ceil(kLo / sk - 1e-9) * sk; k <= kHi + 1e-12; k += sk) lines.push({ a: Pz(k, tLo), b: Pz(k, tHi), label: `k = ${k.toFixed(tickDecimals(sk))}` });
    for (let t = Math.ceil(tLo / st - 1e-9) * st; t <= tHi + 1e-9; t += st) lines.push({ a: Pz(kLo, t), b: Pz(kHi, t), label: `τ = ${t.toFixed(tickDecimals(st))}` });
    const dim = (playing ? 0.55 : 1) * (1 + 3 * flood);
    ctx3d.strokeStyle = `rgba(200, 215, 255, ${0.16 * dim})`; ctx3d.lineWidth = dpr; ctx3d.beginPath();
    const labels = [];
    lines.forEach(({ a, b, label }) => {
        const seg = clipTo(a, b, W, H, 0); if (!seg) return;
        if (shock) { for (let q = 0; q <= 40; q++) { const [X, Y] = shockPush(lerp(seg[0].X, seg[1].X, q / 40), lerp(seg[0].Y, seg[1].Y, q / 40)); q ? ctx3d.lineTo(X, Y) : ctx3d.moveTo(X, Y); } }
        else { ctx3d.moveTo(seg[0].X, seg[0].Y); ctx3d.lineTo(seg[1].X, seg[1].Y); }
        const end = seg[0].Y > seg[1].Y ? seg[0] : seg[1], other = end === seg[0] ? seg[1] : seg[0]; labels.push({ end, other, label });
    });
    ctx3d.stroke();

    // Labels sit just inside the line's lower end, nudged along the line so they stay on screen, and skip any that would overlap another label, the readout, or the scale bar
    ctx3d.font = `${10.5 * dpr}px ${body}`; ctx3d.fillStyle = `rgba(205, 215, 245, ${playing ? 0.3 : 0.75})`; ctx3d.textAlign = "center"; ctx3d.textBaseline = "middle";
    const cr = canvas3d.getBoundingClientRect(), rs = canvas3d.width / cr.width, placed = [hud, scaleBar].filter(el => !el.hidden).map(el => { const r = el.getBoundingClientRect(); return { X: (r.left + r.width / 2 - cr.left) * rs, Y: (r.top + r.height / 2 - cr.top) * rs, w: r.width * rs, h: r.height * rs }; });
    const iw = (W / dpr < 520 ? 170 : 230) * dpr, ih = (W / dpr < 520 ? 104 : 132) * dpr; placed.push({ X: 12 * dpr + iw / 2, Y: 12 * dpr + ih / 2, w: iw + 8 * dpr, h: ih + 8 * dpr });
    labels.forEach(({ end, other, label }) => {
        const len = Math.hypot(other.X - end.X, other.Y - end.Y) || 1, ux = (other.X - end.X) / len, uy = (other.Y - end.Y) / len, w = ctx3d.measureText(label).width;
        const X = Math.min(W - w / 2 - 6 * dpr, Math.max(w / 2 + 6 * dpr, end.X + ux * 16 * dpr)), Y = Math.min(H - 10 * dpr, Math.max(10 * dpr, end.Y + uy * 16 * dpr));
        if (placed.some(p => Math.abs(p.X - X) < (p.w + w) / 2 + 4 * dpr && Math.abs(p.Y - Y) < ((p.h || 0) + 12 * dpr) / 2 + 4 * dpr)) return;
        placed.push({ X, Y, w, h: 12 * dpr }); ctx3d.fillText(label, X, Y);
    });
}

// Screen point back to (k, tau) on the coordinate plane by inverting the orthographic camera
function screenToParams(X, Y, W, H) {
    const z = planeZ(), cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), scale = Math.min(W / (H / W > 0.7 ? 3.1 : 3.6), H / 2.75) * cam.zoom;
    const xr = (X - W / 2) / scale, yr = ((H * 0.46 - Y) / scale - (z - cam.tz) * 1.1 * cp) / sp;
    const x = xr * cy + yr * sy + cam.tx, y = -xr * sy + yr * cy + cam.ty;
    return { k: dom.k0 + (x + 1) / 2 * (dom.k1 - dom.k0), tau: dom.t0 + (y + 1) / 2 * (dom.t1 - dom.t0) };
}

// Procedural rocky bodies: a lumpy outline, bumpy shading lit from the upper left, and craters, rendered once per kind into small sprites
const rockSprites = new Map();
function rockSprite(kind, red, seed) {
    const key = `${kind}${red}${seed}`;
    if (rockSprites.has(key)) return rockSprites.get(key);
    const S = 96, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d"), img = g.createImageData(S, S), R = S * 0.36;
    let st = seed * 9301 + 49297; const rnd = () => (st = (st * 9301 + 49297) % 233280) / 233280;
    const lumps = Array.from({ length: 7 }, (_, k) => [(kind === "i" ? 0.05 : 0.14) / (k + 1) ** 0.6 * (rnd() * 0.8 + 0.4), rnd() * 6.283]);
    const stretch = kind === "i" ? 1 : 1.25 + rnd() * 0.3, rot = rnd() * 6.283;
    const craters = Array.from({ length: kind === "i" ? 7 : 5 }, () => { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 0.75; return [Math.cos(a) * d * R, Math.sin(a) * d * R, (0.08 + rnd() * 0.18) * R]; });
    const hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7 + seed * 17.3) * 43758.5453; return h - Math.floor(h); };
    const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); };
    const fbm = (x, y) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;
    const base = red ? [150, 84, 74] : [92, 116, 168], light = [-0.5, -0.62, 0.6];
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
        const dx0 = px - S / 2, dy0 = py - S / 2, cr = Math.cos(rot), sr = Math.sin(rot), dx = (dx0 * cr + dy0 * sr) / stretch, dy = -dx0 * sr + dy0 * cr;
        const ang = Math.atan2(dy, dx), rr = R * (1 + lumps.reduce((acc, [a, ph], k) => acc + a * Math.sin((k + 2) * ang + ph), 0)), d = Math.hypot(dx, dy) / rr;
        if (d > 1) continue;
        const h = fbm(px / 9, py / 9), nz = Math.sqrt(Math.max(0.02, 1 - d * d)), eps = 1.5;
        let nx = dx / rr * 0.9 + (fbm((px + eps) / 9, py / 9) - h) * 3, ny = dy / rr * 0.9 + (fbm(px / 9, (py + eps) / 9) - h) * 3, nl = Math.hypot(nx, ny, nz);
        let shade = Math.max(0, (nx * light[0] + ny * light[1] + nz * light[2]) / nl);
        craters.forEach(([cx, cy, cr2]) => { const q = Math.hypot(dx0 - cx, dy0 - cy) / cr2; if (q < 1) shade *= 0.55 + 0.45 * q * q; else if (q < 1.25) shade *= 1.15; });
        const tone = (0.18 + 0.95 * shade) * (0.78 + 0.44 * h), edge = smooth(0.92, 1, d), i = (py * S + px) * 4;
        img.data[i] = Math.min(255, base[0] * tone); img.data[i + 1] = Math.min(255, base[1] * tone); img.data[i + 2] = Math.min(255, base[2] * tone); img.data[i + 3] = 255 * (1 - edge * 0.85);
    }
    g.putImageData(img, 0, 0);
    rockSprites.set(key, c);
    return c;
}

// Draw a rock sprite at a screen point with a slow spin
function drawRock(kind, red, seed, X, Y, size, alpha, now) {
    const spr = rockSprite(kind, red, seed);
    ctx3d.save(); ctx3d.globalAlpha = alpha; ctx3d.translate(X, Y); ctx3d.rotate(now / (kind === "i" ? 9000 : 5000) + seed);
    ctx3d.drawImage(spr, -size / 2, -size / 2, size, size); ctx3d.restore();
}

// Blue-white supergiant at the optimum: a dazzling white core, a wide blue halo, a gently limb-darkened disc, and soft churning cells across its face
function drawSupergiant(X, Y, R, bright, now) {
    glow(X, Y, R * 5, "120, 165, 255", 0.16 + 0.2 * bright);
    glow(X, Y, R * 2.4, "175, 205, 255", 0.3 + 0.3 * bright);
    const disc = ctx3d.createRadialGradient(X - R * 0.12, Y - R * 0.12, R * 0.05, X, Y, R);
    disc.addColorStop(0, "rgba(255, 255, 255, 1)"); disc.addColorStop(0.5, "rgba(225, 236, 255, 0.98)"); disc.addColorStop(0.88, "rgba(150, 185, 255, 0.95)"); disc.addColorStop(1, "rgba(110, 150, 255, 0)");
    ctx3d.save(); ctx3d.globalCompositeOperation = "source-over"; ctx3d.fillStyle = disc; ctx3d.beginPath(); ctx3d.arc(X, Y, R, 0, 6.2832); ctx3d.fill();
    ctx3d.clip();
    for (let n = 0; n < 18; n++) { const ang = n * 2.399 + now / (8000 + n * 350), d = R * Math.sqrt((n + 0.5) / 18) * 0.9, cx = X + Math.cos(ang) * d, cy = Y + Math.sin(ang) * d, cr = R * (0.14 + 0.1 * Math.abs(Math.sin(n * 3.7 + now / 2400))), g = ctx3d.createRadialGradient(cx, cy, 0, cx, cy, cr); g.addColorStop(0, n % 3 ? "rgba(255, 255, 255, 0.35)" : "rgba(120, 155, 235, 0.25)"); g.addColorStop(1, "rgba(255, 255, 255, 0)"); ctx3d.fillStyle = g; ctx3d.beginPath(); ctx3d.arc(cx, cy, cr, 0, 6.2832); ctx3d.fill(); }
    const limb = ctx3d.createRadialGradient(X, Y, R * 0.65, X, Y, R); limb.addColorStop(0, "rgba(60, 90, 200, 0)"); limb.addColorStop(1, "rgba(60, 90, 200, 0.35)");
    ctx3d.fillStyle = limb; ctx3d.fillRect(X - R, Y - R, R * 2, R * 2); ctx3d.restore();
    ctx3d.globalCompositeOperation = "lighter"; glow(X, Y, R * 0.7, "255, 255, 255", 0.5 + 0.3 * bright);
}

// Neutron star left by the supernova: a tiny blue-white point that pulses, with two faint sweeping beams
function drawNeutronStar(X, Y, scale, appear, now) {
    if (appear <= 0) return;
    const beat = 0.7 + 0.3 * Math.sin(now / 130), ang = now / 900;
    ctx3d.strokeStyle = `rgba(170, 210, 255, ${0.18 * appear})`; ctx3d.lineWidth = 2 * scale;
    [0, Math.PI].forEach(o => { const g = ctx3d.createLinearGradient(X, Y, X + Math.cos(ang + o) * 160 * scale, Y + Math.sin(ang + o) * 160 * scale); g.addColorStop(0, `rgba(180, 215, 255, ${0.35 * appear})`); g.addColorStop(1, "rgba(180, 215, 255, 0)"); ctx3d.strokeStyle = g; ctx3d.beginPath(); ctx3d.moveTo(X, Y); ctx3d.lineTo(X + Math.cos(ang + o) * 160 * scale, Y + Math.sin(ang + o) * 160 * scale); ctx3d.stroke(); });
    glow(X, Y, 34 * scale * beat, "150, 200, 255", 0.45 * appear);
    glow(X, Y, 10 * scale, "235, 245, 255", appear);
    ctx3d.fillStyle = `rgba(255, 255, 255, ${appear})`; ctx3d.beginPath(); ctx3d.arc(X, Y, 2.2 * scale, 0, 6.2832); ctx3d.fill();
}

// Soft radial glow used by the sun, the comet head, and the iterate stars
function glow(X, Y, r, rgb, a) {
    const g = ctx3d.createRadialGradient(X, Y, 0, X, Y, r);
    g.addColorStop(0, `rgba(${rgb}, ${a})`); g.addColorStop(0.35, `rgba(${rgb}, ${a * 0.35})`); g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx3d.fillStyle = g; ctx3d.beginPath(); ctx3d.arc(X, Y, r, 0, Math.PI * 2); ctx3d.fill();
}

// BFGS state between iterate i and i + 1 at flight position e: position, gradient, and Hessian approximation, blended linearly
function bfgsStateAt(i, e) {
    const j = Math.min(lastIter, i + 1), A = bfgsPath[i], C = bfgsPath[j], Bi = bfgsB[i], Bj = bfgsB[j];
    return { k: lerp(A[1], C[1], e), tau: lerp(A[2], C[2], e), f: lerp(A[3], C[3], e), g: [lerp(bfgsGrad[i][0], bfgsGrad[j][0], e), lerp(bfgsGrad[i][1], bfgsGrad[j][1], e)], B: [lerp(Bi[0], Bj[0], e), lerp(Bi[1], Bj[1], e), lerp(Bi[2], Bj[2], e)] };
}

// The quadratic model BFGS believes in at a state: centre x - B^-1 g, and the ellipse d^T B d = g^T B^-1 g that passes through x
function modelEllipse({ k, tau, g, B }) {
    const [a, b, c] = B, det = a * c - b * b;
    if (!(det > 0)) return null;
    const p = [-(c * g[0] - b * g[1]) / det, -(-b * g[0] + a * g[1]) / det], L = -(g[0] * p[0] + g[1] * p[1]);
    if (!(L > 0)) return null;
    const tr = (a + c) / 2, d = Math.sqrt(Math.max(0, tr * tr - det)), l1 = tr + d, l2 = tr - d;
    const v1 = Math.abs(b) > 1e-15 ? (() => { const x = l1 - c, y = b, n = Math.hypot(x, y); return [x / n, y / n]; })() : (a >= c ? [1, 0] : [0, 1]);
    const v2 = [-v1[1], v1[0]];
    return { centre: [k + p[0], tau + p[1]], axes: [[v1, Math.sqrt(L / l1)], [v2, Math.sqrt(L / Math.max(l2, 1e-300))]], p };
}

// MAE between Kaplan–Meier and a Weibull curve over the 139 event times, the same measure as the thesis
const maeFor = (k, tau) => thesisKM.reduce((acc, [t, sv]) => acc + Math.abs(sv - Math.exp(-((t / tau) ** k))), 0) / thesisKM.length;
const maeStart = maeFor(bfgsPath[0][1], bfgsPath[0][2]), maeEnd = maeFor(bfgsPath[lastIter][1], bfgsPath[lastIter][2]);

// Small inset chart drawn on the canvas: Kaplan–Meier steps and the Weibull curve for the parameters the comet carries right now, in the dark theme chart colors since the canvas is always dark; on narrow charts the MAE sits on its own line under the title
function drawFitInset(k, tau, W, H, dpr, body) {
    const narrow = W / dpr < 520, w = (narrow ? 170 : 230) * dpr, h = (narrow ? 118 : 132) * dpr, x0 = 12 * dpr, y0 = 12 * dpr, pl = 10 * dpr, pt = (narrow ? 38 : 24) * dpr, pb = 10 * dpr, iw = w - 2 * pl, ih = h - pt - pb, tMax = 900;
    ctx3d.fillStyle = "rgba(8, 12, 30, 0.62)"; ctx3d.strokeStyle = "rgba(140, 170, 255, 0.18)"; ctx3d.lineWidth = dpr;
    ctx3d.beginPath(); ctx3d.roundRect(x0, y0, w, h, 10 * dpr); ctx3d.fill(); ctx3d.stroke();
    const X = t => x0 + pl + t / tMax * iw, Y = v => y0 + pt + (1 - v) * ih;
    ctx3d.strokeStyle = "rgba(140, 170, 255, 0.15)"; ctx3d.beginPath(); [0, 0.5, 1].forEach(v => { ctx3d.moveTo(X(0), Y(v)); ctx3d.lineTo(X(tMax), Y(v)); }); ctx3d.stroke();
    ctx3d.strokeStyle = "#8aa8ff"; ctx3d.lineWidth = 1.6 * dpr;
    ctx3d.save(); ctx3d.lineJoin = "miter"; ctx3d.lineCap = "butt"; ctx3d.beginPath(); let prev = 1; ctx3d.moveTo(X(0), Y(1)); thesisKM.forEach(([t, v]) => { ctx3d.lineTo(X(t), Y(prev)); ctx3d.lineTo(X(t), Y(v)); prev = v; }); ctx3d.stroke(); ctx3d.restore();
    ctx3d.strokeStyle = "#ff7b6b"; ctx3d.lineWidth = 1.6 * dpr; ctx3d.beginPath();
    for (let q = 0; q <= 60; q++) { const t = q / 60 * tMax, v = Math.exp(-((t / tau) ** k)); q ? ctx3d.lineTo(X(t), Y(v)) : ctx3d.moveTo(X(t), Y(v)); }
    ctx3d.stroke();
    ctx3d.font = `${10.5 * dpr}px ${body}`; ctx3d.textBaseline = "middle"; ctx3d.textAlign = "left"; ctx3d.fillStyle = "#9aa6cc"; ctx3d.fillText("Fit at This Step", x0 + pl, y0 + 12 * dpr);
    ctx3d.textAlign = narrow ? "left" : "right"; ctx3d.fillStyle = "#eef2ff"; ctx3d.fillText(`MAE = ${maeFor(k, tau).toFixed(6)}`, narrow ? x0 + pl : x0 + w - pl, y0 + (narrow ? 26 : 12) * dpr);
}

// Draw space, the glowing likelihood grid, contour rings, the sun at the optimum, past iterates as stars, and the comet in flight
function render3d(now = performance.now()) {
    if (!grid) buildGrid();
    const dpr = (devicePixelRatio || 1) * fsScale, W = canvas3d.clientWidth * dpr, H = canvas3d.clientHeight * dpr;
    if (canvas3d.width !== W || canvas3d.height !== H) { canvas3d.width = W; canvas3d.height = H; }
    const P = (k, tau, f) => project(toWorld(k, tau, f), W, H), body = getComputedStyle(document.body).fontFamily;
    const tImp = snSeconds(now), sunEarly = P(bfgsPath[lastIter][1], bfgsPath[lastIter][2], bfgsPath[lastIter][3]), unit = Math.min(W, H) / 440;
    const tb = tImp, lastShock = [[0, 1], ...AFTERSHOCKS].filter(([at]) => tb >= at).pop(), ts = lastShock ? tb - lastShock[0] : -1;
    shock = lastShock && ts < 5 ? { X: sunEarly.X, Y: sunEarly.Y, R: (30 + 1100 * (1 - Math.exp(-ts * 0.8))) * unit, w: (30 + 40 * ts) * unit, A: 36 * unit * lastShock[1] * Math.exp(-ts * 0.7) } : null;
    const flood = tb > 0 && tb < 30 ? Math.exp(-tb * 0.18) * Math.min(1, tb * 8) * 0.8 + AFTERSHOCKS.reduce((acc, [at, sg]) => acc + 0.35 * sg * kick(tb, at, 1.5), 0) : 0;
    drawStars(W, H, dpr, now);
    const sinceImpact = tImp, shake = sinceImpact < 16 ? dpr * (20 * kick(sinceImpact, 0, 2.6) + AFTERSHOCKS.reduce((acc, [at, sg]) => acc + 12 * sg * kick(sinceImpact, at, 3.2), 0) + 3.5 * kick(sinceImpact, 0, 0.3) * (0.6 + 0.4 * Math.sin(now / 170))) : 0;
    ctx3d.save(); if (shake) ctx3d.translate((Math.sin(now / 23) + 0.5 * Math.sin(now / 9.7)) * shake, (Math.cos(now / 31) + 0.5 * Math.cos(now / 13.1)) * shake);
    ctx3d.globalCompositeOperation = "lighter";

    // Likelihood surface as glowing grid lines, brighter toward the bottom of the well and dimmer with distance, fading out up close
    const gridAlpha = 1 - smooth(4, 14, cam.zoom), n = dom.n;
    if (gridAlpha > 0) {
        const buckets = Array.from({ length: 8 }, () => []);
        const node = (i, j) => project(toWorld(dom.k0 + (dom.k1 - dom.k0) * i / n, dom.t0 + (dom.t1 - dom.t0) * j / n, grid.z[i][j]), W, H);
        const nodes = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => node(i, j)));
        const push = (a, b, f) => { const h = (f - grid.fmin) / (grid.fmax - grid.fmin), depth = (a.depth + b.depth) / 2, v = (1 - Math.sqrt(h) * 0.65) * (1 - Math.min(1, Math.max(0, (depth + 1.4) / 2.8)) * 0.55); buckets[Math.min(7, Math.floor(v * 8))].push(a, b); };
        for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) push(nodes[i][j], nodes[i][j + 1], (grid.z[i][j] + grid.z[i][j + 1]) / 2);
        for (let j = 0; j <= n; j++) for (let i = 0; i < n; i++) push(nodes[i][j], nodes[i + 1][j], (grid.z[i][j] + grid.z[i + 1][j]) / 2);
        ctx3d.lineWidth = 0.8 * dpr;
        buckets.forEach((segs, q) => { if (!segs.length) return; ctx3d.strokeStyle = `rgba(${space.grid}, ${(0.05 + q * 0.05) * gridAlpha})`; ctx3d.beginPath(); for (let m = 0; m < segs.length; m += 2) { ctx3d.moveTo(segs[m].X, segs[m].Y); ctx3d.lineTo(segs[m + 1].X, segs[m + 1].Y); } ctx3d.stroke(); });
    }

    // Contour rings near the minimum glow in as the camera closes in and fade before double precision runs out
    const contourAlpha = smooth(3, 9, cam.zoom) * (1 - smooth(900, 1500, cam.zoom));
    if (contourAlpha > 0) {
        if (!contours) buildContours();
        ctx3d.lineWidth = 1.1 * dpr;
        contours.forEach(({ level, segs }, q) => {
            ctx3d.strokeStyle = `rgba(${space.ring}, ${(0.18 + 0.25 * (1 - q / contours.length)) * contourAlpha})`;
            ctx3d.beginPath();
            segs.forEach(([a, b]) => { const p1 = P(a[0], a[1], level), p2 = P(b[0], b[1], level); ctx3d.moveTo(p1.X, p1.Y); ctx3d.lineTo(p2.X, p2.Y); });
            ctx3d.stroke();
        });
    }
    ctx3d.globalCompositeOperation = "source-over";

    // Coordinate grid with labels on its own lines, and the vertical objective axis while the whole well is in view
    drawCoordGrid(W, H, dpr, body, flood);
    if (cam.zoom < 2.5 && W / dpr >= 520) {
        ctx3d.globalAlpha = 1 - smooth(1.5, 2.5, cam.zoom);
        const base = P(dom.k0, dom.t1, grid.fmin), top = P(dom.k0, dom.t1, grid.fmax);
        ctx3d.strokeStyle = space.label; ctx3d.lineWidth = dpr; ctx3d.beginPath(); ctx3d.moveTo(base.X, base.Y); ctx3d.lineTo(top.X, top.Y); ctx3d.stroke();
        ctx3d.fillStyle = space.label; ctx3d.font = `500 ${13 * dpr}px ${body}`; ctx3d.textAlign = "center"; ctx3d.textBaseline = "middle"; ctx3d.fillText("−ℓ", top.X, top.Y - 12 * dpr);
        ctx3d.globalAlpha = 1;
    }

    // Lines are clipped to a margin around the canvas so far-off points at extreme zoom never reach it as huge coordinates
    const liftW = 0.01 / cam.zoom, at = pathAt(progress), Wp = iterWorld(), PW3 = v => project([v[0], v[1], v[2] + liftW], W, H);
    const pad3 = 200 * dpr, inside = q => q.X > -pad3 && q.X < W + pad3 && q.Y > -pad3 && q.Y < H + pad3;
    const clipLine = (a, b) => {
        let t0 = 0, t1 = 1;
        const dx = b.X - a.X, dy = b.Y - a.Y, edges = [[-dx, a.X + pad3], [dx, W + pad3 - a.X], [-dy, a.Y + pad3], [dy, H + pad3 - a.Y]];
        for (const [p, q] of edges) { if (p === 0) { if (q < 0) return null; continue; } const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r); if (t0 > t1) return null; }
        return [{ X: a.X + dx * t0, Y: a.Y + dy * t0 }, { X: a.X + dx * t1, Y: a.Y + dy * t1 }];
    };
    const stroke = pts => { ctx3d.beginPath(); for (let i = 1; i < pts.length; i++) { const seg = clipLine(pts[i - 1], pts[i]); if (seg) { ctx3d.moveTo(seg[0].X, seg[0].Y); ctx3d.lineTo(seg[1].X, seg[1].Y); } } ctx3d.stroke(); };
    const arcPts = (i, e0, e1, m = 40) => Array.from({ length: m + 1 }, (_, q) => PW3(arcPoint(Wp, i, e0 + (e1 - e0) * q / m)));
    ctx3d.lineJoin = "round"; ctx3d.lineCap = "round";

    // Star at the optimum: a blue-white supergiant that grows brighter as BFGS closes in; after the supernova only a neutron star in a faint remnant is left
    const sun = PW3(Wp[lastIter]), near = smooth(0, lastIter, at.s), exploded = sinceImpact !== Infinity;
    sunScreen = { X: sun.X / W, Y: sun.Y / H };
    if (inside(sun) && !(sinceImpact < 32)) {
        ctx3d.globalCompositeOperation = "lighter";
        if (exploded) { [["255, 130, 70", 0.4], ["210, 80, 150", -0.9], ["140, 100, 240", 2]].forEach(([col, off]) => glow(sun.X + Math.cos(off) * 120 * unit, sun.Y + Math.sin(off) * 90 * unit, 260 * unit, col, 0.07)); drawNeutronStar(sun.X, sun.Y, unit, 1, now); }
        else drawSupergiant(sun.X, sun.Y, (16 + 22 * near) * unit * (1 + 0.02 * Math.sin(now / 1400)), near, now);
        ctx3d.globalCompositeOperation = "source-over";
    }

    // BFGS lens: the ellipse of the quadratic model B_r around the comet, with its centre where the model expects the minimum
    const st = bfgsStateAt(at.i, progress < 1 ? at.e : 1), lens = progress < 1 ? modelEllipse(st) : null;
    if (lens) {
        const zW = (st.f - grid.fmin) / (grid.fmax - grid.fmin) + liftW, ring = sc => Array.from({ length: 97 }, (_, q) => { const th = q / 96 * 6.2832, c = Math.cos(th) * sc, sn = Math.sin(th) * sc, [[v1, r1], [v2, r2]] = lens.axes; const k = lens.centre[0] + v1[0] * r1 * c + v2[0] * r2 * sn, tau = lens.centre[1] + v1[1] * r1 * c + v2[1] * r2 * sn; const w = toWorld(k, tau, grid.fmin); return project([w[0], w[1], zW], W, H); });
        ctx3d.strokeStyle = "rgba(196, 160, 255, 0.6)"; ctx3d.lineWidth = 1.3 * dpr; stroke(ring(1));
        ctx3d.setLineDash([3 * dpr, 4 * dpr]); ctx3d.strokeStyle = "rgba(196, 160, 255, 0.35)"; stroke(ring(0.5)); ctx3d.setLineDash([]);
        const cw = toWorld(lens.centre[0], lens.centre[1], grid.fmin), cp = project([cw[0], cw[1], zW], W, H);
        if (inside(cp)) { ctx3d.strokeStyle = "rgba(210, 180, 255, 0.8)"; ctx3d.lineWidth = 1.2 * dpr; ctx3d.beginPath(); ctx3d.moveTo(cp.X - 5 * dpr, cp.Y); ctx3d.lineTo(cp.X + 5 * dpr, cp.Y); ctx3d.moveTo(cp.X, cp.Y - 5 * dpr); ctx3d.lineTo(cp.X, cp.Y + 5 * dpr); ctx3d.stroke(); }
    }

    // Past flights stay as faint orbits, and the ground track of the current flight is a dotted line beneath it
    ctx3d.strokeStyle = "rgba(255, 170, 120, 0.35)"; ctx3d.lineWidth = 1.4 * dpr;
    for (let j = 0; j < at.i; j++) stroke(arcPts(j, 0, 1));
    if (progress < 1) {
        const g0 = PW3(Wp[at.i]), g1 = PW3([0, 1, 2].map(q => lerp(Wp[at.i][q], Wp[at.i + 1][q], at.e)));
        ctx3d.setLineDash([2 * dpr, 6 * dpr]); ctx3d.strokeStyle = "rgba(160, 200, 255, 0.45)"; ctx3d.lineWidth = 1.2 * dpr; stroke([g0, g1]); ctx3d.setLineDash([]);
        ctx3d.strokeStyle = "rgba(255, 170, 120, 0.35)"; ctx3d.lineWidth = 1.4 * dpr; stroke(arcPts(at.i, 0, at.e));
    }

    // Line search trials as rocky bodies: larger cratered planetoids for the line search phase i and small rough asteroids for the zoom procedure j, red glow when sufficient decrease fails and blue when it holds, with a dashed probe ray during the search
    projectedRocks = [];
    for (let j = 0; j <= at.i && j < lastIter; j++) {
        const trials = trialsFor(j).filter(q => q.kind !== "accept");
        if (!trials.length) continue;
        const current = j === at.i && progress < 1, shown = current ? Math.floor(at.search * lineSearch[j].length + 1e-9) : trials.length;
        if (current && at.search < 1) {
            const far = trials.reduce((x, q) => q.a > x.a ? q : x, trials[0]);
            ctx3d.setLineDash([3 * dpr, 6 * dpr]); ctx3d.strokeStyle = "rgba(220, 230, 255, 0.35)"; ctx3d.lineWidth = dpr; stroke([PW3(Wp[j]), PW3(far.w)]); ctx3d.setLineDash([]);
        }
        const away = [];
        trials.slice(0, shown).forEach(q => {
            const p = PW3(q.w), fresh = current && at.search < 1 ? 1 : 0.55, red = q.kind === "reject";
            if (!inside(p)) { if (current && at.search < 1) away.push({ p, q }); return; }
            ctx3d.globalCompositeOperation = "lighter"; glow(p.X, p.Y, (q.phase === "i" ? 18 : 11) * dpr, red ? "255, 110, 90" : "120, 170, 255", 0.4 * fresh); ctx3d.globalCompositeOperation = "source-over";
            drawRock(q.phase, red, j * 10 + q.m + 1, p.X, p.Y, (q.phase === "i" ? 26 : 15) * dpr, Math.min(1, fresh + 0.35), now);
            projectedRocks.push({ ...p, q, step: j });
        });

        // Trials beyond the view during the live search share one edge marker pointing to the farthest
        if (away.length) {
            const far = away.reduce((x, o) => o.q.a > x.q.a ? o : x, away[0]);
            offscreenMarker(far.p, `${away.length} ${away.length === 1 ? "trial" : "trials"} further out to k = ${far.q.k.toFixed(1)}`, W, H, dpr, 1);
        }
    }

    // Landed iterates shine as small stars
    const done = Wp.slice(0, at.reached + 1).map((v, r) => ({ r, ...PW3(v) }));
    projectedPath = done;
    ctx3d.globalCompositeOperation = "lighter";
    done.filter(inside).forEach(q => { glow(q.X, q.Y, 9 * dpr, "200, 220, 255", 0.55); ctx3d.fillStyle = "rgba(240, 246, 255, 0.95)"; ctx3d.beginPath(); ctx3d.arc(q.X, q.Y, 2.2 * dpr, 0, Math.PI * 2); ctx3d.fill(); });

    // Comet: nucleus and coma, a curved dust tail along the path, and a straight blue ion tail pointing away from the sun; both tails grow as it heats up near the optimum
    if (progress < 1) {
        const lastLeg = at.i === lastIter - 1, heat = Math.max(smooth(0, lastIter, at.s) ** 1.6, cometScreen && sunScreen ? 1 - Math.min(1, Math.hypot(cometScreen.X - sunScreen.X, cometScreen.Y - sunScreen.Y) / 0.35) : 0);
        const tailSpan = 0.22 + 0.22 * heat, tail = arcPts(at.i, Math.max(0, at.e - tailSpan), at.e, 28), head = tail.at(-1);
        cometPan = Math.max(-1, Math.min(1, head.X / W * 2 - 1)); cometScreen = { X: head.X / W, Y: head.Y / H };
        const breakup = lastLeg ? smooth(0.55, 0.97, at.e) : 0;

        // Dust tail: broad, warm white, curving along the flight, with drifting grains
        for (let q = 1; q < tail.length; q++) {
            const t = q / (tail.length - 1), seg = clipLine(tail[q - 1], tail[q]);
            if (!seg) continue;
            ctx3d.strokeStyle = `rgba(255, 226, 178, ${(0.05 + 0.45 * t * t) * (1 - 0.6 * breakup)})`; ctx3d.lineWidth = (1.5 + (6 + 9 * heat) * t * t) * dpr;
            ctx3d.beginPath(); ctx3d.moveTo(seg[0].X, seg[0].Y); ctx3d.lineTo(seg[1].X, seg[1].Y); ctx3d.stroke();
        }
        tail.forEach((q, n) => { if (n % 2 || !inside(q)) return; const t = n / tail.length, jit = Math.sin(n * 91.7 + now / 260) * (3 + 8 * heat) * (1 - t) * dpr; ctx3d.fillStyle = `rgba(255, 236, 205, ${0.35 * t})`; ctx3d.beginPath(); ctx3d.arc(q.X + jit, q.Y - jit * 0.6, (0.6 + t) * dpr, 0, 6.2832); ctx3d.fill(); });

        // Ion tail: thin and straight, pushed directly away from the sun by the solar wind
        const sdx = head.X - sun.X, sdy = head.Y - sun.Y, sd = Math.hypot(sdx, sdy), back = tail[Math.max(0, tail.length - 6)];
        const ux = sd > 4 * dpr ? sdx / sd : (head.X - back.X) / (Math.hypot(head.X - back.X, head.Y - back.Y) || 1), uy = sd > 4 * dpr ? sdy / sd : (head.Y - back.Y) / (Math.hypot(head.X - back.X, head.Y - back.Y) || 1);
        const ionLen = (40 + 150 * heat) * dpr * (1 - 0.7 * breakup), ig = ctx3d.createLinearGradient(head.X, head.Y, head.X + ux * ionLen, head.Y + uy * ionLen);
        ig.addColorStop(0, `rgba(130, 190, 255, ${0.55 + 0.3 * heat})`); ig.addColorStop(1, "rgba(130, 190, 255, 0)");
        ctx3d.strokeStyle = ig; ctx3d.lineWidth = (1.6 + 1.6 * heat) * dpr; ctx3d.beginPath(); ctx3d.moveTo(head.X, head.Y); ctx3d.lineTo(head.X + ux * ionLen, head.Y + uy * ionLen); ctx3d.stroke();

        // Coma and nucleus, with sparks shedding as it overheats, then breaking into fragments on the final leg
        glow(head.X, head.Y, (14 + 18 * heat) * dpr, "190, 225, 255", 0.35 + 0.25 * heat);
        glow(head.X, head.Y, (7 + 6 * heat) * dpr, "255, 236, 200", 0.9);
        if (heat > 0.5) for (let n = 0; n < 6; n++) { const ph = (now / 420 + n / 6) % 1, ang = n * 2.4 + now / 900, r = ph * (10 + 20 * heat) * dpr; ctx3d.fillStyle = `rgba(255, 210, 160, ${(1 - ph) * (heat - 0.5) * 1.6})`; ctx3d.beginPath(); ctx3d.arc(head.X + Math.cos(ang) * r, head.Y + Math.sin(ang) * r, 1.1 * dpr, 0, 6.2832); ctx3d.fill(); }
        if (breakup > 0) {
            for (let n = 0; n < 7; n++) { const spread = breakup * (6 + n * 3.5) * dpr, ang = n * 0.9 + 1.2, fx = head.X - ux * spread * 0.6 + Math.cos(ang) * spread * 0.35, fy = head.Y - uy * spread * 0.6 + Math.sin(ang) * spread * 0.35; glow(fx, fy, 6 * dpr, "255, 220, 180", 0.6 * breakup); ctx3d.fillStyle = `rgba(255, 245, 230, ${breakup})`; ctx3d.beginPath(); ctx3d.arc(fx, fy, (1.6 - n * 0.12) * dpr, 0, 6.2832); ctx3d.fill(); }
        }
        if (breakup < 0.9) { ctx3d.fillStyle = "#fff"; ctx3d.beginPath(); ctx3d.arc(head.X, head.Y, 2.2 * dpr * (1 - breakup), 0, 6.2832); ctx3d.fill(); }
        cometHeat = heat; lastHead = { X: head.X / W, Y: head.Y / H };
    } else cometHeat = 0;

    // Supernova at convergence: detonation at contact, a billowing fireball, aftershocks, ejecta that break into shards and settle as dust, a lingering remnant nebula, and the neutron star left at the optimum
    if (sinceImpact < 32) {
        const t = sinceImpact, tb = t, inDir = lastHead ? Math.atan2(sun.Y - lastHead.Y * H, sun.X - lastHead.X * W) : 0.6, scale = unit;
        let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

        // Light flooding the scene from the blast and from every aftershock
        const fl = ctx3d.createRadialGradient(sun.X, sun.Y, 0, sun.X, sun.Y, Math.max(W, H) * 1.1);
        fl.addColorStop(0, `rgba(255, 215, 165, ${0.6 * flood})`); fl.addColorStop(0.35, `rgba(255, 140, 85, ${0.25 * flood})`); fl.addColorStop(1, "rgba(120, 60, 120, 0)");
        ctx3d.fillStyle = fl; ctx3d.fillRect(-60, -60, W + 120, H + 120);

        // Remnant nebula: wide glowing lobes that keep spreading and fade over half a minute
        for (let n = 0; n < 16; n++) {
            const ang = rnd() * 6.2832, sp = (50 + 170 * rnd()) * scale, d = sp * (1 - Math.exp(-tb * 0.12)) * 5, rad = (80 + 200 * rnd()) * scale * (0.35 + 0.65 * Math.min(1, tb / 5)), a = 0.32 * Math.min(1, tb / 1.2) * Math.exp(-tb * 0.075) + 0.02, col = ["255, 130, 70", "220, 80, 150", "140, 100, 240", "255, 190, 110"][n % 4];
            glow(sun.X + Math.cos(ang) * d, sun.Y + Math.sin(ang) * d, rad, col, a);
        }

        // Core: blinding at the blast and fading, while the neutron star left behind emerges from the glare
        const blastCore = Math.exp(-tb * 1.2), heave = 1 + 2.2 * Math.exp(-(((tb - 0.5) / 1) ** 2));
        glow(sun.X, sun.Y, 110 * scale * heave, "255, 170, 90", 0.7 * blastCore);
        glow(sun.X, sun.Y, 24 * scale * heave, "255, 246, 214", blastCore);
        drawNeutronStar(sun.X, sun.Y, scale, smooth(2, 6, tb), now);

        // Rippling plasma surface while the star convulses
        const churn = Math.exp(-tb * 0.25);
        if (churn > 0.05) {
            const R0 = 22 * scale * heave, sg = ctx3d.createRadialGradient(sun.X, sun.Y, 0, sun.X, sun.Y, R0 * 1.4);
            sg.addColorStop(0, `rgba(255, 245, 220, ${0.8 * churn})`); sg.addColorStop(0.6, `rgba(255, 160, 80, ${0.55 * churn})`); sg.addColorStop(1, "rgba(200, 60, 40, 0)");
            ctx3d.fillStyle = sg; ctx3d.beginPath();
            for (let n = 0; n <= 90; n++) { const ang = n / 90 * 6.2832, r = R0 * (1 + 0.16 * Math.sin(ang * 5 + now / 180) * churn + 0.1 * Math.sin(ang * 11 - now / 130) * churn + 0.06 * Math.sin(ang * 23 + now / 90)); n ? ctx3d.lineTo(sun.X + Math.cos(ang) * r, sun.Y + Math.sin(ang) * r) : ctx3d.moveTo(sun.X + Math.cos(ang) * r, sun.Y + Math.sin(ang) * r); }
            ctx3d.closePath(); ctx3d.fill();
        }

        // White-out at the detonation and smaller flashes at each aftershock
        glow(sun.X, sun.Y, 340 * scale * Math.min(1, tb * 4), "255, 252, 240", Math.exp(-tb * 2.2));
        AFTERSHOCKS.forEach(([at, sg]) => { const k = kick(tb, at, 2.5); if (k > 0.01) { const off = (at * 37) % 6.28; glow(sun.X + Math.cos(off) * 18 * scale, sun.Y + Math.sin(off) * 18 * scale, 220 * scale * sg * Math.min(1, (tb - at) * 6), "255, 235, 200", 0.8 * sg * k); } });

        // Shock front: no visible edge, only a soft swell of glowing gas spreading outward and fading, while the push itself bends the coordinate grid
        if (shock) {
            const strength = shock.A / (36 * unit), outer = shock.R + shock.w * 2.5, inner = Math.max(0, shock.R - shock.w * 1.5), hz = ctx3d.createRadialGradient(sun.X, sun.Y, 0, sun.X, sun.Y, outer);
            hz.addColorStop(0, "rgba(255, 210, 160, 0)"); hz.addColorStop(inner / outer, "rgba(255, 210, 160, 0)"); hz.addColorStop(shock.R / outer, `rgba(255, 205, 150, ${0.14 * strength})`); hz.addColorStop(1, "rgba(255, 200, 140, 0)");
            ctx3d.fillStyle = hz; ctx3d.beginPath(); ctx3d.arc(sun.X, sun.Y, outer, 0, 6.2832); ctx3d.fill();
        }

        // Fireball: overlapping billows of hot gas that roll outward unevenly, pushed further along the comet's direction, cooling from white through orange to deep red and violet
        for (let n = 0; n < 46; n++) {
            const bias = rnd() < 0.6, ang = bias ? inDir + (rnd() - 0.5) * 2.4 : rnd() * 6.2832, reach = (40 + 190 * rnd()) * scale * (bias ? 1.3 : 0.8), start = rnd() * 0.5, life = 3 + 6 * rnd(), wob = rnd() * 6.28, rate = 0.9 + rnd() * 0.8, size = 18 + 50 * rnd();
            const tt = tb - start; if (tt <= 0 || tt > life) continue;
            const grow = 1 - Math.exp(-tt * rate), d = reach * grow, X0 = sun.X + Math.cos(ang) * d + Math.sin(tt * 0.8 + wob) * 8 * scale, Y0 = sun.Y + Math.sin(ang) * d + Math.cos(tt * 0.7 + wob) * 8 * scale;
            const heat = Math.exp(-tt * 0.55), rad = size * scale * (0.4 + grow), a = 0.5 * (1 - tt / life) ** 1.3 * Math.min(1, tt * 6);
            const col = heat > 0.6 ? "255, 238, 205" : heat > 0.3 ? "255, 160, 85" : heat > 0.12 ? "225, 80, 70" : "150, 70, 160";
            glow(X0, Y0, rad, col, a);
        }

        // Ejecta from the blast and from each aftershock: hot fragments scattered unevenly that slow down, break into three shards, and cool into drifting red dust
        const bursts = [[0, 1, 380], ...AFTERSHOCKS.map(([at, sg]) => [at, sg, Math.round(110 * sg)])];
        bursts.forEach(([at, sg, count]) => {
            for (let n = 0; n < count; n++) {
                const t0 = at + rnd() * 0.9 * sg, ang = rnd() < 0.3 ? inDir + (rnd() - 0.5) * 1.4 : rnd() * 6.2832, v = (50 + 420 * rnd() ** 1.4) * scale * (0.6 + 0.4 * sg), drag = 1 + 1.4 * rnd(), split = 1.2 + 1.8 * rnd(), life = 12 + 14 * rnd(), size = (0.8 + 2.2 * rnd() ** 2) * scale, sd = rnd() * 6.28;
                const tt = tb - t0; if (tt <= 0 || tt > life) continue;
                const pos = x => v * (1 - Math.exp(-drag * x)) / drag, hot = Math.exp(-tt * 0.7), fade = (1 - tt / life) ** 1.2, col = `255, ${Math.round(95 + 150 * hot)}, ${Math.round(55 + 185 * hot * hot)}`;
                if (tt < split) {
                    const d = pos(tt), X0 = sun.X + Math.cos(ang) * d + Math.sin(sd * 9 + tt) * 6 * scale, Y0 = sun.Y + Math.sin(ang) * d + Math.cos(sd * 7 + tt) * 6 * scale;
                    ctx3d.fillStyle = `rgba(${col}, ${0.9 * fade})`; ctx3d.beginPath(); ctx3d.arc(X0, Y0, size * (0.8 + 0.4 * hot), 0, 6.2832); ctx3d.fill();
                } else {
                    const d = pos(tt), bx = sun.X + Math.cos(ang) * d, by = sun.Y + Math.sin(ang) * d, after = tt - split, dusty = smooth(2, 9, after);
                    for (let q = 0; q < 3; q++) {
                        const sa = ang + (q - 1) * 0.9 + sd, sv = (8 + 14 * q) * scale, dd = sv * (1 - Math.exp(-0.8 * after)) / 0.8 + 3 * scale * after * 0.15;
                        const X0 = bx + Math.cos(sa) * dd + Math.sin(now / 1500 + sd + q) * 2 * scale * dusty, Y0 = by + Math.sin(sa) * dd + Math.cos(now / 1700 + sd + q) * 2 * scale * dusty;
                        const r = Math.max(0.5 * scale, size * (0.55 - 0.12 * q) * (1 - 0.4 * dusty)), a = fade * (0.85 - 0.45 * dusty);
                        ctx3d.fillStyle = dusty > 0.5 ? `rgba(200, 110, 90, ${a * 0.8})` : `rgba(${col}, ${a})`;
                        ctx3d.beginPath(); ctx3d.arc(X0, Y0, r, 0, 6.2832); ctx3d.fill();
                    }
                }
            }
        });
    }

    // Blinding white-out for the first instant of the detonation, drawn over the whole scene
    const tw = sinceImpact;
    if (tw >= 0 && tw < 0.6) { ctx3d.globalCompositeOperation = "source-over"; ctx3d.fillStyle = `rgba(255, 250, 240, ${0.9 * (1 - tw / 0.6) ** 2})`; ctx3d.fillRect(-60, -60, W + 120, H + 120); }
    ctx3d.globalCompositeOperation = "source-over";
    ctx3d.restore();

    // Inset fit chart for the parameters the comet carries right now
    drawFitInset(st.k, st.tau, W, H, dpr, body);

    // Compact readout of the latest landed iterate
    const [r, k, tau, f, g] = bfgsPath[at.reached];
    updateScaleBar(at, Wp, W, H, dpr);
    hud.innerHTML = `<span class="hud-iter">Iteration <b>${r}</b> of ${lastIter}</span><span class="hud-cell"><span>k =</span><span class="v">${k.toFixed(6)}</span></span><span class="hud-cell"><span>τ =</span><span class="v">${tau.toFixed(6)}</span></span><span class="hud-cell"><span>−ℓ =</span><span class="v">${f.toFixed(6)}</span></span><span class="hud-cell" title="Gradient norm"><span>‖∇f‖ =</span><span class="v">${sci(g)}</span></span><span class="hud-cell" title="Step size accepted by the Strong Wolfe line search, with the number of alphas tried in the line search and in the zoom procedure"><span>α =</span><span class="v">${fmtAlpha(lineSearch[at.i].at(-1)[0])}</span><span class="trials">${trialCount(at.i)}</span></span>`;
    fitHud();
}

// Gentle idle loop at about 30 frames a second keeps stars twinkling and the converged sun breathing while the 3D view is visible and nothing else is animating
let lastIdle = 0;
function idle3d(now) {
    const r = canvas3d.getBoundingClientRect();
    if (now - lastIdle > 33 && viewMode === "3d" && !playing && !drag3d && r.bottom > 0 && r.top < innerHeight) { lastIdle = now; render3d(now); }
    requestAnimationFrame(idle3d);
}
requestAnimationFrame(idle3d);

// Camera chases the point in flight and eases its zoom toward each step's own scale, orbiting slowly the whole time
function flightCamera(at, p) {
    const Wp = iterWorld(), Z = stepZoom(Wp), zPrev = at.i === 0 ? 1 : Z[at.i - 1];
    const ground = [0, 1, 2].map(q => lerp(Wp[at.i][q], Wp[at.i + 1][q], at.e)), aim = smooth(0, 0.35, at.s);
    return {
        yaw: camHome.yaw + p * Math.PI * 0.9, pitch: lerp(camHome.pitch, 0.95, smooth(0.5, 1.5, at.s)),
        zoom: Math.exp(lerp(Math.log(zPrev), Math.log(Z[at.i]), smooth(0, 0.55, at.u))),
        tx: lerp(0, ground[0], aim), ty: lerp(0, ground[1], aim), tz: lerp(0.5, ground[2], aim)
    };
}

// During the first line search the camera pulls far back to show alpha = 1 thrown out to k = 58.6, then follows each zoom trial back toward the start before handing over to the flight
function searchCamera(at, p) {
    const Wp = iterWorld(), start = Wp[0], T = trialsFor(0), n = T.length, base = flightCamera(at, p);
    let last = { c: [0, 0, 0.5], zoom: 1 };
    const frames = T.map((q, t) => {
        if (t === n - 1) return { c: [base.tx, base.ty, base.tz], zoom: base.zoom };
        const span = Math.hypot(q.w[0] - start[0], q.w[1] - start[1]);
        if (span < 0.05) return last;
        return last = { c: [0, 1, 2].map(m => (start[m] + q.w[m]) / 2), zoom: 1.8 / Math.max(0.6, span / 2 * 1.35) };
    });
    const m = at.search * n, home = { c: [0, 0, 0.5], zoom: 1 }, t0 = Math.floor(m - 1), f = smooth(0, 1, m - 1 - t0);
    const A = t0 < 0 ? home : frames[Math.min(n - 1, t0)], B = frames[Math.min(n - 1, t0 + 1)], blend = t0 < 0 ? smooth(0, 1, m) : f;
    return { yaw: base.yaw, pitch: lerp(camHome.pitch, base.pitch, 0.4), zoom: Math.exp(lerp(Math.log(A.zoom), Math.log(B.zoom), blend)), tx: lerp(A.c[0], B.c[0], blend), ty: lerp(A.c[1], B.c[1], blend), tz: lerp(A.c[2], B.c[2], blend) };
}

function cameraFor(p) {
    const at = pathAt(p);
    return at.i === 0 && at.search < 1 ? searchCamera(at, p) : flightCamera(at, p);
}

// Paint a range track up to its current value, since WebKit has no native filled track
const fillRange = el => el.style.setProperty("--fill", `${(el.value - el.min) / (el.max - el.min) * 100}%`);

// Playback controls, elapsed time, and the scrubber share one progress value over the BFGS flight; the supernova starts when playback reaches the end
const playBtn = $("play-3d"), durationSel = $("duration-3d"), scrub = $("scrub-3d"), timeLabel = $("time-3d");
let endedAt = null;

// Seconds since the comet touched the star, counted in real time from the end of playback, or Infinity before that
const snSeconds = now => endedAt === null ? Infinity : (now - endedAt) / 1000;
const fmtTime = ms => `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, "0")}`;
const syncPlayer = () => { const d = +durationSel.value; scrub.value = Math.round(progress * 1000); fillRange(scrub); timeLabel.textContent = `${fmtTime(progress * d)} / ${fmtTime(d)}`; playBtn.classList.toggle("playing", playing); $("play-label").textContent = playing ? "Pause" : progress >= 1 ? "Replay" : "Play"; };

// Each frame advances progress by elapsed time over the chosen duration; the frame clock can start slightly before the click, so progress never drops below zero, and reaching the end sets off the supernova
function tick(now) {
    if (!playing) return;
    progress = Math.min(1, Math.max(0, playFrom + (now - playStart) / +durationSel.value));
    cam = cameraFor(progress);
    render3d(now); syncPlayer(); soundFrame();
    if (progress < 1) requestAnimationFrame(tick); else { playing = false; endedAt = now; syncPlayer(); if (soundOn) { snStarted = true; convergence(0); } }
}
function play() { if (progress >= 1) progress = 0; endedAt = null; playing = true; playFrom = progress; playStart = performance.now(); spin = 0; hud.hidden = false; soundReset(); syncPlayer(); requestAnimationFrame(tick); }
function pause() { playing = false; cancelSn(); syncPlayer(); soundFrame(); }
playBtn.addEventListener("click", () => playing ? pause() : play());
durationSel.addEventListener("change", () => { if (playing) { playFrom = progress; playStart = performance.now(); } syncPlayer(); });
scrub.addEventListener("input", () => { endedAt = null; progress = scrub.value / 1000; pause(); cam = cameraFor(progress); hud.hidden = false; render3d(); syncPlayer(); });

// Sonification with the Web Audio API: everything is synthesized, nothing plays until the sound button is pressed
const soundBtn = $("sound-3d");
let audio = null, soundOn = false, lastReached = -1, lastShown = 0, lastStep = -1, whistleTimer = null;

// Long synthetic reverb from decaying stereo noise gives the vast empty room
function makeReverb(ac, seconds) {
    const len = ac.sampleRate * seconds, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
    const conv = ac.createConvolver(); conv.buffer = buf; return conv;
}

// Brown noise is the raw material for rumble: most of its energy sits in the lowest frequencies
function brownNoise(ac, seconds) {
    const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; return src;
}

// Soft clipping adds harmonics so the rumble is still felt on laptop speakers that cannot reproduce deep bass
function saturator(ac, amount) {
    const ws = ac.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(amount * x) / Math.tanh(amount); }
    ws.curve = curve; return ws;
}

// Graph: near-silent bed, a proximity rumble, a star hum, a low whoosh for the comet, plus echo and a deep reverb for every event
function initAudio() {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const master = ac.createGain(), comp = ac.createDynamicsCompressor(), verb = makeReverb(ac, 7), wet = ac.createGain();
    master.gain.value = 0; wet.gain.value = 0.9;
    master.connect(comp); comp.connect(ac.destination); verb.connect(wet); wet.connect(comp);
    const bus = ac.createGain(); bus.connect(master); bus.connect(verb);

    // Echo send for pings and whistles, darkened on each repeat
    const echo = ac.createDelay(2), fb = ac.createGain(), dark = ac.createBiquadFilter(), echoIn = ac.createGain();
    echo.delayTime.value = 0.62; fb.gain.value = 0.45; dark.type = "lowpass"; dark.frequency.value = 1800;
    echoIn.connect(echo); echo.connect(dark); dark.connect(fb); fb.connect(echo); dark.connect(bus);

    // Near-silent bed: a faint sub tone and a thin airy hiss so the silence still feels like a place
    const bed = ac.createGain(); bed.gain.value = 0.02; bed.connect(bus);
    [32.7, 49.1].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.detune.value = i * 7; g.gain.value = 0.7; o.connect(g); g.connect(bed); o.start(); });
    const air = brownNoise(ac, 4), airHp = ac.createBiquadFilter(), airGain = ac.createGain();
    airHp.type = "highpass"; airHp.frequency.value = 2500; airGain.gain.value = 0.006; air.connect(airHp); airHp.connect(airGain); airGain.connect(bus); air.start();

    // Proximity rumble: brown noise, low-passed and saturated, swelling as the comet nears the star or a trial rock
    const rumbleSrc = brownNoise(ac, 6), rumbleLp = ac.createBiquadFilter(), rumbleSat = saturator(ac, 3), rumble = ac.createGain();
    rumbleLp.type = "lowpass"; rumbleLp.frequency.value = 140; rumbleLp.Q.value = 0.9; rumble.gain.value = 0.02;
    rumbleSrc.connect(rumbleLp); rumbleLp.connect(rumbleSat); rumbleSat.connect(rumble); rumble.connect(bus); rumbleSrc.start();

    // Evaporation hiss: bright noise that rises as the comet heats up near the optimum
    const hissBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), hd = hissBuf.getChannelData(0);
    for (let i = 0; i < hd.length; i++) hd[i] = Math.random() * 2 - 1;
    const hissSrc = ac.createBufferSource(), hissHp = ac.createBiquadFilter(), hiss = ac.createGain();
    hissSrc.buffer = hissBuf; hissSrc.loop = true; hissHp.type = "highpass"; hissHp.frequency.value = 3200; hiss.gain.value = 0;
    hissSrc.connect(hissHp); hissHp.connect(hiss); hiss.connect(bus); hissSrc.start();

    // Star hum: three tones at a root, a tritone, and an octave, whose pitch and tremolo follow the gradient norm
    const hum = ac.createGain(), trem = ac.createGain(), tremLfo = ac.createOscillator(), tremDepth = ac.createGain();
    hum.gain.value = 0; trem.gain.value = 0.6; tremDepth.gain.value = 0.4; tremLfo.frequency.value = 4;
    tremLfo.connect(tremDepth); tremDepth.connect(trem.gain); tremLfo.start(); trem.connect(hum); hum.connect(bus);
    const humOsc = [1, 1.414, 2].map((ratio, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i === 2 ? "triangle" : "sine"; o.frequency.value = 41.2 * ratio; g.gain.value = [0.8, 0.5, 0.25][i]; o.connect(g); g.connect(trem); o.start(); return { o, ratio }; });

    // Comet whoosh: noise through a low band-pass whose level, pitch, and pan follow the flight
    const wSrc = brownNoise(ac, 3), band = ac.createBiquadFilter(), whoosh = ac.createGain(), pan = ac.createStereoPanner();
    band.type = "bandpass"; band.Q.value = 1.1; band.frequency.value = 160; whoosh.gain.value = 0;
    wSrc.connect(band); band.connect(whoosh); whoosh.connect(pan); pan.connect(bus); wSrc.start();
    // Tuning pair: a fixed reference for Kaplan–Meier and a voice for the Weibull fit, detuned by how far the MAE is from its final value
    const tune = ac.createGain(), tuneLp = ac.createBiquadFilter(); tune.gain.value = 0.022; tuneLp.type = "lowpass"; tuneLp.frequency.value = 900;
    const tuneRef = ac.createOscillator(), tuneFit = ac.createOscillator(); tuneRef.type = tuneFit.type = "triangle"; tuneRef.frequency.value = tuneFit.frequency.value = 196;
    tuneRef.connect(tuneLp); tuneFit.connect(tuneLp); tuneLp.connect(tune); tune.connect(bus); tuneRef.start(); tuneFit.start();
    audio = { ac, master, bus, echoIn, rumble, rumbleLp, hum, humOsc, tremLfo, tremDepth, band, whoosh, pan, tuneFit, hiss };
}

// One voice with an envelope and an optional pitch glide, routed dry, into the echo, and into the reverb
function voice(freq, { to = freq, gain = 0.06, attack = 0.01, decay = 1.5, type = "sine", pan = 0, echo = 0.4, glide = decay } = {}) {
    if (!audio || !soundOn) return;
    const { ac, bus, echoIn } = audio, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), p = ac.createStereoPanner(), send = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + glide);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    p.pan.value = pan; send.gain.value = echo;
    o.connect(g); g.connect(p); p.connect(bus); p.connect(send); send.connect(echoIn);
    o.start(t); o.stop(t + attack + decay + 0.1);
}

// Distant whistlers: long falling glides at random moments, like radio recordings of plasma waves
function scheduleWhistle() {
    clearTimeout(whistleTimer);
    whistleTimer = setTimeout(() => {
        if (soundOn && viewMode === "3d" && document.visibilityState === "visible") {
            const hi = 1800 + Math.random() * 2200;
            voice(hi, { to: hi * (0.18 + Math.random() * 0.15), gain: 0.012, attack: 0.6, decay: 3.5 + Math.random() * 2, pan: Math.random() * 1.6 - 0.8, echo: 0.6 });
            if (Math.random() < 0.4) voice(220 + Math.random() * 120, { to: 160, gain: 0.01, attack: 1.5, decay: 5, type: "triangle", pan: Math.random() * 1.2 - 0.6, echo: 0.3 });
        }
        scheduleWhistle();
    }, 6000 + Math.random() * 9000);
}

// Data to sound: a value's position on a log scale between two bounds, clamped to [0, 1]
const logPos = (v, lo, hi) => Math.min(1, Math.max(0, (Math.log10(Math.max(v, 1e-300)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))));

// Step length ||s_r|| = alpha_r ||p_r|| in (k, tau) for each BFGS step, from the notebook's accepted alpha and direction
const stepLength = r => lineSearch[r].at(-1)[0] * Math.hypot(searchDir[r][0], searchDir[r][1]);

// Ping pitch from the trial alpha on a log scale: alpha 8 rings high, alpha 0.0195 sits low
const pingFreq = a => 160 * 2 ** (3.4 * logPos(a, 0.005, 8));

// Landing thud from the step just completed: longer steps hit deeper, louder, and longer; the tiniest steps are a faint tap
function landing(r) {
    const size = logPos(stepLength(r - 1), 1e-7, 1.6), dark = [0, 1, 5, 6, 10][r % 5] / 12 + Math.floor(r / 5);
    voice(70 + 90 * (1 - size), { to: 28 + 20 * (1 - size), gain: 0.04 + 0.3 * size, attack: 0.005, decay: 0.35 + 1.4 * size, glide: 0.25 + 0.6 * size, echo: 0.1, pan: cometPan * 0.4 });
    voice(440 * 2 ** dark, { gain: 0.006 + 0.016 * (1 - size), attack: 0.02, decay: 2.8, pan: cometPan * 0.6, echo: 0.55 });
}

// B update: a filtered noise breath whose strength follows the relative change ||B_r - B_(r-1)|| / ||B_(r-1)||
const bChange = r => { const a = bfgsB[r - 1], b = bfgsB[r], fro = m => Math.hypot(m[0], Math.SQRT2 * m[1], m[2]); return fro([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) / fro(a); };
function bBreath(r) {
    if (!audio || !soundOn) return;
    const amt = logPos(bChange(r), 1e-4, 200), { ac, bus } = audio, t = ac.currentTime, src = brownNoise(ac, 2), bp = ac.createBiquadFilter(), g = ac.createGain();
    bp.type = "bandpass"; bp.Q.value = 4; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(300 + 2600 * amt, t + 0.9);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.01 + 0.09 * amt, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(t); src.stop(t + 1.7);
}

// Gradient norm along the path, interpolated in log space between the landed iterates so the hum glides
const gradAt = at => { const a = Math.log10(bfgsPath[at.i][4]), b = Math.log10(bfgsPath[at.i + 1][4]); return 10 ** lerp(a, b, at.e); };

// Supernova sound, started at the end of playback: the detonation, the roar, muffled aftershocks, a long rumble with distant rolling thunder, the pulsar, and the slow swell; every scheduled part can be cancelled
let snTimers = [], snNodes = [], snStarted = false;
function cancelSn() { snTimers.forEach(clearTimeout); snTimers = []; snNodes.forEach(n => { try { n.stop(); } catch (e) {} }); snNodes = []; snStarted = false; }
function convergence(from = 0) {
    if (!audio || !soundOn) return;
    const { ac, bus } = audio, T = ac.currentTime - from;
    const later = (sec, fn) => { if (sec >= from - 0.05) snTimers.push(setTimeout(() => { if (audio && soundOn) fn(); }, Math.max(0, sec - from) * 1000)); };
    const burst = (sec, dur, setup) => { if (from > sec + 0.3) return; const start = T + sec, src = brownNoise(ac, Math.ceil(dur) + 1), f = ac.createBiquadFilter(), g = ac.createGain(); setup(f, g, start); src.connect(f); f.connect(g); g.connect(bus); src.start(start); src.stop(start + dur + 0.1); snNodes.push(src); };

    // Detonation at contact: falling sub booms and a heavy mid burst
    later(0, () => { voice(95, { to: 22, gain: 0.9, attack: 0.004, decay: 3.4, glide: 2.2, echo: 0.1 }); voice(60, { to: 18, gain: 0.65, attack: 0.01, decay: 4.2, glide: 3, type: "triangle", echo: 0.05 }); });
    burst(0, 2.6, (f, g, t0) => { f.type = "lowpass"; f.Q.value = 0.7; f.frequency.setValueAtTime(1400, t0); f.frequency.exponentialRampToValueAtTime(110, t0 + 2.3); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1.1, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6); });

    // Roar of the star boiling over
    burst(0, 9, (f, g, t0) => { f.type = "bandpass"; f.Q.value = 0.6; f.frequency.setValueAtTime(240, t0); f.frequency.exponentialRampToValueAtTime(460, t0 + 1.5); f.frequency.exponentialRampToValueAtTime(130, t0 + 9); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.6, t0 + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 9); });

    // Aftershocks: deep muffled booms matching the flashes on screen
    AFTERSHOCKS.forEach(([at, sg]) => {
        burst(at, 2.2, (f, g, t0) => { f.type = "lowpass"; f.Q.value = 0.8; f.frequency.setValueAtTime(420, t0); f.frequency.exponentialRampToValueAtTime(70, t0 + 2); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.9 * sg, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2); });
        later(at, () => voice(80, { to: 24, gain: 0.75 * sg, attack: 0.01, decay: 2.6, glide: 1.8, echo: 0.15, pan: (Math.random() - 0.5) * 0.6 }));
    });

    // Long rumble: saturated low noise rolling unevenly for about twenty seconds, joined partway through when starting late
    if (from < 18) {
        const rum = brownNoise(ac, 24), lp = ac.createBiquadFilter(), sat = saturator(ac, 7), rg = ac.createGain(), roll = ac.createOscillator(), rollDepth = ac.createGain(), now = ac.currentTime, level = from < 4 ? 0.95 : 0.95 * Math.exp(-(from - 4) / 5);
        lp.type = "lowpass"; lp.frequency.setValueAtTime(700 * Math.exp(-from / 10), now); lp.frequency.exponentialRampToValueAtTime(90, now + Math.max(1, 20 - from));
        rg.gain.setValueAtTime(0.0001, now); rg.gain.exponentialRampToValueAtTime(level, now + (from < 0.7 ? 0.7 - from : 0.15)); rg.gain.setTargetAtTime(0.0001, now + Math.max(0, 4 - from), 5);
        roll.frequency.value = 0.55; rollDepth.gain.value = 0.4 * level; roll.connect(rollDepth); rollDepth.connect(rg.gain);
        rum.connect(lp); lp.connect(sat); sat.connect(rg); rg.connect(bus); rum.start(now); rum.stop(now + 24 - from); roll.start(now); roll.stop(now + 24 - from); snNodes.push(rum, roll);
    }

    // Distant thunder: heavy low booms rolling away after the aftershocks
    [10, 12.5, 15.5, 19].forEach((sec, n) => {
        const gain = 0.45 * 0.78 ** n, pan = (Math.random() - 0.5) * 1.4;
        burst(sec, 3.5, (f, g, t0) => { f.type = "lowpass"; f.frequency.setValueAtTime(380, t0); f.frequency.exponentialRampToValueAtTime(70, t0 + 3.2); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5); });
        later(sec, () => voice(55, { to: 26, gain: gain * 0.6, attack: 0.15, decay: 3, glide: 2.5, echo: 0.3, pan }));
    });

    // Pulsar: soft regular ticks once the neutron star emerges, fading after about half a minute
    const pulsar = k => { if (!audio || !soundOn || snSeconds(performance.now()) === Infinity || viewMode !== "3d" || k > 90) return; voice(2100, { gain: 0.012 * Math.exp(-k / 45), attack: 0.002, decay: 0.06, echo: 0.5 }); voice(70, { gain: 0.03 * Math.exp(-k / 45), attack: 0.003, decay: 0.12, echo: 0 }); snTimers.push(setTimeout(() => pulsar(k + 1), 330)); };
    if (from <= 5) later(5, () => pulsar(0)); else pulsar(Math.floor((from - 5) / 0.33));

    // Afterglow: the slow dissonant swell once the debris has settled
    later(6, () => { [65.41, 98, 155.56, 185, 233.08].forEach((f, i) => voice(f, { gain: 0.035, attack: 2 + i * 0.25, decay: 10, type: i < 2 ? "triangle" : "sine", echo: 0.25 })); voice(1244.5, { to: 1180, gain: 0.008, attack: 3, decay: 9, echo: 0.6 }); });
}

// Per frame: whoosh follows flight speed, rumble swells with proximity, the hum follows the gradient norm, the tuning pair follows the MAE, line search planets toll and zoom asteroids ping at their alpha, landings thud by step length with a breath for the B update, and convergence closes it
function soundFrame() {
    if (!audio || !soundOn) return;
    const { ac, rumble, rumbleLp, hum, band, whoosh, pan } = audio, t = ac.currentTime, at = pathAt(progress), sh = searchShare(at.i);
    const fu = sh ? Math.max(0, (at.u - sh) / (1 - sh)) : at.u, flying = playing && progress < 1 && (!sh || at.u > sh);
    const speed = flying ? (fu < 0.5 ? 12 * fu * fu : 3 * (2 - 2 * fu) ** 2) / 3 : 0;
    whoosh.gain.setTargetAtTime(0.2 * speed, t, 0.08); band.frequency.setTargetAtTime(110 + 520 * speed, t, 0.08); pan.pan.setTargetAtTime(cometPan * 0.7, t, 0.1);

    // Proximity in screen space, so closeness is felt at any zoom: to the star, and to the rocks of the current step
    let prox = 0;
    if (cometScreen && sunScreen && progress < 1) prox = Math.max(0, 1 - Math.hypot(cometScreen.X - sunScreen.X, (cometScreen.Y - sunScreen.Y) * 0.5) / 0.45);
    const rockNear = cometScreen && progress < 1 ? projectedRocks.filter(o => o.step === at.i).reduce((m, o) => Math.max(m, 1 - Math.hypot(o.X / canvas3d.width - cometScreen.X, o.Y / canvas3d.height - cometScreen.Y) / 0.2), 0) : 0;
    const settled = progress >= 1 ? 0.35 : 0, near = Math.max(prox * prox, rockNear * 0.6, settled);
    rumble.gain.setTargetAtTime(0.02 + 0.5 * near, t, 0.25); rumbleLp.frequency.setTargetAtTime(110 + 120 * near, t, 0.25);
    hum.gain.setTargetAtTime(0.09 * Math.max(prox, settled), t, 0.4);
    audio.hiss.gain.setTargetAtTime(playing && progress < 1 ? 0.035 * cometHeat * cometHeat : 0, t, 0.15);

    // Gradient norm sets the star hum: large gradients pitch it up and make it shudder, convergence lets it sink and hold still
    const g = progress >= 1 ? bfgsPath[lastIter][4] : gradAt(at), gp = logPos(g, 1e-8, 60);
    audio.humOsc.forEach(({ o, ratio }) => o.frequency.setTargetAtTime((32 + 78 * gp) * ratio, t, 0.3));
    audio.tremLfo.frequency.setTargetAtTime(0.3 + 7 * gp, t, 0.3); audio.tremDepth.gain.setTargetAtTime(0.05 + 0.4 * gp, t, 0.3);

    // Tuning pair: the Weibull voice drifts back into unison with the reference as the MAE falls to its final value
    const stNow = bfgsStateAt(at.i, progress < 1 ? at.e : 1), rel = Math.min(1, Math.max(0, (maeFor(stNow.k, stNow.tau) - maeEnd) / (maeStart - maeEnd)));
    audio.tuneFit.detune.setTargetAtTime(110 * rel, t, 0.2);

    if (!playing && progress < 1) return;
    if (at.i !== lastStep) { lastStep = at.i; lastShown = 0; }
    if (sh) {
        const shown = Math.min(lineSearch[at.i].length - 1, Math.floor(at.search * lineSearch[at.i].length + 1e-9));
        for (let m = lastShown; m < shown; m++) {
            const [a, kind, phase] = lineSearch[at.i][m], f0 = pingFreq(a);
            if (phase === "i") { voice(f0 / 2, { gain: 0.045, attack: 0.01, decay: 1.4, type: "triangle", pan: cometPan * 0.4, echo: 0.6 }); voice(f0 * 1.19, { gain: 0.012, attack: 0.01, decay: 1.1, pan: cometPan * 0.4, echo: 0.6 }); }
            else voice(f0, { gain: kind === "low" ? 0.018 : 0.028, attack: 0.003, decay: 0.28, type: "sine", pan: cometPan * 0.5, echo: 0.7 });
        }
        lastShown = Math.max(lastShown, shown);
    }
    if (at.reached > lastReached) {
        for (let r = Math.max(1, lastReached + 1); r <= at.reached; r++) { landing(r); bBreath(r); }
        lastReached = at.reached;
    }
}

// Playback start lines the trackers up with the current position so no stale events fire
function soundReset() { const at = pathAt(progress); lastReached = at.reached; lastStep = playing ? -1 : at.i; lastShown = 0; cancelSn(); }

// Site volume from 1 to 100 on a squared curve, independent of the device volume and remembered between visits
const volumeInput = $("volume-3d"), volumeLabel = $("volume-value");
const volumeGain = () => 1.84 * (volumeInput.value / 100) ** 2;
try { const v = localStorage.getItem("spaceVolume"); if (v) volumeInput.value = v; } catch (e) {}
volumeLabel.textContent = volumeInput.value; fillRange(volumeInput);
volumeInput.addEventListener("input", () => {
    volumeLabel.textContent = volumeInput.value; fillRange(volumeInput);
    try { localStorage.setItem("spaceVolume", volumeInput.value); } catch (e) {}
    if (audio && soundOn) audio.master.gain.setTargetAtTime(volumeGain(), audio.ac.currentTime, 0.05);
});

// Sound button creates the graph on first press, then fades the master in or out and suspends when silent
soundBtn.addEventListener("click", async () => {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", soundOn);
    soundBtn.setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
    if (soundOn && !audio) initAudio();
    const { ac, master } = audio;
    if (soundOn) { await ac.resume(); master.gain.setTargetAtTime(volumeGain(), ac.currentTime, 0.8); soundReset(); scheduleWhistle(); soundFrame(); }
    else { clearTimeout(whistleTimer); master.gain.setTargetAtTime(0, ac.currentTime, 0.25); setTimeout(() => { if (!soundOn) ac.suspend(); }, 1200); }
});

// Leaving the 3D view or hiding the tab silences everything; coming back restores it if sound is on
function soundVisibility(active) {
    if (!audio) return;
    const { ac, master } = audio;
    if (active && soundOn) { ac.resume(); master.gain.setTargetAtTime(volumeGain(), ac.currentTime, 0.6); scheduleWhistle(); }
    else { clearTimeout(whistleTimer); master.gain.setTargetAtTime(0, ac.currentTime, 0.15); setTimeout(() => { if (!(soundOn && viewMode === "3d" && document.visibilityState === "visible")) ac.suspend(); }, 800); }
}
document.addEventListener("visibilitychange", () => soundVisibility(document.visibilityState === "visible" && viewMode === "3d"));

// Cursor coordinates read off the coordinate plane like a map, with decimals that follow the zoom
const cursorCoords = $("coords-3d");
function showCursorCoords(mx, my, dpr) {
    const { k, tau } = screenToParams(mx, my, canvas3d.width, canvas3d.height);
    if (!(k > 0 && tau > 0) || drag3d) { cursorCoords.hidden = true; return; }
    const span = 3.6 / cam.zoom, dk = tickDecimals(tickStep(span * (dom.k1 - dom.k0) / 2, 6)) + 2, dt = tickDecimals(tickStep(span * (dom.t1 - dom.t0) / 2, 6)) + 2;
    cursorCoords.innerHTML = `<span>k = ${k.toFixed(Math.min(9, dk))}</span><span>τ = ${tau.toFixed(Math.min(9, dt))}</span><span>−ℓ = ${negLogLik(k, tau).toFixed(6)}</span>`;
    cursorCoords.style.left = `${mx / dpr + 14}px`; cursorCoords.style.top = `${my / dpr + 14}px`;
    cursorCoords.classList.toggle("flip", mx / canvas3d.width > 0.7);
    cursorCoords.hidden = false;
}

// Hovering a line search rock shows its trial, and hovering a finished iterate shows its values; when iterates overlap on screen the latest one wins
function hover3d(e) {
    const rect = canvas3d.getBoundingClientRect(), dpr = canvas3d.width / canvas3d.clientWidth, rs = canvas3d.width / rect.width, mx = (e.clientX - rect.left) * rs, my = (e.clientY - rect.top) * rs;
    const rock = projectedRocks.map(o => ({ o, d: Math.hypot(o.X - mx, o.Y - my) })).filter(x => x.d < 9 * dpr).sort((x, y) => x.d - y.d)[0];
    if (rock && !playing) {
        cursorCoords.hidden = true;
        const { q, step } = rock.o, pct = rock.o.X / canvas3d.width * 100;
        const result = { reject: "Armijo not met", expand: "Armijo met, α doubled", low: "Armijo met, becomes α_low" }[q.kind];
        plotTip.innerHTML = `<b>r = ${step}, ${q.phase} = ${q.ix}</b><span class="tk"><span>Phase</span><span>${q.phase === "i" ? "Line search" : "Zoom"}</span></span><span class="tk"><span>α</span><span>${q.a < 1e-6 ? sci(q.a) : fmtAlpha(q.a)}</span></span><span class="tk"><span>k</span><span>${q.k.toFixed(6)}</span></span><span class="tk"><span>τ</span><span>${q.tau.toFixed(6)}</span></span><span class="tk"><span>Result</span><span>${result}</span></span>`;
        plotTip.style.left = pct > 55 ? "" : `calc(${pct}% + 14px)`;
        plotTip.style.right = pct > 55 ? `calc(${100 - pct}% + 14px)` : "";
        plotTip.hidden = false;
        return;
    }
    const hit = projectedPath.map(q => ({ q, d: Math.hypot(q.X - mx, q.Y - my) })).filter(o => o.d < 12 * dpr).sort((x, y) => Math.abs(x.d - y.d) < 2 * dpr ? y.q.r - x.q.r : x.d - y.d)[0];
    if (!hit || playing) { plotTip.hidden = true; showCursorCoords(mx, my, dpr); return; }
    cursorCoords.hidden = true;
    const [r, k, tau, f, g] = bfgsPath[hit.q.r], pct = hit.q.X / canvas3d.width * 100;
    plotTip.innerHTML = `<b>Iteration ${r}</b><span class="tk"><span>k</span><span>${k.toFixed(6)}</span></span><span class="tk"><span>τ</span><span>${tau.toFixed(6)}</span></span><span class="tk"><span>−ℓ</span><span>${f.toFixed(6)}</span></span><span class="tk"><span>Gradient norm</span><span>${sci(g)}</span></span>`;
    plotTip.style.left = pct > 55 ? "" : `calc(${pct}% + 14px)`;
    plotTip.style.right = pct > 55 ? `calc(${100 - pct}% + 14px)` : "";
    plotTip.hidden = false;
}

// Drag rotates with momentum after release so the surface feels loose rather than stiff
canvas3d.addEventListener("pointerdown", e => { if (playing) pause(); drag3d = { x: e.clientX, y: e.clientY, t: performance.now() }; spin = 0; canvas3d.setPointerCapture(e.pointerId); canvas3d.classList.add("dragging"); plotTip.hidden = true; });
canvas3d.addEventListener("pointermove", e => {
    if (!drag3d) return hover3d(e);
    const dx = e.clientX - drag3d.x, now = performance.now();
    cam.yaw += dx * 0.008;
    cam.pitch = Math.min(1.45, Math.max(0.12, cam.pitch + (e.clientY - drag3d.y) * 0.006));
    spin = dx * 0.008 / Math.max(8, now - drag3d.t) * 16;
    drag3d = { x: e.clientX, y: e.clientY, t: now };
    render3d();
});
canvas3d.addEventListener("pointerup", () => {
    drag3d = null; canvas3d.classList.remove("dragging");
    const coast = () => { if (Math.abs(spin) < 0.0005 || drag3d || playing) return; cam.yaw += spin; spin *= 0.94; render3d(); requestAnimationFrame(coast); };
    requestAnimationFrame(coast);
});
canvas3d.addEventListener("pointerleave", () => { if (!drag3d) plotTip.hidden = true; cursorCoords.hidden = true; });
canvas3d.addEventListener("dblclick", () => { pause(); spin = 0; cam = { ...camHome }; render3d(); });
new ResizeObserver(() => { if (viewMode === "3d") render3d(); }).observe(canvas3d);

// Zoom buttons scale the 3D camera or return it home with the full path shown
function zoom3d(mode) {
    pause(); spin = 0;
    if (mode === "reset") { cam = { ...camHome }; endedAt = null; cancelSn(); progress = 1; }
    else cam = { ...cam, zoom: Math.min(5e8, Math.max(0.6, cam.zoom * (mode === "in" ? 1.5 : 1 / 1.5))) };
    render3d(); syncPlayer();
}

// Opening 3D the first time swings the camera in gently with the full path already drawn
function intro3d() {
    opened3d = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return render3d();
    const start = performance.now(), dur = 1800;
    const frame = now => { const p = Math.min(1, (now - start) / dur); cam.yaw = camHome.yaw - 0.8 * (1 - (1 - Math.pow(1 - p, 3))); render3d(); if (p < 1 && viewMode === "3d" && !playing && !drag3d) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
}

// Switch between the 2D fit and the 3D likelihood view, swapping titles, legends, and canvases
let viewMode = "2d";
const viewText = {
    "2d": ["Weibull Fit against Kaplan–Meier", "Lifetime data of 228 lung cancer patients with 63 right-censored observations"],
    "3d": ["BFGS on the Log-Likelihood Surface", "Each point is one iteration from the starting value to convergence"]
};
document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    viewMode = btn.dataset.view;
    document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-selected", b === btn));
    document.querySelectorAll("[data-for]").forEach(n => n.toggleAttribute("hidden", n.dataset.for !== viewMode));
    [$("plot-title").textContent, $("plot-sub").textContent] = viewText[viewMode];
    plotTip.hidden = true;
    plotTip.classList.toggle("tip-space", viewMode === "3d");
    if (viewMode === "3d") { $("zoom-level").hidden = true; syncPlayer(); opened3d ? render3d() : intro3d(); soundVisibility(true); }
    else { pause(); updateZoomLevel(); soundVisibility(false); scaleBar.hidden = true; cursorCoords.hidden = true; }
}));
document.fonts?.ready.then(() => { if (viewMode === "3d") render3d(); });

// Full screen for the 3D view like a video player: the stage with its controls fills the screen, and the button, Esc, or F leaves it
const stage3d = $("stage-3d"), fsBtn = $("fs-3d"), plotArea = stage3d.querySelector(".plot-area"), fsEnter = stage3d.requestFullscreen || stage3d.webkitRequestFullscreen;
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const toggleFs = () => { if (fsElement()) return (document.exitFullscreen || document.webkitExitFullscreen).call(document); fsBase = { w: plotArea.offsetWidth }; fsEnter.call(stage3d); };

// In full screen the chart area keeps its normal width and is scaled as a whole to fit above the controls, centered with dark bars where the screen shape differs; the canvas renders at the enlarged resolution so it stays sharp
function fitFs() {
    const on = fsElement() === stage3d && fsBase;
    if (!on) { fsScale = 1; plotArea.style.cssText = ""; return; }
    plotArea.style.width = `${fsBase.w}px`;
    const room = stage3d.clientHeight - stage3d.querySelector(".player").offsetHeight, h = plotArea.offsetHeight;
    fsScale = Math.min(stage3d.clientWidth / fsBase.w, room / h);
    plotArea.style.left = `${(stage3d.clientWidth - fsBase.w * fsScale) / 2}px`; plotArea.style.top = `${(room - h * fsScale) / 2}px`; plotArea.style.transform = `scale(${fsScale})`;
}
if (!fsEnter) fsBtn.remove();
else {
    fsBtn.addEventListener("click", toggleFs);
    const syncFs = () => { const on = fsElement() === stage3d; fsBtn.classList.toggle("is-on", on); fsBtn.setAttribute("aria-label", on ? "Exit full screen" : "Full screen"); fsBtn.title = on ? "Exit full screen (F)" : "Full screen (F)"; if (!on) fsBase = null; fitFs(); if (viewMode === "3d") requestAnimationFrame(() => render3d()); };
    document.addEventListener("fullscreenchange", syncFs); document.addEventListener("webkitfullscreenchange", syncFs);
    addEventListener("resize", () => { if (fsElement() === stage3d) { fitFs(); render3d(); } });
    addEventListener("keydown", e => { if (e.key.toLowerCase() === "f" && viewMode === "3d" && !e.target.closest("input, select, textarea") && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleFs(); } });
}

// Fill the parameter panel from the thesis estimates
document.querySelector('[data-fit="k"]').textContent = thesisFit.k.toFixed(6);
document.querySelector('[data-fit="tau"]').textContent = thesisFit.tau.toFixed(6);
document.querySelector('[data-fit="mae"]').textContent = thesisFit.mae.toFixed(6);

// Start the sweep from day 0 as soon as the chart is in view; the chart card shows at once without fading in, so nothing hides the start
function initPlot() {
    renderPlot();
    new IntersectionObserver((entries, obs) => { if (entries[0].isIntersecting) { obs.disconnect(); animateReveal(); } }, { threshold: 0.35 }).observe(plotSvg);
}

// Initial render
renderGlance();
renderTable();
renderGradeMix();
renderResearch();
renderProjects();
renderExperience();
syncThemeLabel();
syncActiveLink();
initPlot();
document.fonts?.ready.then(placeNavIndicator);

// A reload or a Back or Forward visit brings the visitor back to where they were in this tab: the scroll position, the open chart tab, and the course table search, grade filter, and page; animations still start fresh, and a new visit starts at the top
const stateKey = "portfolio-state", isReturn = ["reload", "back_forward"].includes(performance.getEntriesByType?.("navigation")[0]?.type);
addEventListener("pagehide", () => { try { sessionStorage.setItem(stateKey, JSON.stringify({ y: scrollY, view: viewMode, q: searchInput.value, grade: gradeFilter, page: currentPage })); } catch (e) {} });
let savedState = null; try { savedState = isReturn ? JSON.parse(sessionStorage.getItem(stateKey)) : null; } catch (e) {}
if (savedState) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    searchInput.value = savedState.q || ""; gradeFilter = savedState.grade || "";
    document.querySelectorAll("[data-grade]").forEach(x => x.setAttribute("aria-pressed", x.dataset.grade === gradeFilter));
    applyFilter(); currentPage = savedState.page || 1; renderTable();
    if (savedState.view === "3d") document.querySelector('[data-view="3d"]').click();
    const backTo = () => scrollTo({ top: savedState.y || 0, behavior: "instant" });
    backTo(); requestAnimationFrame(backTo); document.fonts?.ready.then(backTo);
}