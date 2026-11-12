// Line icons per field, drawn on a 24 unit grid; fields without their own icon fall back to a generic node graph
const fieldIcons = {
    "Computer Vision": '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    "NLP": '<path d="M4 5h16v10H9l-5 4V5Z"/><path d="M8 8.5h8M8 11.5h5"/>',
    "Time Series": '<path d="M3 17l4-5 4 3 4-7 6 6"/><path d="M3 21h18"/>',
    "Clustering": '<path class="edge" d="M12 12.5L11.6 2M12 12.5L2 19.5M12 12.5L22 18.6"/><circle class="pt c1" cx="3.39" cy="7.42" r="1.2"/><circle class="pt c1" cx="3.09" cy="11.53" r="1.2"/><circle class="pt c1" cx="6.72" cy="9.84" r="1.2"/><circle class="pt c1" cx="7.2" cy="5.6" r="1.2"/><circle class="pt c2" cx="16.6" cy="5.2" r="1.2"/><circle class="pt c2" cx="20.6" cy="5.8" r="1.2"/><circle class="pt c2" cx="18.4" cy="9.2" r="1.2"/><circle class="pt c3" cx="10.6" cy="18.4" r="1.2"/><circle class="pt c3" cx="14.4" cy="17.6" r="1.2"/><circle class="pt c3" cx="12.6" cy="21.2" r="1.2"/>',
    "Regression": '<path class="axis" d="M3.5 3.5v17h17"/><path class="trend" d="M4.78 19.38L20.5 5.5"/><circle class="pt" cx="7.6" cy="12.8" r="1.15"/><circle class="pt" cx="9.8" cy="18.2" r="1.15"/><circle class="pt" cx="12" cy="8.4" r="1.15"/><circle class="pt" cx="14.2" cy="14.2" r="1.15"/><circle class="pt" cx="16.4" cy="5.6" r="1.15"/><circle class="pt" cx="18.8" cy="11.2" r="1.15"/>',
    "Classification": '<path d="M12 3v6M12 9l-6 5M12 9l6 5"/><rect x="3" y="14" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/>'
};

// Each field and research type carries its own hue so the page is not one color throughout
const fieldHue = { "Computer Vision": "teal", "NLP": "rose", "Time Series": "amber", "Clustering": "lavender", "Regression": "sky", "Classification": "lime" };
const researchHue = { "Undergraduate Thesis": "lavender", "Internship Research": "teal", "Collaborative Research": "amber" };
const hueStyle = h => h ? ` style="--hue: var(--${h})"` : "";
const fieldIcon = f => `<svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">${fieldIcons[f] || '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 7l8 1M7 8l4 8M17 10l-4 7"/>'}</svg>`;

// Living sky shared by every page of the site, painted about thirty times a second from a seeded layout: drifting, twinkling, glowing stars at night and gently falling snow on a winter morning
const sky = document.getElementById("sky"), skyCtx = sky.getContext("2d"), skyStill = matchMedia("(prefers-reduced-motion: reduce)").matches;
let SW = 0, SH = 0, sdpr = 1, skyStars = [], skyFlakes = [], skyLast = 0, skyRunning = false;
const spriteCache = {};

// Soft round glow sprite per color, drawn once and then stamped with drawImage so glows stay cheap
function sprite(rgb) {
    if (spriteCache[rgb]) return spriteCache[rgb];
    const c = document.createElement("canvas"), g = c.getContext("2d"); c.width = c.height = 64;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb}, 1)`); gr.addColorStop(0.25, `rgba(${rgb}, 0.55)`); gr.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (spriteCache[rgb] = c);
}
const glowAt = (g, x, y, r, rgb, a) => { if (a <= 0.005 || r <= 0) return; g.globalAlpha = Math.min(1, a); g.drawImage(sprite(rgb), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };

// Rebuild the canvas size and the seeded stars and snowflakes; snow is as dense as the stars and falls in three layers: many tiny faint flakes drifting slowly far away, a middle layer, and a few large flakes falling fast and swaying wide up close
function sizeSky() {
    sdpr = Math.min(2, devicePixelRatio || 1); SW = innerWidth + 60; SH = innerHeight + 60;
    sky.width = SW * sdpr; sky.height = SH * sdpr; sky.style.width = `${SW}px`; sky.style.height = `${SH}px`;
    let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    skyStars = Array.from({ length: Math.round(SW * SH / 2400) }, () => { const d = rnd() ** 2, u = rnd(), kind = u < 0.25 ? "still" : u < 0.5 ? "soft" : u < 0.78 ? "pulse" : u < 0.9 ? "flicker" : "bright"; return { x: rnd() * SW, y: rnd() * SH, d, kind, r: kind === "bright" ? 1.3 + rnd() * 1 : 0.4 + d * 1.3, a: kind === "still" ? 0.25 + rnd() * 0.35 : kind === "bright" ? 0.8 + rnd() * 0.2 : 0.35 + rnd() * 0.5, tw: kind === "soft" ? 0.3 + rnd() * 0.5 : kind === "pulse" ? 0.9 + rnd() * 1.2 : kind === "flicker" ? 3 + rnd() * 3 : 0.35 + rnd() * 0.35, tw2: 5 + rnd() * 6, ph: rnd() * 6.2832, tint: rnd() < 0.2 ? "255, 222, 190" : rnd() < 0.3 ? "190, 215, 255" : "235, 240, 255" }; });
    skyFlakes = Array.from({ length: Math.round(SW * SH / 2400) }, () => { const u = rnd(), d = rnd(), layer = u < 0.6 ? 0 : u < 0.88 ? 1 : 2, L = [{ r: 0.6, rr: 0.6, sp: 9, ss: 13, sw: 4, sws: 6, a: 0.35, aa: 0.25 }, { r: 1.3, rr: 0.9, sp: 28, ss: 22, sw: 10, sws: 10, a: 0.6, aa: 0.25 }, { r: 2.4, rr: 1.4, sp: 62, ss: 48, sw: 18, sws: 16, a: 0.8, aa: 0.2 }][layer]; return { x: rnd(), y: rnd(), layer, r: L.r + d * L.rr, sp: L.sp + d * L.ss, sway: L.sw + d * L.sws, fq: 0.3 + rnd() * 0.5, ph: rnd() * 6.2832, a: L.a + d * L.aa }; });
}

// Night: the starfield drifts slowly to the side with nearer stars moving faster; a quarter of the stars hold a steady faint glow, and the rest twinkle in four ways: a slow soft swell, a clear pulse, a quick restless flicker, and one in ten bright stars that breathe a wide halo and show a four point sparkle near the peak of each breath
function paintNight(g, t) {
    g.globalCompositeOperation = "lighter";
    skyStars.forEach(s => {
        const x = ((s.x + t * (3 + s.d * 14)) % (SW + 20) + SW + 20) % (SW + 20) - 10, y = ((s.y + t * (1 + s.d * 4)) % (SH + 20) + SH + 20) % (SH + 20) - 10, w = Math.sin(t * s.tw + s.ph);
        const k = s.kind === "still" ? 0.5 : s.kind === "soft" ? 0.5 + 0.32 * w : s.kind === "pulse" ? 0.5 + 0.5 * w : s.kind === "flicker" ? 0.55 + 0.3 * w + 0.15 * Math.sin(t * s.tw2 + s.ph * 2) : 0.5 + 0.5 * w;
        const a = s.kind === "still" ? s.a : s.a * (0.2 + 0.8 * k * k);
        g.fillStyle = `rgba(${s.tint}, ${a})`; g.beginPath(); g.arc(x, y, s.r * (s.kind === "still" ? 1 : 0.85 + 0.25 * k), 0, 6.2832); g.fill();
        if (s.kind === "still") glowAt(g, x, y, s.r * 3.5, s.tint, a * 0.25);
        else if (s.kind === "bright") {
            glowAt(g, x, y, s.r * (6 + 6 * k), s.tint, a * 0.5);
            if (k > 0.8) { const p = (k - 0.8) / 0.2, len = s.r * (4 + 7 * p); g.strokeStyle = `rgba(${s.tint}, ${0.6 * p})`; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - len, y); g.lineTo(x + len, y); g.moveTo(x, y - len); g.lineTo(x, y + len); g.stroke(); }
        } else if (s.r > 0.9) glowAt(g, x, y, s.r * 4, s.tint, a * 0.3);
    });
    g.globalCompositeOperation = "source-over";
}

// Winter morning: snowflakes falling and swaying side to side at the speed of their layer; middle and near flakes carry a soft glow with a faint cool edge so they stay visible on the pale sky, while far flakes are plain dots to keep the frame light
function paintDay(g, t) {
    skyFlakes.forEach(f => {
        const y = (f.y * (SH + 20) + t * f.sp) % (SH + 20) - 10, x = ((f.x * SW + Math.sin(t * f.fq + f.ph) * f.sway + t * 6) % (SW + 20) + SW + 20) % (SW + 20) - 10;
        if (f.layer) { glowAt(g, x, y, f.r * 2.6, "150, 175, 210", 0.22 * f.a); glowAt(g, x, y, f.r * 1.8, "255, 255, 255", f.a); }
        g.fillStyle = `rgba(255, 255, 255, ${f.a})`; g.beginPath(); g.arc(x, y, f.layer ? f.r * 0.7 : f.r, 0, 6.2832); g.fill();
    });
}

// Paint one frame for the current theme
function paintSky(t) {
    skyCtx.setTransform(sdpr, 0, 0, sdpr, 0, 0); skyCtx.clearRect(0, 0, SW, SH);
    document.documentElement.dataset.theme === "dark" ? paintNight(skyCtx, t) : paintDay(skyCtx, t);
}

// Frame loop at about thirty frames a second that stops while the tab is hidden and never starts under reduced motion
function frameSky(now) {
    skyRunning = false;
    if (document.hidden) return;
    if (now - skyLast >= 33) { skyLast = now; paintSky(now / 1000); }
    skyRunning = true; requestAnimationFrame(frameSky);
}
const startSky = () => { if (skyStill) paintSky(0); else if (!skyRunning) { skyRunning = true; requestAnimationFrame(frameSky); } };
const drawSky = () => { sizeSky(); paintSky(performance.now() / 1000); startSky(); };
drawSky(); addEventListener("resize", drawSky);
document.addEventListener("visibilitychange", () => { if (!document.hidden) startSky(); });
if (matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    addEventListener("pointermove", e => { const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5; document.documentElement.style.setProperty("--px", dx.toFixed(3)); document.documentElement.style.setProperty("--py", dy.toFixed(3)); }, { passive: true });
}

// An empty tap listener on the page tells mobile Chrome the page handles its own taps, so a plain tap on text no longer opens Touch to Search
document.body.addEventListener("click", () => {});