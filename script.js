// Internationalization
(function () {
    const translations = {
        en: {
            title: "Edgar R.N | Software Engineer",
            description: "Automation Engineer bridging embedded systems & backend development. Open-source & Linux enthusiast.",
            greeting: "👋 Aloha, happy you're here :)",
            intro: "I'm Edgar, Automation Engineer bridging embedded systems and backend development. I write code, break hardware, and automate whatever I can. Linux enthusiast, lifelong learner.",
            projectsLabel: "A few open-source projects:",
            minimizeProjects: "Minimize projects",
            expandProjects: "Expand projects",
            projectDyslexia: "Browser extension for dyslexic-friendly reading",
            projectWg: "One script. Your VPN. Your Privacy.",
            projectGrayzen: "Per-app grayscale for Android",
            projectOpenCave: "OpenCode in rootless Podman. Scope your agent.",
            langSelector: "Language selector"
        },
        es: {
            title: "Edgar R.N | Ingeniero de Software",
            description: "Ingeniero Automático conectando sistemas embebidos y desarrollo backend. Entusiasta del open-source y Linux.",
            greeting: "👋 Aloha, me alegra que estés por aquí :)",
            intro: "Soy Edgar, Ingeniero Automático conectando sistemas embebidos y desarrollo backend. Escribo código, rompo hardware y automatizo todo lo que puedo. Entusiasta de Linux y aprendiz de por vida.",
            projectsLabel: "Algunos proyectos open-source:",
            minimizeProjects: "Minimizar proyectos",
            expandProjects: "Expandir proyectos",
            projectDyslexia: "Extensión de navegador para lectura amigable con la dislexia",
            projectWg: "Un script. Tu VPN. Tu privacidad.",
            projectGrayzen: "Escala de grises por app en Android",
            projectOpenCave: "OpenCode en rootless Podman. Limita tu agente.",
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

        const projectsToggle = document.querySelector('.projects-toggle');
        if (projectsToggle) {
            projectsToggle.dataset.labelMinimize = t.minimizeProjects;
            projectsToggle.dataset.labelExpand = t.expandProjects;
            const expanded = projectsToggle.getAttribute('aria-expanded') !== 'false';
            projectsToggle.setAttribute('aria-label', expanded ? t.minimizeProjects : t.expandProjects);
        }
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

// Terminal minimize/expand — always starts expanded
(function () {
    const section = document.querySelector('.projects');
    const panel = document.querySelector('.projects-panel');
    const toggle = document.querySelector('.projects-toggle');
    const body = document.getElementById('projects-body');
    const ambient = document.querySelector('.ambient-code');
    const mobileLayout = window.matchMedia('(pointer: coarse), (max-width: 640px)');
    if (!panel || !toggle || !body) return;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const next = !expanded;

        // On desktop the centered text stays put; on mobile the footer follows the panel up.
        if (!next && section && !mobileLayout.matches) {
            section.style.minHeight = `${section.getBoundingClientRect().height}px`;
        }

        toggle.setAttribute('aria-expanded', String(next));
        toggle.setAttribute('aria-label', next
            ? toggle.dataset.labelMinimize || 'Minimize projects'
            : toggle.dataset.labelExpand || 'Expand projects');

        body.hidden = !next;
        panel.classList.toggle('is-collapsed', !next);
        ambient?.classList.toggle('is-paused', !next);
        document.documentElement.classList.toggle('terminal-minimized', !next);
        document.dispatchEvent(new CustomEvent('terminaltoggle'));

        if (next && section) section.style.minHeight = '';
    });
})();

// Pointer trail — signs left along the path, or a tap burst on touch
(function () {
    const canvas = document.getElementById('pointer-trail');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ERROR_GLYPHS = ['404', '500', '502', '503', '5xx', 'ERR', 'EACCES', 'ENOENT', '×', '!'];
    const isMinimized = () => document.documentElement.classList.contains('terminal-minimized');
    const SANS = "'Shantell Sans', system-ui, sans-serif";
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
    let errorColor = 'rgba(220, 38, 38, 0.7)';

    function readColor() {
        const error = getComputedStyle(document.documentElement)
            .getPropertyValue('--trail-error').trim();
        if (error) errorColor = error;
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
            glyph: ERROR_GLYPHS[(Math.random() * ERROR_GLYPHS.length) | 0]
        });

        if (glyphs.length > MAX) glyphs.splice(0, glyphs.length - MAX);
    }

    function draw(now) {
        frame = 0;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = errorColor;
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
            ctx.font = `${glyph.size}px ${SANS}`;
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
        if (!isMinimized()) return;

        const target = event.target;
        if (target instanceof Element && target.closest('a, button, .projects-bar, .section-label')) {
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

    let tapX = 0;
    let tapY = 0;

    window.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' || !event.isPrimary) return;
        tapX = event.clientX;
        tapY = event.clientY;
    }, { passive: true });

    window.addEventListener('pointerup', event => {
        if (event.pointerType !== 'touch' || !event.isPrimary) return;
        if (!isMinimized()) return;

        const dx = event.clientX - tapX;
        const dy = event.clientY - tapY;
        if (dx * dx + dy * dy > 12 * 12) return; // dragged or scrolled, not a tap

        const target = event.target;
        if (target instanceof Element && target.closest('a, button, .projects-bar, .section-label')) return;

        // A few signs just above the finger, where the tap does not cover them.
        for (let i = 0; i < 3; i++) {
            pointerX = event.clientX + (Math.random() - 0.5) * 24;
            pointerY = event.clientY - 18 + (Math.random() - 0.5) * 12;
            spawn(performance.now());
        }
        lastX = pointerX;
        lastY = pointerY;
        start();
    }, { passive: true });

    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (themeQuery.addEventListener) themeQuery.addEventListener('change', readColor);
    else themeQuery.addListener(readColor);

    document.addEventListener('terminaltoggle', () => {
        if (!glyphs.length) return;
        glyphs = [];
        start();
    });

    window.addEventListener('resize', resize);
    resize();
})();

// Ambient code — a static, looping coding session behind the page
(function () {
    const wrap = document.querySelector('.ambient-code');
    if (!wrap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Static fake output. Nothing here is read from the machine.
    const BASE = [
        '$ source .venv/bin/activate && python3 -m build --wheel --outdir dist/ && pytest -q && ruff check . && mypy --strict src/',
        '[info] worker ready | queue=0 | workers=4 | uptime=4d 12h | mem=182MB | cpu=0.3% | pid=2048 | env=dev',
        '$ git log --oneline --decorate --graph -8 && git status --short && git diff --stat && git branch --show-current',
        '=> [1/6] FROM alpine:3.20  => [2/6] RUN apk add --no-cache bash curl git  => [3/6] COPY . /workspace  => [6/6] COMMIT opencave',
        '$ ls -1 ~/projects | sort && du -sh ~/projects/* | sort -h && find ~/projects -maxdepth 1 -type d | wc -l',
        '[ok] 24 tests passed in 0.83s | 0 failed | 0 skipped | coverage 94% | cache hit | workers=4',
        '$ systemctl --user status podman.socket --no-pager -n 3 && podman ps --format "{{.Names}} {{.Status}}"',
        ">>> main() -> 0 | memory 38.2MB | elapsed 12ms | exit 0 | profile=default | args=['--watch']",
        "$ tail -n 5 /var/log/app.log | grep -E 'info|warn|error' | sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2}//'",
        '[info] 2026-11-23 10:24:01 worker=3 queue=0 latency=12ms status=ok | [warn] retry=1 job=42 | [ok] flush',
        "$ ssh dev@localhost -p 2222 'echo $SHELL && uname -a && uptime' | head -n 3",
        '$ nix develop --command cargo test --quiet --release 2>&1 | tail -n 3 && echo done',
        '$ kubectl get pods -A --no-headers | wc -l && kubectl top nodes --no-headers | sort -k2 -h',
        '[ok] source map generated | modules=128 | chunks=6 | gzip=84KB | time=1.2s',
        '$ journalctl --user -u app.service -n 4 --no-pager | tail -n 4',
        '[info] healthcheck ok | db=12ms | cache=0.8ms | queue=0 | errors=0',
        '$ grep -R "TODO" -n src/ | head -n 3 && wc -l src/**/*.py',
        '$ docker compose up -d --build && docker compose ps --format "table {{.Name}}\t{{.Status}}"',
        '[warn] disk usage 72% | clean cache? | freed 1.4GB | path=/var/cache',
        '$ openssl rand -hex 8 && date -u +"%Y-%m-%dT%H:%M:%SZ"',
        '$ tmux new -d -s dev && tmux ls && tmux capture-pane -p -t dev | tail -n 2',
        '[info] lint cache hit | 148 files | 0 errors | 3 warnings | elapsed=240ms',
        '$ git fetch --all --prune && git branch -vv | head -n 4',
        '$ curl -sS -o /dev/null -w "%{http_code} %{time_total}s\n" https://example.com/health'
    ];
    const LINES = [];

    // Four lightly-numbered passes give roughly two screens before the loop repeats.
    for (let pass = 0; pass < 4; pass++) {
        for (const line of BASE) {
            LINES.push(line.replace(/\d+(?:\.\d+)?/g, match => {
                const value = Number(match);
                if (!Number.isFinite(value)) return match;
                const decimals = (match.split('.')[1] || '').length;
                return (value + pass * (decimals ? 0.07 : 3)).toFixed(decimals);
            }));
        }
    }

    const content = LINES.join('\n');
    const stream = document.createElement('div');
    const pre = document.createElement('pre');

    stream.className = 'ambient-stream';
    pre.textContent = `${content}\n${content}`;
    stream.append(pre);
    wrap.append(stream);

    // Keep the scroll speed constant when wrapping changes the block height.
    const speed = 9.6;
    const fitSpeed = () => {
        const height = pre.getBoundingClientRect().height / 2;
        if (height > 0) stream.style.setProperty('--ambient-duration', `${height / speed}s`);
    };

    fitSpeed();
    window.addEventListener('resize', fitSpeed);
})();
