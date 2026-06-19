(function() {
// Configuración centralizada
const todoPopcornConfig = {
    tmdb: {
        apiKey: 'df600a328fa6b72a4d012a0ef3ab14a6',
        imageBase: 'https://image.tmdb.org/t/p/w300',
        baseURL: 'https://api.themoviedb.org/3',
        language: 'es-ES'
    },
    storage: {
        prefix: 'todoPopcorn_',
        keys: {
            options: 'options'
        }
    }
};

// Utilidades para operaciones del DOM
const DOMUtils = {
    getElement(id) {
        return document.getElementById(id);
    },
    getElements(selector) {
        return document.querySelectorAll(selector);
    },
    addClass(element, className) {
        if (element) element.classList.add(className);
    },
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },
    toggleClass(element, className, force) {
        if (element) element.classList.toggle(className, force);
    },
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    },
    setText(element, text) {
        if (element) element.textContent = text;
    },
    setHTML(element, html) {
        if (element) element.innerHTML = html;
    },
    setValue(element, value) {
        if (element) element.value = value;
    },
    getValue(element) {
        return element ? element.value : null;
    },
    addEventListener(element, event, handler, options) {
        if (element) element.addEventListener(event, handler, options);
    },
    show(element, display = 'block') {
        if (element) element.style.display = display;
    },
    hide(element) {
        if (element) element.style.display = 'none';
    },
    clearChildren(element) {
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    },
    appendChild(parent, child) {
        if (parent && child) parent.appendChild(child);
    }
};

// Funciones helper para el loader global
function showGlobalLoader() {
    const loader = DOMUtils.getElement('globalLoader');
    if (loader) loader.style.display = 'flex';
}

function hideGlobalLoader() {
    const loader = DOMUtils.getElement('globalLoader');
    if (loader) loader.style.display = 'none';
}

// Utilidades de formato
const FormatUtils = {
    formatTitle(title, year, format) {
        if (format === '1') {
            return `${title}${year ? ' (' + year + ')' : ''}`;
        } else if (format === '2') {
            return `${year ? '[' + year + '] ' : ''}${title}`;
        } else if (format === '3') {
            return `${year ? year + ' · ' : ''}${title}`;
        }
        return title;
    },
    formatSeasonEpisode(season, episode) {
        const s = season < 10 ? '0' + season : season;
        const e = episode < 10 ? '0' + episode : episode;
        return `T${s}|E${e}`;
    },
    formatEpisode(season, episode, name, format) {
        const seCode = season != null ? this.formatSeasonEpisode(season, episode) : '';
        if (format === '1') {
            return seCode + (seCode && name ? ' - ' : '') + name;
        } else {
            return name + (name && seCode ? ' - ' : '') + seCode;
        }
    },
    formatDate(date) {
        return date ? ` (${date})` : '';
    },
    formatRating(rating) {
        return rating ? ` ⭐${rating.toFixed(1)} / 10` : '';
    },
    formatCreator(director) {
        return director ? ` | Creador: ${director}` : '';
    },
    formatGenre(genre) {
        return genre ? ` | ${genre}` : '';
    },
    formatEpisodeDirector(director) {
        return director ? ` | Dir: ${director}` : '';
    }
};

// Servicio para LocalStorage
class StorageService {
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Error guardando en localStorage:', e);
        }
    }

    load(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.warn('Error cargando de localStorage:', e);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Error eliminando de localStorage:', e);
        }
    }
};

// Componente para manejar la vista previa en tiempo real
window.PreviewComponent = window.PreviewComponent || class PreviewComponent {
    constructor(previewElement) {
        this.previewElement = previewElement;
    }

    update(options) {
        const {
            isTV,
            includeSE,
            includeName,
            includeDate,
            includeRating,
            includeDirector,
            includeGenre,
            includeEpisodeDirector,
            useEvolution,
            emoji,
            format,
            titleFormat
        } = options;

        let previewText = '';

        if (isTV) {
            const year = '2023';
            let titleText = FormatUtils.formatTitle('Goosebumps', year, titleFormat);

            if (includeRating) {
                titleText += FormatUtils.formatRating(8.5);
            }
            if (includeDirector) {
                titleText += FormatUtils.formatCreator('Director Nombre');
            }
            if (includeGenre) {
                titleText += FormatUtils.formatGenre('Género');
            }
            previewText = titleText + '\n';

            if (includeSE && includeName) {
                let ep1 = FormatUtils.formatEpisode(1, 1, 'Primer episodio', format);
                let ep2 = FormatUtils.formatEpisode(1, 2, 'Segundo episodio', format);

                if (includeDate) {
                    ep1 += FormatUtils.formatDate('2023-10-25');
                    ep2 += FormatUtils.formatDate('2023-10-25');
                }
                if (includeEpisodeDirector) {
                    ep1 += FormatUtils.formatEpisodeDirector('Director Nombre');
                    ep2 += FormatUtils.formatEpisodeDirector('Director Nombre');
                }
                if (emoji) {
                    ep1 = `${emoji} ${ep1}`;
                    ep2 = `${emoji} ${ep2}`;
                }
                if (useEvolution) {
                    ep1 = `🍿 ${ep1}`;
                }

                previewText += ep1 + '\n' + ep2;
            } else if (includeSE) {
                let ep1 = FormatUtils.formatSeasonEpisode(1, 1);
                let ep2 = FormatUtils.formatSeasonEpisode(1, 2);
                if (includeDate) {
                    ep1 += FormatUtils.formatDate('2023-10-25');
                    ep2 += FormatUtils.formatDate('2023-10-25');
                }
                if (includeEpisodeDirector) {
                    ep1 += FormatUtils.formatEpisodeDirector('Director Nombre');
                    ep2 += FormatUtils.formatEpisodeDirector('Director Nombre');
                }
                if (emoji) {
                    ep1 = `${emoji} ${ep1}`;
                    ep2 = `${emoji} ${ep2}`;
                }
                if (useEvolution) {
                    ep1 = `🍿 ${ep1}`;
                }
                previewText += ep1 + '\n' + ep2;
            } else if (includeName) {
                let ep1 = 'Primer episodio';
                let ep2 = 'Segundo episodio';
                if (includeDate) {
                    ep1 += FormatUtils.formatDate('2023-10-25');
                    ep2 += FormatUtils.formatDate('2023-10-25');
                }
                if (includeEpisodeDirector) {
                    ep1 += FormatUtils.formatEpisodeDirector('Director Nombre');
                    ep2 += FormatUtils.formatEpisodeDirector('Director Nombre');
                }
                if (emoji) {
                    ep1 = `${emoji} ${ep1}`;
                    ep2 = `${emoji} ${ep2}`;
                }
                if (useEvolution) {
                    ep1 = `🍿 ${ep1}`;
                }
                previewText += ep1 + '\n' + ep2;
            } else {
                previewText += '(Selecciona al menos "Incluir Temporada/Episodio" o "Incluir Nombre del episodio")';
            }
        } else {
            const year = '2023';
            let formattedTitle = FormatUtils.formatTitle('Título', year, titleFormat);

            previewText = formattedTitle;

            if (includeRating) {
                previewText += FormatUtils.formatRating(8.5);
            }
            if (includeDirector) {
                previewText += FormatUtils.formatCreator('Director Nombre');
            }
            if (includeGenre) {
                previewText += FormatUtils.formatGenre('Género');
            }
            if (includeDate) {
                previewText += FormatUtils.formatDate('2023-10-25');
            }
            if (emoji) {
                previewText = `${emoji} ${previewText}`;
            }
        }

        this.previewElement.textContent = previewText;
        this.previewElement.classList.remove('preview-placeholder');
    }
};

// Componente para manejar modales
window.ModalComponent = window.ModalComponent || class ModalComponent {
    constructor(modal, messageElement, closeButton) {
        this.modal = modal;
        this.messageElement = messageElement;
        this.closeButton = closeButton;
    }

    show(message) {
        if (this.messageElement) {
            this.messageElement.textContent = message;
        }
        if (this.modal) {
            this.modal.classList.add('visible');
        }
    }

    hide() {
        if (this.modal) {
            this.modal.classList.remove('visible');
        }
    }

    setupEventListeners() {
        if (this.closeButton) {
            DOMUtils.addEventListener(this.closeButton, 'click', () => this.hide());
        }
        if (this.modal) {
            DOMUtils.addEventListener(this.modal, 'click', (event) => {
                if (event.target === this.modal) this.hide();
            });
        }
    }
}

// Servicio para interactuar con la API de TMDB
class TMDBService {
    constructor() {
        this.apiKey = todoPopcornConfig.tmdb.apiKey;
        this.baseURL = todoPopcornConfig.tmdb.baseURL;
        this.imageBase = todoPopcornConfig.tmdb.imageBase;
        this.language = todoPopcornConfig.tmdb.language;
    }

    async searchMulti(query) {
        const url = `${this.baseURL}/search/multi?api_key=${this.apiKey}&language=${this.language}&query=${encodeURIComponent(query)}&include_adult=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error en la búsqueda: ' + res.status);
        const data = await res.json();
        return data.results || [];
    }

    async getTVDetails(id) {
        const url = `${this.baseURL}/tv/${id}?api_key=${this.apiKey}&language=${this.language}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener detalles de TV: ' + res.status);
        return await res.json();
    }

    async getTVCredits(id) {
        const url = `${this.baseURL}/tv/${id}/credits?api_key=${this.apiKey}&language=${this.language}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener créditos de TV: ' + res.status);
        return await res.json();
    }

    async getSeasonDetails(tvId, seasonNum) {
        const url = `${this.baseURL}/tv/${tvId}/season/${seasonNum}?api_key=${this.apiKey}&language=${this.language}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener temporada: ' + res.status);
        return await res.json();
    }

    async getEpisodeCredits(tvId, seasonNum, episodeNum) {
        const url = `${this.baseURL}/tv/${tvId}/season/${seasonNum}/episode/${episodeNum}/credits?api_key=${this.apiKey}&language=${this.language}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener créditos de episodio: ' + res.status);
        return await res.json();
    }

    async getMovieDetails(id) {
        const url = `${this.baseURL}/movie/${id}?api_key=${this.apiKey}&language=${this.language}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener detalles de película: ' + res.status);
        return await res.json();
    }

    async getMovieCredits(id) {
        const url = `${this.baseURL}/movie/${id}/credits?api_key=${this.apiKey}&language=${this.language}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener créditos de película: ' + res.status);
        return await res.json();
    }

    async getTVCreator(id) {
        try {
            const tv = await this.getTVDetails(id);
            if (tv.created_by && tv.created_by.length > 0) {
                return tv.created_by.map(c => c.name).join(', ');
            }
            // Fallback: si no hay created_by, buscar en créditos
            const credits = await this.getTVCredits(id);
            const creators = credits.crew?.filter(c => c.job === 'Creator') || [];
            const executiveProducers = credits.crew?.filter(c => c.job === 'Executive Producer') || [];
            return creators.length > 0 ? creators.map(c => c.name).join(', ') :
                   executiveProducers.length > 0 ? executiveProducers.map(c => c.name).join(', ') : '';
        } catch (e) {
            console.warn('Error al obtener creador de TV:', e);
            return '';
        }
    }

    async getTVGenres(id) {
        try {
            const tv = await this.getTVDetails(id);
            if (tv.genres && tv.genres.length > 0) {
                return tv.genres.map(g => g.name).join(', ');
            } else {
                return '';
            }
        } catch (e) {
            console.warn('Error al obtener géneros de TV:', e);
            return '';
        }
    }

    async getEpisodeDirector(tvId, seasonNum, episodeNum) {
        try {
            const credits = await this.getEpisodeCredits(tvId, seasonNum, episodeNum);
            const directors = credits.crew?.filter(c => c.job === 'Director') || [];
            return directors.length > 0 ? directors.map(d => d.name).join(', ') : '';
        } catch (e) {
            console.warn('Error al obtener director de episodio:', e);
            return '';
        }
    }

    async getMovieCreator(id) {
        try {
            const credits = await this.getMovieCredits(id);
            const creators = credits.crew?.filter(c => c.job === 'Creator') || [];
            const directors = credits.crew?.filter(c => c.job === 'Director') || [];
            return creators.length > 0 ? creators.map(c => c.name).join(', ') : 
                   directors.length > 0 ? directors.map(d => d.name).join(', ') : '';
        } catch (e) {
            console.warn('Error al obtener creador de película:', e);
            return '';
        }
    }

    async getMovieGenres(id) {
        try {
            const movie = await this.getMovieDetails(id);
            if (movie.genres && movie.genres.length > 0) {
                return movie.genres.map(g => g.name).join(', ');
            } else {
                return '';
            }
        } catch (e) {
            console.warn('Error al obtener géneros de película:', e);
            return '';
        }
    }

    getImageURL(path) {
        return path ? `${this.imageBase}${path}` : '';
    }
};

// Orquestador principal
class TodoPopcornApp {
    constructor() {
        console.log('Inicializando TodoPopcornApp...');
        try {
            this.tmdbService = new TMDBService();
            this.storageService = new StorageService();
            console.log('Servicios inicializados');
        } catch (error) {
            console.error('Error al inicializar servicios:', error);
            throw error;
        }
        
        this.selectedItem = null;
        this.selectedCard = null;
        this.selectedKey = null;
        this.episodesList = [];
        this.selectedMovies = [];
        this.selectedMoviesPage = 0;
        this.currentMode = 'multi-movies';
        this.lastGeneratedOutput = null;
        this.MOVIES_PER_PAGE = 5;
        
        this.tutorialCards = [
            '¡Bienvenido a ToDo Popcorn! Datos desde <a href="https://www.themoviedb.org/" target="_blank" class="tmdb-link">TMDB</a>. Genera listas para copiar en Microsoft To Do.',
            'Cada película, serie o episodio va en una línea. Al pegar en To Do, cada línea puede convertirse en una tarea o subtarea independiente.',
            'Elige el modo: «Buscar series y películas» (varios títulos) o «Buscar una serie y sus episodios» (una serie con todos sus capítulos).',
            'Modo títulos: selecciona uno o más resultados, pulsa Generar y pega la lista en «add a task». Cada línea será una tarea.',
            'Modo serie: selecciona una serie, pulsa Generar. Pega el nombre como tarea principal y los episodios en «add step» dentro de esa tarea.',
            'En «Opciones de salida» defines qué incluir: temporada/episodio, nombre del capítulo, fecha de emisión (series) o puntuación TMDB (títulos). Configura antes de buscar.',
            'Episodios: Formato 1 (T01|E01 - Nombre) o Formato 2 (Nombre - T01|E01). Opcional: emoji o texto (máx. 5 caracteres) delante de cada línea.',
            '«Emoji en inicio temporada» (solo series): 🍿 marca el primer capítulo de cada temporada.',
            'Busca el contenido, selecciona resultados, pulsa Generar y copia el texto del modal para pegarlo en Microsoft To Do.',
            'Comprueba que cada episodio quede como subtarea aparte. Recomendamos la app de escritorio; en móvil a veces varias líneas se pegan como una sola tarea.'
        ];
        this.tutorialIndex = 0;
        
        this.initialize();
    }

    initialize() {
        console.log('Inicializando componentes...');
        try {
            this.initializeComponents();
            console.log('Componentes inicializados');
            this.initializeEventListeners();
            console.log('Event listeners inicializados');
            this.renderTutorialCard();
            console.log('Tutorial renderizado');
            this.updateModeUI();
            console.log('Modo UI actualizado');
            this.loadSavedOptions();
            console.log('Opciones cargadas');
            console.log('Inicialización completada');
        } catch (error) {
            console.error('Error durante la inicialización:', error);
            throw error;
        }
    }

    initializeComponents() {
        const previewElement = DOMUtils.getElement('previewContent');
        this.previewComponent = new PreviewComponent(previewElement);
        
        const alertModal = DOMUtils.getElement('alertModal');
        const alertMessage = DOMUtils.getElement('alertMessage');
        const alertCloseBtn = DOMUtils.getElement('alertCloseBtn');
        this.alertModal = new ModalComponent(alertModal, alertMessage, alertCloseBtn);
        this.alertModal.setupEventListeners();
    }

    initializeEventListeners() {
        const allCheckboxes = DOMUtils.getElements('.option-row input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            DOMUtils.addEventListener(checkbox, 'change', () => this.handleOptionChange());
        });

        const formatBtns = DOMUtils.getElements('.format-btn');
        formatBtns.forEach(btn => {
            DOMUtils.addEventListener(btn, 'click', () => this.handleFormatClick(btn));
        });

        const titleFormatBtns = DOMUtils.getElements('.title-format-btn');
        titleFormatBtns.forEach(btn => {
            DOMUtils.addEventListener(btn, 'click', () => this.handleTitleFormatClick(btn));
        });

        const languageBtns = DOMUtils.getElements('.language-btn');
        languageBtns.forEach(btn => {
            DOMUtils.addEventListener(btn, 'click', () => this.handleLanguageClick(btn));
        });

        const modeBtns = DOMUtils.getElements('.mode-btn');
        modeBtns.forEach(btn => {
            DOMUtils.addEventListener(btn, 'click', () => this.handleModeClick(btn));
        });

        const emojiInput = DOMUtils.getElement('emojiInput');
        if (emojiInput) {
            DOMUtils.addEventListener(emojiInput, 'input', () => this.handleOptionChange());
        }

        const searchBtn = DOMUtils.getElement('searchBtn');
        const searchInput = DOMUtils.getElement('searchInput');
        if (searchBtn) {
            DOMUtils.addEventListener(searchBtn, 'click', () => this.doSearch());
        }
        if (searchInput) {
            DOMUtils.addEventListener(searchInput, 'keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.doSearch(); } });
            DOMUtils.addEventListener(searchInput, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.doSearch(); } });
        }

        const emojiToggle = DOMUtils.getElement('emojiToggle');
        const emojiList = DOMUtils.getElement('emojiList');
        if (emojiToggle && emojiList) {
            DOMUtils.addEventListener(emojiToggle, 'click', () => emojiList.classList.toggle('visible'));
            emojiList.querySelectorAll('button').forEach(button => {
                DOMUtils.addEventListener(button, 'click', () => {
                    if (emojiInput) {
                        emojiInput.value = button.textContent.trim();
                    }
                    emojiList.classList.remove('visible');
                });
            });

            document.addEventListener('click', (event) => {
                if (!emojiToggle.contains(event.target) && !emojiList.contains(event.target)) {
                    emojiList.classList.remove('visible');
                }
            });
        }

        const optEvolvingEmoji = DOMUtils.getElement('optEvolvingEmoji');
        if (optEvolvingEmoji && emojiInput && emojiToggle) {
            DOMUtils.addEventListener(optEvolvingEmoji, 'change', () => {
                const disabled = optEvolvingEmoji.checked;
                emojiInput.disabled = disabled;
                emojiToggle.disabled = disabled;
            });
            // Asegurar que el input de emoji no esté deshabilitado por defecto
            emojiInput.disabled = optEvolvingEmoji.checked;
            emojiToggle.disabled = optEvolvingEmoji.checked;
        }

        const closeOutputModal = DOMUtils.getElement('closeOutputModal');
        const outputModal = DOMUtils.getElement('outputModal');
        if (closeOutputModal) {
            DOMUtils.addEventListener(closeOutputModal, 'click', () => outputModal.classList.remove('visible'));
        }
        if (outputModal) {
            DOMUtils.addEventListener(outputModal, 'click', (event) => {
                if (event.target === outputModal) outputModal.classList.remove('visible');
            });
        }

        const viewPreviousBtn = DOMUtils.getElement('viewPreviousBtn');
        if (viewPreviousBtn) {
            DOMUtils.addEventListener(viewPreviousBtn, 'click', () => this.viewPreviousOutput());
        }

        const clearSearchBtn = DOMUtils.getElement('clearSearchBtn');
        if (clearSearchBtn) {
            DOMUtils.addEventListener(clearSearchBtn, 'click', () => this.clearSearch());
        }

        const generateBtn = DOMUtils.getElement('generateBtn');
        if (generateBtn) {
            DOMUtils.addEventListener(generateBtn, 'click', () => this.generateOutput());
        }

        const copyMainBtn = DOMUtils.getElement('copyMain');
        const copySubsBtn = DOMUtils.getElement('copySubs');
        const mainTaskModal = DOMUtils.getElement('mainTaskModal');
        const subtasksModal = DOMUtils.getElement('subtasksModal');
        if (copyMainBtn && mainTaskModal) {
            DOMUtils.addEventListener(copyMainBtn, 'click', () => this.copyAndReset(mainTaskModal, 'Tarea copiada'));
        }
        if (copySubsBtn && subtasksModal) {
            DOMUtils.addEventListener(copySubsBtn, 'click', () => this.copyAndReset(subtasksModal, 'Subtareas copiadas'));
        }

        const tutorialPrev = DOMUtils.getElement('tutorialPrev');
        const tutorialNext = DOMUtils.getElement('tutorialNext');
        if (tutorialPrev) {
            DOMUtils.addEventListener(tutorialPrev, 'click', () => this.goTutorial(-1));
        }
        if (tutorialNext) {
            DOMUtils.addEventListener(tutorialNext, 'click', () => this.goTutorial(1));
        }
    }

    handleOptionChange() {
        this.updatePreview();
        this.saveOptions();
    }

    handleFormatClick(btn) {
        const formatBtns = DOMUtils.getElements('.format-btn');
        formatBtns.forEach(b => DOMUtils.removeClass(b, 'active'));
        DOMUtils.addClass(btn, 'active');
        this.updatePreview();
        this.saveOptions();
    }

    handleTitleFormatClick(btn) {
        const titleFormatBtns = DOMUtils.getElements('.title-format-btn');
        titleFormatBtns.forEach(b => DOMUtils.removeClass(b, 'active'));
        DOMUtils.addClass(btn, 'active');
        this.updatePreview();
        this.saveOptions();
    }

    handleLanguageClick(btn) {
        const languageBtns = DOMUtils.getElements('.language-btn');
        languageBtns.forEach(b => DOMUtils.removeClass(b, 'active'));
        DOMUtils.addClass(btn, 'active');
        
        const newLanguage = btn.dataset.language;
        this.tmdbService.language = newLanguage;
        
        this.saveOptions();
        
        // Si hay resultados visibles, volver a ejecutar doSearch() para refrescar con el nuevo idioma
        const searchInput = DOMUtils.getElement('searchInput');
        const resultsEl = DOMUtils.getElement('results');
        if (searchInput && searchInput.value.trim() && resultsEl && resultsEl.children.length > 0) {
            this.doSearch();
        }
    }

    handleModeClick(btn) {
        const modeBtns = DOMUtils.getElements('.mode-btn');
        modeBtns.forEach(b => DOMUtils.removeClass(b, 'active'));
        DOMUtils.addClass(btn, 'active');
        this.currentMode = btn.dataset.mode;
        this.updateModeUI();
        this.updatePreview();
        this.saveOptions();
    }

    updateModeUI() {
        const isTV = this.currentMode === 'tv';
        const isMulti = this.currentMode === 'multi-movies';
        
        const tvOnlyOptions = ['optSeasonEpisode', 'optEpisodeName', 'optAirDate', 'optEvolvingEmoji', 'optIncludeEpisodeDirector'];
        tvOnlyOptions.forEach(id => {
            const opt = DOMUtils.getElement(id);
            if (opt) {
                opt.disabled = !isTV;
                const label = opt.parentElement;
                if (!isTV) {
                    DOMUtils.addClass(label, 'option-unavailable');
                    opt.checked = false;
                } else {
                    DOMUtils.removeClass(label, 'option-unavailable');
                }
            }
        });

        const formatBtns = DOMUtils.getElements('.format-btn');
        formatBtns.forEach(btn => {
            if (!isTV) {
                DOMUtils.addClass(btn, 'option-unavailable');
                btn.disabled = true;
            } else {
                DOMUtils.removeClass(btn, 'option-unavailable');
                btn.disabled = false;
            }
        });

        if (isTV) {
            const optSeasonEpisode = DOMUtils.getElement('optSeasonEpisode');
            const optEpisodeName = DOMUtils.getElement('optEpisodeName');
            if (optSeasonEpisode) optSeasonEpisode.checked = true;
            if (optEpisodeName) optEpisodeName.checked = true;
        }

        const searchInput = DOMUtils.getElement('searchInput');
        if (searchInput) searchInput.placeholder = 'Buscar serie o película...';

        const selectedMoviesEl = DOMUtils.getElement('selectedMovies');
        const resultsEl = DOMUtils.getElement('results');
        
        if (selectedMoviesEl) {
            selectedMoviesEl.style.display = isMulti && this.selectedMovies.length ? 'flex' : 'none';
        }
        
        if (!isMulti) {
            this.selectedMovies = [];
            this.updateSelectedMoviesPreview();
            if (resultsEl) {
                resultsEl.querySelectorAll('.result-item.selected').forEach(card => card.classList.remove('selected'));
            }
        }
        
        this.selectedItem = null;
        this.selectedCard = null;

        this.updateFormatAvailability();
    }

    updateFormatAvailability() {
        const isTV = this.currentMode === 'tv';
        const optSeasonEpisode = DOMUtils.getElement('optSeasonEpisode');
        const optEpisodeName = DOMUtils.getElement('optEpisodeName');
        const hasSeasonEpisode = optSeasonEpisode ? optSeasonEpisode.checked : false;
        const hasEpisodeName = optEpisodeName ? optEpisodeName.checked : false;
        const formatBtns = DOMUtils.getElements('.format-btn');

        if (!isTV || !(hasSeasonEpisode && hasEpisodeName)) {
            formatBtns.forEach(btn => {
                DOMUtils.addClass(btn, 'option-unavailable');
                btn.disabled = true;
            });
        } else {
            formatBtns.forEach(btn => {
                DOMUtils.removeClass(btn, 'option-unavailable');
                btn.disabled = false;
            });
        }
    }

    updatePreview() {
        const options = this.getCurrentOptions();
        this.previewComponent.update(options);
    }

    getCurrentOptions() {
        const optSeasonEpisode = DOMUtils.getElement('optSeasonEpisode');
        const optEpisodeName = DOMUtils.getElement('optEpisodeName');
        const optAirDate = DOMUtils.getElement('optAirDate');
        const optIncludeRating = DOMUtils.getElement('optIncludeRating');
        const optIncludeDirector = DOMUtils.getElement('optIncludeDirector');
        const optIncludeGenre = DOMUtils.getElement('optIncludeGenre');
        const optIncludeEpisodeDirector = DOMUtils.getElement('optIncludeEpisodeDirector');
        const optEvolvingEmoji = DOMUtils.getElement('optEvolvingEmoji');
        const emojiInput = DOMUtils.getElement('emojiInput');
        const formatBtns = DOMUtils.getElements('.format-btn.active');
        const formatBtn = formatBtns.length > 0 ? formatBtns[0] : null;
        const titleFormatBtns = DOMUtils.getElements('.title-format-btn.active');
        const titleFormatBtn = titleFormatBtns.length > 0 ? titleFormatBtns[0] : null;

        return {
            isTV: this.currentMode === 'tv',
            includeSE: optSeasonEpisode ? optSeasonEpisode.checked : false,
            includeName: optEpisodeName ? optEpisodeName.checked : false,
            includeDate: optAirDate ? optAirDate.checked : false,
            includeRating: optIncludeRating ? optIncludeRating.checked : false,
            includeDirector: optIncludeDirector ? optIncludeDirector.checked : false,
            includeGenre: optIncludeGenre ? optIncludeGenre.checked : false,
            includeEpisodeDirector: optIncludeEpisodeDirector ? optIncludeEpisodeDirector.checked : false,
            useEvolution: optEvolvingEmoji ? optEvolvingEmoji.checked : false,
            emoji: emojiInput ? emojiInput.value : '',
            format: formatBtn ? formatBtn.dataset.format : '1',
            titleFormat: titleFormatBtn ? titleFormatBtn.dataset.titleFormat : '1'
        };
    }

    saveOptions() {
        const options = this.getCurrentOptions();
        options.currentMode = this.currentMode;
        options.language = this.tmdbService.language;
        this.storageService.save(todoPopcornConfig.storage.keys.options, options);
    }

    loadSavedOptions() {
        const savedOptions = this.storageService.load(todoPopcornConfig.storage.keys.options);
        if (savedOptions) {
            if (savedOptions.currentMode) {
                this.currentMode = savedOptions.currentMode;
                const modeBtns = DOMUtils.getElements('.mode-btn');
                modeBtns.forEach(btn => {
                    DOMUtils.removeClass(btn, 'active');
                    if (btn.dataset.mode === this.currentMode) {
                        DOMUtils.addClass(btn, 'active');
                    }
                });
                this.updateModeUI();
            }

            const checkboxes = {
                optSeasonEpisode: 'optSeasonEpisode',
                optEpisodeName: 'optEpisodeName',
                optAirDate: 'optAirDate',
                optIncludeRating: 'optIncludeRating',
                optIncludeDirector: 'optIncludeDirector',
                optIncludeGenre: 'optIncludeGenre',
                optIncludeEpisodeDirector: 'optIncludeEpisodeDirector',
                optEvolvingEmoji: 'optEvolvingEmoji'
            };

            Object.entries(checkboxes).forEach(([key, id]) => {
                if (savedOptions[key] !== undefined) {
                    const element = DOMUtils.getElement(id);
                    if (element) element.checked = savedOptions[key];
                }
            });

            if (savedOptions.emoji !== undefined) {
                const emojiInput = DOMUtils.getElement('emojiInput');
                if (emojiInput) emojiInput.value = savedOptions.emoji;
            }

            if (savedOptions.format) {
                const formatBtns = DOMUtils.getElements('.format-btn');
                formatBtns.forEach(btn => {
                    DOMUtils.removeClass(btn, 'active');
                    if (btn.dataset.format === savedOptions.format) {
                        DOMUtils.addClass(btn, 'active');
                    }
                });
            }

            if (savedOptions.titleFormat) {
                const titleFormatBtns = DOMUtils.getElements('.title-format-btn');
                titleFormatBtns.forEach(btn => {
                    DOMUtils.removeClass(btn, 'active');
                    if (btn.dataset.titleFormat === savedOptions.titleFormat) {
                        DOMUtils.addClass(btn, 'active');
                    }
                });
            }

            if (savedOptions.language) {
                this.tmdbService.language = savedOptions.language;
                const languageBtns = DOMUtils.getElements('.language-btn');
                languageBtns.forEach(btn => {
                    DOMUtils.removeClass(btn, 'active');
                    if (btn.dataset.language === savedOptions.language) {
                        DOMUtils.addClass(btn, 'active');
                    }
                });
            }

            this.updatePreview();
        }
    }

    showAlert(message) {
        this.alertModal.show(message);
    }

    renderTutorialCard() {
        const tutorialContent = DOMUtils.getElement('tutorialContent');
        const tutorialProgress = DOMUtils.getElement('tutorialProgress');
        const tutorialPrev = DOMUtils.getElement('tutorialPrev');
        const tutorialNext = DOMUtils.getElement('tutorialNext');
        
        if (tutorialContent) {
            DOMUtils.setHTML(tutorialContent, this.tutorialCards[this.tutorialIndex]);
        }
        if (tutorialProgress) {
            DOMUtils.setText(tutorialProgress, `${this.tutorialIndex + 1} / ${this.tutorialCards.length}`);
        }
        if (tutorialPrev) {
            tutorialPrev.classList.toggle('at-edge', this.tutorialIndex === 0);
        }
        if (tutorialNext) {
            tutorialNext.classList.toggle('at-edge', this.tutorialIndex === this.tutorialCards.length - 1);
        }
    }

    goTutorial(delta) {
        this.tutorialIndex = (this.tutorialIndex + delta + this.tutorialCards.length) % this.tutorialCards.length;
        this.renderTutorialCard();
    }

    async doSearch() {
        const searchInput = DOMUtils.getElement('searchInput');
        const searchBtn = DOMUtils.getElement('searchBtn');
        const resultsEl = DOMUtils.getElement('results');
        const outputModal = DOMUtils.getElement('outputModal');
        
        const q = searchInput.value.trim();
        if (!q) return;
        
        showGlobalLoader();
        
        if (searchBtn) {
            searchBtn.classList.add('loading');
            searchBtn.disabled = true;
            searchBtn.textContent = 'Buscando...';
        }
        
        if (resultsEl) {
            DOMUtils.setHTML(resultsEl, '<p>Cargando resultados...</p>');
        }
        if (outputModal) {
            outputModal.classList.remove('visible');
        }

        try {
            let results;
            if (this.currentMode === 'tv') {
                results = await this.tmdbService.searchMulti(q);
                results = results.filter(item => item.media_type === 'tv' || (!item.title && item.name));
            } else {
                results = await this.tmdbService.searchMulti(q);
            }
            this.displayResults(results);
        } catch (error) {
            console.error('Búsqueda fallida', error);
            if (resultsEl) {
                DOMUtils.setHTML(resultsEl, '<p>Error buscando resultados. Por favor intenta de nuevo.</p>');
            }
        } finally {
            hideGlobalLoader();
            if (searchBtn) {
                searchBtn.classList.remove('loading');
                searchBtn.disabled = false;
                searchBtn.textContent = 'Buscar';
            }
        }
    }

    displayResults(items) {
        const resultsEl = DOMUtils.getElement('results');
        if (!items.length) {
            if (resultsEl) {
                DOMUtils.setHTML(resultsEl, '<p>No se encontraron resultados.</p>');
            }
            return;
        }
        if (resultsEl) {
            DOMUtils.clearChildren(resultsEl);
        }

        items.forEach(it => {
            const mediaType = it.media_type || (this.currentMode === 'tv' ? 'tv' : 'movie');
            if (mediaType === 'person') return;

            const div = document.createElement('div');
            div.className = 'result-item';
            
            const img = document.createElement('img');
            img.src = it.poster_path ? this.tmdbService.getImageURL(it.poster_path) : '../img/mini-icon.png';
            div.appendChild(img);

            const info = document.createElement('div');
            info.className = 'result-info';
            const title = it.title || it.name || 'Sin título';
            const date = it.release_date || it.first_air_date || '';
            const year = date ? date.split('-')[0] : '';
            DOMUtils.setHTML(info, `
                <h4>${title}${year ? ' (' + year + ')' : ''}</h4>
                <p class="result-overview">${(it.overview || '').slice(0, 220)}</p>
                <p class="result-director"></p>
            `);
            
            const badge = document.createElement('div');
            badge.className = 'result-badge';
            const directorEl = info.querySelector('.result-director');
            const meta = document.createElement('p');
            meta.className = 'result-meta';
            DOMUtils.setText(meta, it.vote_average ? `⭐ ${it.vote_average.toFixed(1)} / 10` : '');

            if (mediaType === 'tv') {
                DOMUtils.setText(badge, 'Serie');
                this.tmdbService.getTVDetails(it.id).then(tv => {
                    if (tv.number_of_seasons && tv.number_of_episodes) {
                        DOMUtils.setText(badge, `${tv.number_of_seasons} temp. · ${tv.number_of_episodes} ep.`);
                    }
                    if (tv.vote_average) {
                        DOMUtils.setText(meta, `⭐ ${tv.vote_average.toFixed(1)} / 10`);
                    }
                    const directors = tv.created_by?.length ? tv.created_by.map(person => person.name).join(', ') : '';
                    if (directors && directorEl) {
                        DOMUtils.setText(directorEl, directors);
                    }
                }).catch(() => { DOMUtils.setText(badge, 'Serie'); });
            } else {
                DOMUtils.setText(badge, 'Película');
                this.tmdbService.getMovieDetails(it.id).then(movie => {
                    const duration = movie.runtime ? `${movie.runtime} min` : '';
                    DOMUtils.setText(badge, duration || 'Película');
                    if (movie.vote_average) {
                        DOMUtils.setText(meta, `⭐ ${movie.vote_average.toFixed(1)} / 10`);
                    }
                    this.tmdbService.getMovieCredits(it.id).then(credits => {
                        const directors = credits.crew?.filter(c => c.job === 'Director') || [];
                        const directorNames = directors.map(d => d.name).join(', ');
                        if (directorNames && directorEl) {
                            DOMUtils.setText(directorEl, directorNames);
                        }
                    });
                }).catch(() => { DOMUtils.setText(badge, 'Película'); });
            }

            div.appendChild(badge);
            div.appendChild(info);
            info.appendChild(meta);
            div.dataset.key = this.getItemKey(it);
            if (this.currentMode === 'multi-movies' && this.selectedMovies.some(movie => this.getItemKey(movie) === div.dataset.key)) {
                div.classList.add('selected');
            }
            DOMUtils.addEventListener(div, 'click', () => this.toggleSelection(it, div));
            if (resultsEl) {
                DOMUtils.appendChild(resultsEl, div);
            }
        });
    }

    getItemKey(it) {
        return `${it.media_type || (it.title ? 'movie' : 'tv')}-${it.id}`;
    }

    async toggleSelection(it, card) {
        if (this.currentMode === 'multi-movies') {
            await this.toggleMovieSelection(it, card);
            return;
        }

        const key = this.getItemKey(it);
        const same = this.selectedKey === key;
        if (same) {
            this.selectedItem = null;
            if (this.selectedCard) this.selectedCard.classList.remove('selected');
            this.selectedCard = null;
            this.selectedKey = null;
            const outputModal = DOMUtils.getElement('outputModal');
            if (outputModal) outputModal.classList.remove('visible');
            return;
        }

        if (this.selectedCard) this.selectedCard.classList.remove('selected');
        this.selectedItem = it;
        this.selectedCard = card;
        this.selectedKey = key;
        card.classList.add('selected');
        if (card.parentElement) card.parentElement.prepend(card);
        const outputModal = DOMUtils.getElement('outputModal');
        if (outputModal) outputModal.classList.remove('visible');
        await this.loadDetails(it);
    }

    async toggleMovieSelection(it, card) {
        const key = this.getItemKey(it);
        const existingIndex = this.selectedMovies.findIndex(movie => this.getItemKey(movie) === key);
        if (existingIndex >= 0) {
            this.selectedMovies.splice(existingIndex, 1);
            card.classList.remove('selected');
        } else {
            showGlobalLoader();
            card.classList.add('loading');
            const isTV = it.media_type === 'tv' || (!it.title && it.name);
            try {
                if (isTV) {
                    it.director = await this.tmdbService.getTVCreator(it.id);
                    it.genres = await this.tmdbService.getTVGenres(it.id);
                } else {
                    it.director = await this.tmdbService.getMovieCreator(it.id);
                    it.genres = await this.tmdbService.getMovieGenres(it.id);
                }
            } catch (e) {
                console.warn('credits fetch failed', e);
                it.director = '';
                it.genres = '';
            } finally {
                hideGlobalLoader();
                card.classList.remove('loading');
            }
            this.selectedMovies.push(it);
            card.classList.add('selected');
        }
        this.updateSelectedMoviesPreview();
    }

    async loadDetails(it) {
        showGlobalLoader();
        const outputModal = DOMUtils.getElement('outputModal');
        if (outputModal) outputModal.classList.remove('visible');
        
        try {
            const isTV = it.media_type === 'tv' || (!it.title && it.name);

            if (isTV) {
                const id = it.id;
                const tv = await this.tmdbService.getTVDetails(id);
                this.episodesList = [];
                const seasons = (tv.seasons || []).filter(s => s.season_number > 0);

                it.director = await this.tmdbService.getTVCreator(id);
                it.genres = await this.tmdbService.getTVGenres(id);

                for (const s of seasons) {
                    const seasonNum = s.season_number;
                    try {
                        const seasonData = await this.tmdbService.getSeasonDetails(id, seasonNum);
                        const eps = seasonData.episodes || [];
                        eps.forEach(ep => {
                            this.episodesList.push({ season: seasonNum, episode: ep.episode_number, name: ep.name, air_date: ep.air_date, director: '' });
                        });
                    } catch (e) {
                        console.warn('season fetch failed', e);
                    }
                }
                this.episodesList.sort((a, b) => (a.season - b.season) || (a.episode - b.episode));
            } else {
                const title = it.title || it.name;
                const date = it.release_date || it.first_air_date || '';
                this.episodesList = [{ season: null, episode: null, name: title, air_date: date, director: '' }];

                it.director = await this.tmdbService.getMovieCreator(it.id);
                it.genres = await this.tmdbService.getMovieGenres(it.id);
            }
        } finally {
            hideGlobalLoader();
        }
    }

    updateSelectedMoviesPreview() {
        const selectedMoviesEl = DOMUtils.getElement('selectedMovies');
        if (!this.selectedMovies.length) {
            if (selectedMoviesEl) {
                DOMUtils.setHTML(selectedMoviesEl, '');
                selectedMoviesEl.style.display = 'none';
            }
            return;
        }

        const totalPages = Math.ceil(this.selectedMovies.length / this.MOVIES_PER_PAGE);
        const startIndex = this.selectedMoviesPage * this.MOVIES_PER_PAGE;
        const endIndex = startIndex + this.MOVIES_PER_PAGE;
        const currentMovies = this.selectedMovies.slice(startIndex, endIndex);

        selectedMoviesEl.style.display = 'flex';
        selectedMoviesEl.style.flexDirection = 'column';
        selectedMoviesEl.style.alignItems = 'center';

        let html = '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">';
        html += currentMovies.map(movie => {
            const imgSrc = movie.poster_path ? this.tmdbService.getImageURL(movie.poster_path) : '../img/mini-icon.png';
            return `
                <div class="movie-chip" data-key="${this.getItemKey(movie)}">
                    <img src="${imgSrc}" alt="Poster" class="movie-chip-img" />
                    <button type="button" class="remove-movie" aria-label="Quitar">×</button>
                </div>
            `;
        }).join('');
        html += '</div>';

        if (totalPages > 1) {
            html += `
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem; align-items: center;">
                    <button type="button" class="pagination-btn" ${this.selectedMoviesPage === 0 ? 'disabled' : ''} data-page="${this.selectedMoviesPage - 1}">‹</button>
                    <span style="color: #777; font-size: 0.85rem;">${this.selectedMoviesPage + 1} / ${totalPages}</span>
                    <button type="button" class="pagination-btn" ${this.selectedMoviesPage >= totalPages - 1 ? 'disabled' : ''} data-page="${this.selectedMoviesPage + 1}">›</button>
                </div>
            `;
        }

        DOMUtils.setHTML(selectedMoviesEl, html);

        selectedMoviesEl.querySelectorAll('.remove-movie').forEach(button => {
            DOMUtils.addEventListener(button, 'click', (event) => {
                event.stopPropagation();
                const chip = event.target.closest('.movie-chip');
                const key = chip.dataset.key;
                this.selectedMovies = this.selectedMovies.filter(movie => this.getItemKey(movie) !== key);
                if (this.selectedMoviesPage > 0 && this.selectedMoviesPage >= Math.ceil(this.selectedMovies.length / this.MOVIES_PER_PAGE)) {
                    this.selectedMoviesPage = Math.max(0, this.selectedMoviesPage - 1);
                }
                this.updateSelectedMoviesPreview();
                const resultsEl = DOMUtils.getElement('results');
                if (resultsEl) {
                    resultsEl.querySelectorAll('.result-item').forEach(card => {
                        if (card.dataset.key === key) card.classList.remove('selected');
                    });
                }
            });
        });

        selectedMoviesEl.querySelectorAll('.pagination-btn').forEach(button => {
            DOMUtils.addEventListener(button, 'click', () => {
                if (!button.disabled) {
                    this.selectedMoviesPage = parseInt(button.dataset.page);
                    this.updateSelectedMoviesPreview();
                }
            });
        });
    }

    clearSearch() {
        this.selectedMovies = [];
        this.selectedMoviesPage = 0;
        this.updateSelectedMoviesPreview();
        const resultsEl = DOMUtils.getElement('results');
        const searchInput = DOMUtils.getElement('searchInput');
        if (resultsEl) {
            resultsEl.querySelectorAll('.result-item.selected').forEach(card => card.classList.remove('selected'));
            DOMUtils.setHTML(resultsEl, '');
        }
        if (searchInput) {
            DOMUtils.setValue(searchInput, '');
        }
        this.selectedItem = null;
        this.selectedCard = null;
        this.selectedKey = null;
        this.episodesList = [];
    }

    async generateOutput() {
        const generateBtn = DOMUtils.getElement('generateBtn');
        if (generateBtn) {
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generando...';
        }

        showGlobalLoader();

        try {
            if (this.currentMode === 'multi-movies') {
                if (!this.selectedMovies.length) return this.showAlert('Selecciona al menos una película.');
                this.generateMovieList();
                return;
            }
            if (!this.selectedItem) return this.showAlert('Selecciona una serie o película primero');

            const options = this.getCurrentOptions();
            const title = this.selectedItem.title || this.selectedItem.name || this.selectedItem.original_name || '';
            const date = this.selectedItem.release_date || this.selectedItem.first_air_date || '';
            const year = date ? date.split('-')[0] : '';
            const ratingSuffix = options.includeRating && this.selectedItem.vote_average ? ` ⭐${this.selectedItem.vote_average.toFixed(1)} / 10` : '';
            const directorSuffix = options.includeDirector && this.selectedItem.director ? ` | Creador: ${this.selectedItem.director}` : '';
            const genreSuffix = options.includeGenre && this.selectedItem.genres ? ` | ${this.selectedItem.genres}` : '';

            const formattedTitle = FormatUtils.formatTitle(title, year, options.titleFormat);

            const mainTaskModal = DOMUtils.getElement('mainTaskModal');
            const subtasksModal = DOMUtils.getElement('subtasksModal');
            if (mainTaskModal) {
                DOMUtils.setValue(mainTaskModal, `${formattedTitle}${ratingSuffix}${directorSuffix}${genreSuffix}`);
            }

            let lines = [];
            if (this.episodesList.length === 1 && this.episodesList[0].season == null) {
                let line = `${options.emoji}${this.episodesList[0].name}`.trim();
                if (options.useEvolution) {
                    const evo = this.getEvolutionEmoji(0, this.episodesList);
                    if (evo) line = evo + ' ' + this.episodesList[0].name;
                }
                lines.push(line.trim());
            } else {
                if (options.includeEpisodeDirector) {
                    const id = this.selectedItem.id;
                    for (const ep of this.episodesList) {
                        if (ep.season != null) {
                            try {
                                ep.director = await this.tmdbService.getEpisodeDirector(id, ep.season, ep.episode);
                            } catch (e) {
                                console.warn('episode credits fetch failed', e);
                                ep.director = '';
                            }
                        }
                    }
                }

                this.episodesList.forEach((ep, index) => {
                    const seCode = options.includeSE && ep.season != null ? FormatUtils.formatSeasonEpisode(ep.season, ep.episode) : '';
                    const name = options.includeName ? ep.name : '';
                    const dateStr = options.includeDate && ep.air_date ? FormatUtils.formatDate(ep.air_date) : '';
                    const directorStr = options.includeEpisodeDirector && ep.director ? FormatUtils.formatEpisodeDirector(ep.director) : '';
                    let line = FormatUtils.formatEpisode(ep.season, ep.episode, name, options.format);
                    line += dateStr + directorStr;
                    if (options.useEvolution) {
                        const evo = this.getEvolutionEmoji(index, this.episodesList);
                        if (evo) line = evo + ' ' + line;
                    } else if (options.emoji) {
                        line = options.emoji + ' ' + line;
                    }
                    lines.push(line.trim());
                });
            }

            if (subtasksModal) {
                DOMUtils.setValue(subtasksModal, lines.join('\n'));
            }

            const mainTaskSection = DOMUtils.getElement('mainTaskSection');
            const episodesSection = DOMUtils.getElement('episodesSection');
            if (mainTaskSection) mainTaskSection.style.display = 'block';
            if (episodesSection) {
                episodesSection.style.display = 'block';
                const h3 = episodesSection.querySelector('h3');
                if (h3) DOMUtils.setText(h3, 'episodios');
            }
            
            this.lastGeneratedOutput = { main: mainTaskModal ? mainTaskModal.value : '', subs: subtasksModal ? subtasksModal.value : '', hasEpisodes: true };
            
            const outputModal = DOMUtils.getElement('outputModal');
            if (outputModal) outputModal.classList.add('visible');
        } finally {
            hideGlobalLoader();
            if (generateBtn) {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generar texto';
            }
        }
    }

    generateMovieList() {
        const generateBtn = DOMUtils.getElement('generateBtn');
        if (generateBtn) {
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generando...';
        }

        try {
            const options = this.getCurrentOptions();

            const lines = this.selectedMovies.map(movie => {
                const title = movie.title || movie.name || 'Sin título';
                const date = movie.release_date || movie.first_air_date || '';
                const year = date ? date.split('-')[0] : '';
                const rating = options.includeRating && movie.vote_average ? FormatUtils.formatRating(movie.vote_average) : '';
                const director = options.includeDirector && movie.director ? FormatUtils.formatCreator(movie.director) : '';
                const genre = options.includeGenre && movie.genres ? FormatUtils.formatGenre(movie.genres) : '';
                const dateStr = options.includeDate && date ? FormatUtils.formatDate(date) : '';

                const formattedTitle = FormatUtils.formatTitle(title, year, options.titleFormat);

                let line = `${formattedTitle}${rating}${director}${genre}`.trim();
                if (options.emoji) {
                    line = `${options.emoji} ${line}`.trim();
                }
                if (dateStr) {
                    line += dateStr;
                }
                return line;
            });

            const mainTaskModal = DOMUtils.getElement('mainTaskModal');
            const subtasksModal = DOMUtils.getElement('subtasksModal');
            if (mainTaskModal) DOMUtils.setValue(mainTaskModal, '');
            if (subtasksModal) DOMUtils.setValue(subtasksModal, lines.join('\n'));

            const mainTaskSection = DOMUtils.getElement('mainTaskSection');
            const episodesSection = DOMUtils.getElement('episodesSection');
            if (mainTaskSection) mainTaskSection.style.display = 'none';
            if (episodesSection) {
                episodesSection.style.display = 'block';
                const h3 = episodesSection.querySelector('h3');
                if (h3) DOMUtils.setText(h3, 'Lista de títulos');
            }
            
            this.lastGeneratedOutput = { main: mainTaskModal ? mainTaskModal.value : '', subs: subtasksModal ? subtasksModal.value : '', hasEpisodes: false };
            
            const viewPreviousBtn = DOMUtils.getElement('viewPreviousBtn');
            if (viewPreviousBtn) viewPreviousBtn.disabled = false;
            
            const outputModal = DOMUtils.getElement('outputModal');
            if (outputModal) outputModal.classList.add('visible');
        } finally {
            if (generateBtn) {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generar texto';
            }
        }
    }

    viewPreviousOutput() {
        if (!this.lastGeneratedOutput) return this.showAlert('No hay lista anterior disponible.');
        
        const mainTaskModal = DOMUtils.getElement('mainTaskModal');
        const subtasksModal = DOMUtils.getElement('subtasksModal');
        const mainTaskSection = DOMUtils.getElement('mainTaskSection');
        const episodesSection = DOMUtils.getElement('episodesSection');
        const outputModal = DOMUtils.getElement('outputModal');
        
        if (mainTaskModal) DOMUtils.setValue(mainTaskModal, this.lastGeneratedOutput.main);
        if (subtasksModal) DOMUtils.setValue(subtasksModal, this.lastGeneratedOutput.subs);
        
        if (this.lastGeneratedOutput.hasEpisodes) {
            if (mainTaskSection) mainTaskSection.style.display = 'block';
            if (episodesSection) {
                episodesSection.style.display = 'block';
                const h3 = episodesSection.querySelector('h3');
                if (h3) DOMUtils.setText(h3, 'episodios');
            }
        } else {
            if (mainTaskSection) mainTaskSection.style.display = 'none';
            if (episodesSection) {
                episodesSection.style.display = 'block';
                const h3 = episodesSection.querySelector('h3');
                if (h3) DOMUtils.setText(h3, 'Lista de títulos');
            }
        }
        if (outputModal) outputModal.classList.add('visible');
    }

    async copyField(field, successMessage) {
        try {
            await navigator.clipboard.writeText(field.value);
            field.select();
            this.showAlert(successMessage);
        } catch (error) {
            field.select();
            document.execCommand('copy');
            this.showAlert(successMessage);
        }
    }

    async copyAndReset(field, successMessage) {
        await this.copyField(field, successMessage);
        if (this.currentMode === 'multi-movies') {
            this.resetMovieSelection();
        }
    }

    resetMovieSelection() {
        this.selectedMovies = [];
        this.updateSelectedMoviesPreview();
        const resultsEl = DOMUtils.getElement('results');
        const searchInput = DOMUtils.getElement('searchInput');
        if (resultsEl) {
            resultsEl.querySelectorAll('.result-item.selected').forEach(card => card.classList.remove('selected'));
        }
        if (searchInput) {
            DOMUtils.setValue(searchInput, '');
        }
    }

    getEvolutionEmoji(index, episodes) {
        const current = episodes[index];
        const isFirstOfSeason = index === 0 || current.season !== episodes[index - 1].season;
        return isFirstOfSeason ? '🍿' : null;
    }
}

// Inicializar la aplicación cuando el DOM esté completamente cargado
function initApp() {
    try {
        console.log('DOM completamente cargado, inicializando aplicación...');
        const app = new TodoPopcornApp();
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        // Mostrar mensaje de error al usuario
        const tutorialContent = DOMUtils.getElement('tutorialContent');
        if (tutorialContent) {
            DOMUtils.setHTML(tutorialContent, '<p style="color: red;">Error al cargar la aplicación. Por favor recarga la página.</p>');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Exponer initApp globalmente para que el router pueda llamarla
window.initTodoPopcorn = initApp;
})();
