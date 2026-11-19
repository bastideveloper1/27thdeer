// Router simple para SPA
(function() {
    
    // CSS is render-blocking in index.html; scripts and data are ready before
    // replacing the current section, so there is only one complete first frame.
    const routes = {
        '/': { page: '/pages/index.html' },
        '/proyectos': { page: '/pages/proyectos.html', script: '/js/trayectoria.js', init: 'initTrayectoria', data: '/data/timeline.json' },
        '/todo_popcorn': { page: '/pages/todo_popcorn.html', script: '/js/todo_popcorn_traditional.js', init: 'initTodoPopcorn' }
    };
    const scripts = new Map();
    let navigation = 0;

    async function readResource(url, json = false) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo cargar la sección.');
        return json ? response.json() : response.text();
    }

    function loadScript(src) {
        if (!scripts.has(src)) {
            const promise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => { script.remove(); reject(new Error('No se pudo cargar la sección.')); };
                document.head.append(script);
            });
            scripts.set(src, promise);
            promise.catch(() => scripts.delete(src));
        }
        return scripts.get(src);
    }

    function normalizeRoute(path) {
        if (!path) return '/';
        const normalized = path.replace(/^#/, '').replace(/\/$/, '') || '/';
        return normalized;
    }

    function getCurrentRoute() {
        if (window.location.hash) {
            return normalizeRoute(window.location.hash.slice(1));
        }
        return normalizeRoute(window.location.pathname);
    }

    async function loadPage(path) {
        const normalizedPath = normalizeRoute(path);
        const route = routes[normalizedPath];
        const current = ++navigation;
        if (!route) { window.location.hash = '/'; return; }
        updateActiveLink(normalizedPath);
        document.getElementById('navigation-error')?.remove();
        try {
            const [html, data] = await Promise.all([
                readResource(route.page),
                route.data ? readResource(route.data, true) : undefined,
                route.script ? loadScript(route.script) : undefined
            ]);
            if (current !== navigation) return;
            const template = document.createElement('template');
            template.innerHTML = html;
            const content = template.content.querySelector('main');
            if (!content) throw new Error('No se pudo cargar la sección.');
            document.querySelector('main').replaceChildren(...content.childNodes);
            // Both initializers render synchronously when their data is ready.
            if (route.init) window[route.init](data);
            initTypewriter();
            document.title = '27thDeer';
        } catch (_) {
            if (current !== navigation) return;
            const error = document.createElement('p');
            error.id = 'navigation-error';
            error.setAttribute('role', 'alert');
            error.textContent = 'No se pudo cargar la sección. Pulsa su enlace para reintentar.';
            document.querySelector('main').before(error);
        }
    }

    // Exponer utilidades globales para que los index.html de las subcarpetas puedan usarlas
    window.loadPage = loadPage;
    window.getCurrentRoute = getCurrentRoute;

    window.addEventListener('hashchange', function() {
        loadPage(getCurrentRoute());
    });

    // Typewriter initializer: si existe elemento con id 'homeTypewriter', lo escribe por líneas
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function initTypewriter() {
        const container = document.getElementById('homeTypewriter');
        if (!container) return;

        // Si ya fue inicializado, evitar reiniciar
        if (container.dataset.initiated === '1') return;
        container.dataset.initiated = '1';

        const raw = Array.from(container.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        // separar en frases por puntuación (manteniendo el signo)
        const sentences = raw.match(/[^.!?]+[.!?]*/g) || [raw];

        container.replaceChildren();
        // Full text defines the responsive geometry. Only the existing writing
        // effect is painted on top; adding characters never changes layout.
        const lines = sentences.map(sentence => {
            const line = document.createElement('span');
            line.className = 'type-line';
            const reserve = document.createElement('span');
            reserve.className = 'type-line-reserve';
            reserve.textContent = sentence.trim();
            const typed = document.createElement('span');
            typed.className = 'type-line-typed';
            typed.setAttribute('aria-hidden', 'true');
            line.append(reserve, typed);
            container.append(line);
            return { line, typed, text: reserve.textContent };
        });
        const author = document.createElement('span');
        author.className = 'author type-author-pending';
        author.textContent = container.dataset.author || '- Crónicas Marcianas, Ray Bradbury';
        container.append(author);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        for (const { line, typed, text } of lines) {
            if (!container.isConnected) return;
            line.classList.add('active');
            for (let i = 1; i <= text.length; i++) {
                if (!container.isConnected) return;
                typed.textContent = text.slice(0, i);
                if (!reducedMotion) await sleep(100 + Math.random() * 80);
            }
            line.classList.remove('active');
            if (!reducedMotion) await sleep(1500 + Math.random() * 500);
        }
        if (!reducedMotion) await sleep(3000);
        author.classList.remove('type-author-pending');
    }

    // Actualizar link activo en navbar
    function updateActiveLink(activePath) {
        // Quitar clase active de todos los links
        document.querySelectorAll('.subtle-nav a, .trajectory-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al link correspondiente
        document.querySelectorAll('.subtle-nav a, .trajectory-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === activePath || href === '#' + activePath) {
                link.classList.add('active');
            }
        });
    }
    
    // Inicializar clicks
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.subtle-nav a, .trajectory-link').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href) return;
                const routePath = href.startsWith('#') ? href.slice(1) : href;
                
                // Solo procesar rutas limpias (empiezan con / o #/)
                if ((href.startsWith('#/') || (href.startsWith('/') && !href.endsWith('.html')))) {
                    e.preventDefault();
                    const normalized = normalizeRoute(routePath);
                    if (window.location.hash === '#' + normalized) {
                        if (document.getElementById('navigation-error')) loadPage(normalized);
                    } else window.location.hash = normalized;
                }
            });
        });

        // Cargar la página inicial según el hash o la ruta actual
        const initial = getCurrentRoute();
        history.replaceState(null, '', '#' + initial);
        loadPage(initial);
    });
    
})();
