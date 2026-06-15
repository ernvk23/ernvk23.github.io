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
            langSelector: "Selector de idioma"
        }
    };

    function initGlitch() {
        const oldEl = document.querySelector('.glitch-text');
        if (!oldEl || typeof PowerGlitch === 'undefined') return;

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

// Particle animation system
(function () {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height, particles;
    let animationId;

    // Cached values for performance
    let cachedParticleColor = '';
    let cachedConnectionColor = '';
    let cachedScreenWidth = 0;
    let cachedScreenHeight = 0;

    const speed = 0.3;
    const CSS_UPDATE_INTERVAL = 1000;

    function updateCssCache() {
        cachedParticleColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--particle-color').trim() || 'rgba(37, 99, 235, 0.4)';
        cachedConnectionColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--particle-connection-color').trim() || 'rgba(37, 99, 235, 0.25)';
    }

    function getParticleSettings() {
        if (cachedScreenWidth < 640) {
            return { count: 30, distance: 120 };
        } else if (cachedScreenWidth < 1024) {
            return { count: 50, distance: 180 };
        }
        return { count: 70, distance: 240 };
    }

    class Particle {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * speed;
            this.vy = (Math.random() - 0.5) * speed;
            this.radius = Math.random() * 3 + 2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = cachedParticleColor;
            ctx.fill();
        }
    }

    function updateScreenSize() {
        cachedScreenWidth = window.innerWidth;
        cachedScreenHeight = window.innerHeight;
        width = canvas.width = cachedScreenWidth;
        height = canvas.height = cachedScreenHeight;
    }

    function resize() {
        updateScreenSize();
        initParticles();
    }

    function initParticles() {
        particles = [];
        const settings = getParticleSettings();
        for (let i = 0; i < settings.count; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const settings = getParticleSettings();
        const distanceSq = settings.distance * settings.distance;

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            p1.update();
            p1.draw();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < distanceSq) {
                    const dist = Math.sqrt(distSq);
                    const opacity = 0.2 * (1 - dist / settings.distance);

                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        animationId = requestAnimationFrame(animate);
    }

    function start() {
        updateScreenSize();
        updateCssCache();
        initParticles();
        animate();
    }

    // Initialize
    updateCssCache();
    setInterval(updateCssCache, CSS_UPDATE_INTERVAL);

    window.addEventListener('resize', resize);
    requestAnimationFrame(start);
})();
