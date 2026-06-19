// Router simple para SPA
(function() {
    
    // Rutas disponibles
    const routes = {
        '/': '/pages/index.html',
        '/proyectos': '/pages/proyectos.html',
        '/todo_popcorn': '/pages/todo_popcorn.html'
    };
    
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

    // Cargar página
    function loadPage(path) {
        // Normalizar ruta (remover trailing slash)
        let normalizedPath = normalizeRoute(path);
        
        const file = routes[normalizedPath];
        if (!file) return;
        
        fetch(file)
            .then(res => res.text())
            .then(html => {
                // Extraer solo el contenido main
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const newMain = temp.querySelector('main');
                const currentMain = document.querySelector('main');
                
                if (newMain && currentMain) {
                    currentMain.innerHTML = newMain.innerHTML;

                    // Ejecutar scripts incluidos en el HTML cargado (scripts inline o con src)
                    // Al insertar HTML con innerHTML los <script> no se ejecutan, así que los clonamos y los añadimos al body.
                    const scripts = temp.querySelectorAll('script');
                    scripts.forEach(oldScript => {
                        try {
                            // Verificar si el script ya existe para evitar carga duplicada
                            if (oldScript.src) {
                                // Normalizar el src para comparación (convertir relativo a absoluto)
                                const scriptSrc = new URL(oldScript.src, window.location.href).href;
                                const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                                if (existingScript) {
                                    console.log('Script ya existe, evitando carga duplicada:', scriptSrc);
                                    return;
                                }
                            } else {
                                // Para scripts inline, usar un hash del contenido como identificador
                                const scriptContent = oldScript.textContent.trim();
                                const scriptHash = scriptContent.substring(0, 50).replace(/\s+/g, '_');
                                const scriptId = `inline-script-${scriptHash}`;
                                const existingScript = document.querySelector(`script[data-script-id="${scriptId}"]`);
                                if (existingScript) {
                                    console.log('Script inline ya existe, evitando carga duplicada:', scriptId);
                                    return;
                                }
                            }
                            const s = document.createElement('script');
                            if (oldScript.src) {
                                // Usar el src normalizado
                                s.src = new URL(oldScript.src, window.location.href).href;
                                s.async = false;
                            } else {
                                s.textContent = oldScript.textContent;
                                // Agregar identificador único para scripts inline
                                const scriptContent = oldScript.textContent.trim();
                                const scriptHash = scriptContent.substring(0, 50).replace(/\s+/g, '_');
                                s.dataset.scriptId = `inline-script-${scriptHash}`;
                            }
                            s.dataset.routerInjected = '1';
                            document.body.appendChild(s);
                        } catch (e) {
                            console.warn('Error ejecutando script inyectado', e);
                        }
                    });

                    // Llamar a funciones de inicialización expuestas globalmente
                    if (normalizedPath === '/todo_popcorn' && typeof window.initTodoPopcorn === 'function') {
                        window.initTodoPopcorn();
                    }

                    const title = temp.querySelector('title')?.textContent || '27thDeer';
                    document.title = title;
                    
                    // Actualizar la URL usando hash para evitar recargar rutas físicas
                    if (window.location.hash !== '#' + normalizedPath) {
                        window.location.hash = normalizedPath;
                    }
                    
                    // Actualizar navbar activo
                    updateActiveLink(normalizedPath);
                    
                    // Iniciar efectos específicos de la página (ej. typewriter)
                    try { initTypewriter(); } catch (e) { /* no-op */ }
                }
            });
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

        container.innerHTML = '';
        for (let s = 0; s < sentences.length; s++) {
            const sentence = sentences[s].trim();
            const p = document.createElement('span');
            p.className = 'type-line';
            container.appendChild(p);

            p.classList.add('active');
            for (let i = 1; i <= sentence.length; i++) {
                p.textContent = sentence.slice(0, i);
                await sleep(100 + Math.random() * 80); // más lento por carácter (160-240ms)
            }
            p.classList.remove('active');
            await sleep(1500 + Math.random() * 500); // pausa entre frases (1.5-2s)
        }

        // mostrar autor si existe originalmente
        await sleep(3000);
        const authorSpan = document.createElement('span');
        authorSpan.className = 'author';
        authorSpan.textContent = container.dataset.author || '- Crónicas Marcianas, Ray Bradbury';
        container.appendChild(authorSpan);
    }
    
    // Actualizar link activo en navbar
    function updateActiveLink(activePath) {
        // Quitar clase active de todos los links
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al link correspondiente
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === activePath || href === '#' + activePath) {
                link.classList.add('active');
            }
        });
    }
    
    // Inicializar clicks
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.subtle-nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href) return;
                const routePath = href.startsWith('#') ? href.slice(1) : href;
                
                // Solo procesar rutas limpias (empiezan con / o #/)
                if ((href.startsWith('#/') || (href.startsWith('/') && !href.endsWith('.html')))) {
                    e.preventDefault();
                    loadPage(routePath);
                }
            });
        });

        // Cargar la página inicial según el hash o la ruta actual
        loadPage(getCurrentRoute());
    });
    
})();
