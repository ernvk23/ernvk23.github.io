// Progressive reveal — each char locks in one at a time
(function () {
    // Show emoji immediately
    const emoji = document.querySelector('.emoji-reveal');
    if (emoji) emoji.style.opacity = '1';

    const el = document.querySelector('.glitch-text');
    if (el) el.style.opacity = '1';
    if (!el) return;

    const text = el.textContent;
    const glyphs = '!@#$%^&*_+=~|<>?/\\';

    // Pre-compute initial glitch state (fixed, not changing)
    const glitched = text.split('').map(c => c === ' ' ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)]).join('');

    const duration = 1250;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const revealed = Math.floor(progress * text.length);
        let result = '';
        for (let i = 0; i < text.length; i++) {
            if (i < revealed) {
                result += text[i];
            } else if (i === revealed) {
                result += text[i];
            } else {
                result += glitched[i];
            }
        }
        el.textContent = result;
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = text;
        }
    }

    el.textContent = glitched;
    requestAnimationFrame(tick);
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
