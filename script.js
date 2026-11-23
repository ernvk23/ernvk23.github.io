// Internationalization
(function () {
    const translations = {
        en: {
            title: "Edgar R.N | Software Engineer",
            description: "Automation Engineer bridging embedded systems & backend development. Open-source & Linux enthusiast.",
            greeting: "👋 Aloha, happy you're here :)",
            intro: "I'm Edgar, Automation Engineer bridging embedded systems and backend development. I write code, break hardware, and automate whatever I can. Linux enthusiast, lifelong learner.",
            projectsLabel: "A few open-source projects:",
            projectDyslexia: "Browser extension for dyslexic-friendly reading",
            projectWg: "One script. Your VPN. Your Privacy.",
            projectGrayzen: "Per-app grayscale for Android",
            projectOpenCave: "OpenCode in rootless Podman, scoped to your project folder",
            langSelector: "Language selector"
        },
        es: {
            title: "Edgar R.N | Ingeniero de Software",
            description: "Ingeniero Automático conectando sistemas embebidos y desarrollo backend. Entusiasta del open-source y Linux.",
            greeting: "👋 Aloha, me alegra que estés por aquí :)",
            intro: "Soy Edgar, Ingeniero Automático conectando sistemas embebidos y desarrollo backend. Escribo código, rompo hardware y automatizo todo lo que puedo. Entusiasta de Linux y aprendiz de por vida.",
            projectsLabel: "Algunos proyectos open-source:",
            projectDyslexia: "Extensión de navegador para lectura amigable con la dislexia",
            projectWg: "Un script. Tu VPN. Tu privacidad.",
            projectGrayzen: "Escala de grises por app en Android",
            projectOpenCave: "OpenCode en Podman rootless, limitado a tu carpeta de proyecto",
            langSelector: "Selector de idioma"
        }
    };

    function initGlitch() {
        const oldEl = document.querySelector('.glitch-text');
        if (!oldEl || typeof PowerGlitch === 'undefined') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const newEl = oldEl.cloneNode(true);
        oldEl.parentNode.replaceChild(newEl, oldEl);

        PowerGlitch.glitch(newEl, {
            hideOverflow: true,
            timing: {
                duration: 2000,
                iterations: 2
            },
            glitchTimeSpan: {
                start: 0.3
            },
            shake: {
                amplitudeX: 0.01,
                amplitudeY: 0.03
            },
            slice: {
                count: 3,
                velocity: 10
            }
        });

        // Glitch layers are visual clones; keep screen readers on the real heading.
        newEl.parentElement
            .querySelectorAll('[data-islayer]')
            .forEach(layer => layer.setAttribute('aria-hidden', 'true'));
    }

    function loadFonts() {
        if (!document.fonts || !document.fonts.load) {
            return Promise.resolve();
        }

        const fontsPromise = Promise.all([
            document.fonts.load("400 1em Shantell Sans"),
            document.fonts.load("700 1em Shantell Sans")
        ]).catch(() => { });

        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));
        return Promise.race([fontsPromise, timeoutPromise]);
    }

    function updateContent(lang) {
        const t = translations[lang];
        if (!t) return;

        document.documentElement.lang = lang;
        document.title = t.title;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = t.description;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key] !== undefined) el.textContent = t[key];
        });

        const langSelector = document.querySelector('.lang-switcher');
        if (langSelector && t.langSelector) {
            langSelector.setAttribute('aria-label', t.langSelector);
        }

        document.querySelectorAll('.lang-switcher button').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.lang === lang);
        });
    }

    function setLanguage(lang, animate) {
        if (!translations[lang]) return;

        const main = document.querySelector('main');
        if (!main) return;

        function apply() {
            updateContent(lang);
            initGlitch();
            if (animate) {
                main.classList.remove('content-loading');
                document.documentElement.classList.remove('content-loading');
            }
        }

        if (animate) {
            main.classList.add('content-loading');
            loadFonts().then(apply);
        } else {
            apply();
        }
    }

    function saveLanguagePreference(lang) {
        try {
            localStorage.setItem('preferred-lang', lang);
        } catch (e) {}
    }

    function loadLanguagePreference() {
        try {
            return localStorage.getItem('preferred-lang');
        } catch (e) {
            return null;
        }
    }

    function detectLanguage() {
        const lang = (navigator.language || 'en').toLowerCase();
        return lang.startsWith('es') ? 'es' : 'en';
    }

    function resolveInitialLanguage() {
        const preference = loadLanguagePreference();
        if (preference === 'es' || preference === 'en') {
            return preference;
        }
        return detectLanguage();
    }

    function init() {
        document.querySelectorAll('.lang-switcher button').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang && lang !== document.documentElement.lang) {
                    saveLanguagePreference(lang);
                    setLanguage(lang, true);
                }
            });
        });

        const initialLang = resolveInitialLanguage();
        saveLanguagePreference(initialLang);
        if (initialLang === 'es') {
            setLanguage('es', true);
        } else {
            updateContent('en');
            initGlitch();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Pointer trail — signs left along the path, capped at 3 cm, fading out
(function () {
    const canvas = document.getElementById('pointer-trail');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const GLYPHS = ['{', '}', '<', '>', '/', '\\', '#', ';', ':', '+', '=', '0', '1', 'λ'];
    const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    const LIFE = 700;
    const MAX = 16;
    const STEP = 10;       // spawn every 10 px of travel
    const REACH = 112;     // 3 cm at 96 dpi

    let glyphs = [];
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;
    let lastX = 1e4;
    let lastY = 1e4;
    let frame = 0;
    let trailColor = 'rgba(37, 99, 235, 0.7)';

    function readColor() {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--trail').trim();
        if (value) trailColor = value;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        readColor();
    }

    function spawn(now) {
        glyphs.push({
            x: pointerX + (Math.random() - 0.5) * 16,
            y: pointerY + (Math.random() - 0.5) * 16,
            size: 10 + Math.random() * 4,
            alpha: 0.45 + Math.random() * 0.15,
            born: now,
            glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0]
        });

        if (glyphs.length > MAX) glyphs.splice(0, glyphs.length - MAX);
    }

    function draw(now) {
        frame = 0;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = trailColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const alive = [];

        for (const glyph of glyphs) {
            const age = now - glyph.born;
            if (age >= LIFE) continue;

            const dx = glyph.x - pointerX;
            const dy = glyph.y - pointerY;
            if (dx * dx + dy * dy > REACH * REACH) continue;

            ctx.globalAlpha = glyph.alpha * (1 - age / LIFE);
            ctx.font = `${glyph.size}px ${MONO}`;
            ctx.fillText(glyph.glyph, glyph.x, glyph.y);
            alive.push(glyph);
        }

        ctx.globalAlpha = 1;
        glyphs = alive;

        if (glyphs.length) {
            frame = requestAnimationFrame(draw);
        }
    }

    function start() {
        if (!frame) frame = requestAnimationFrame(draw);
    }

    window.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;

        if (event.target instanceof Element && event.target.closest('.projects, a, button')) {
            if (glyphs.length) {
                glyphs = [];
                start();
            }
            return;
        }

        pointerX = event.clientX;
        pointerY = event.clientY;

        const dx = pointerX - lastX;
        const dy = pointerY - lastY;
        if (dx * dx + dy * dy >= STEP * STEP) {
            lastX = pointerX;
            lastY = pointerY;
            spawn(performance.now());
            start();
        }
    }, { passive: true });

    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (themeQuery.addEventListener) themeQuery.addEventListener('change', readColor);
    else themeQuery.addListener(readColor);

    window.addEventListener('resize', resize);
    resize();
})();

// Ambient code — one faint, looping coding session behind the page
(function () {
    const wrap = document.querySelector('.ambient-code');
    if (!wrap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const LINES = [
        '$ source .venv/bin/activate && python3 -m build --wheel --outdir dist/ && pytest -q && ruff check . && mypy --strict src/',
        '[info] worker ready | queue=0 | workers=4 | uptime=4d 12h | mem=182MB | cpu=0.3% | pid=2048 | env=dev',
        '$ git log --oneline --decorate --graph -8 && git status --short && git diff --stat && git branch --show-current',
        '=> [1/6] FROM alpine:3.20  => [2/6] RUN apk add --no-cache bash curl git  => [3/6] COPY . /workspace  => [6/6] COMMIT opencave',
        '$ ls -1 ~/projects | sort && du -sh ~/projects/* | sort -h && find ~/projects -maxdepth 1 -type d | wc -l',
        '[ok] 24 tests passed in 0.83s | 0 failed | 0 skipped | coverage 94% | cache hit | workers=4 | seed=0x7f3a',
        '$ systemctl --user status podman.socket --no-pager -n 3 && podman ps --format "{{.Names}} {{.Status}}"',
        ">>> main() -> 0 | memory 38.2MB | elapsed 12ms | exit 0 | profile=default | args=['--watch']",
        "$ tail -n 5 /var/log/app.log | grep -E 'info|warn|error' | sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2}//'",
        '[info] 2026-11-23 10:24:01 worker=3 queue=0 latency=12ms status=ok | [warn] retry=1 job=42 | [ok] flush',
        "$ ssh dev@localhost -p 2222 'echo $SHELL && uname -a && uptime' | head -n 3",
        '$ nix develop --command cargo test --quiet --release 2>&1 | tail -n 3 && echo done'
    ];
    const TARGET = 120;
    const lines = [];
    let line = 0;

    while (lines.length < TARGET) {
        lines.push(LINES[line % LINES.length]);
        line++;

        if (line % LINES.length === 0) lines.push('');
    }

    const content = lines.slice(0, TARGET).join('\n');
    const stream = document.createElement('div');
    const pre = document.createElement('pre');

    stream.className = 'ambient-stream';
    pre.textContent = `${content}\n${content}`;
    stream.append(pre);
    wrap.append(stream);
})();
