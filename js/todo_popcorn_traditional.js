(function() {
// Configuración centralizada
const todoPopcornConfig = {
    tmdb: {

        imageBase: 'https://image.tmdb.org/t/p/w300',
        baseURL: 'https://tmdb-proxy.bastianenrique-contacto.workers.dev/3',
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
    formatSeasonEpisode(season, episode) {
        const s = season < 10 ? '0' + season : season;
        const e = episode < 10 ? '0' + episode : episode;
        return `T${s}|E${e}`;
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

// Contrato de StructureJson.kt de Arachn0de; los metadatos nunca alargan el título.
const PopcornExport = {
    title(item, options) {
        const date = item.release_date || item.first_air_date || '';
        const title = item.title || item.name || '';
        const year = date.split('-')[0];
        return `${title}${options.includeYear && year ? ' (' + year + ')' : ''}`;
    },
    metadata(item, options) {
        return [
            options.includeRating && item.vote_average ? `Puntuación: ${item.vote_average.toFixed(1)} / 10` : '',
            options.includeDirector && item.director ? `Creador: ${item.director}` : '',
            options.includeGenre && item.genres ? `Género: ${item.genres}` : '',
            options.includeDate && (item.release_date || item.first_air_date) ? `Fecha: ${item.release_date || item.first_air_date}` : ''
        ].filter(Boolean).join('\n');
    },
    build(items, episodes, options) {
        const roots = items.map(item => ({
            type: options.isTV ? 'layer' : 'task',
            title: this.title(item, options),
            description: this.metadata(item, options)
        }));
        if (options.isTV && roots.length === 1) {
            roots[0].children = episodes.map(ep => {
                const code = options.includeSE ? FormatUtils.formatSeasonEpisode(ep.season, ep.episode) : '';
                const name = options.includeName ? ep.name || '' : '';
                const parts = [code, name];
                return {
                    type: 'task',
                    title: parts.filter(Boolean).join(' - '),
                    description: [
                        options.includeDate && ep.air_date ? `Fecha de emisión: ${ep.air_date}` : '',
                        options.includeEpisodeDirector && ep.director ? `Director: ${ep.director}` : ''
                    ].filter(Boolean).join('\n')
                };
            });
        }
        return { format: 'arachnode.structure', version: 1, items: roots };
    },
    validate(document) {
        const errors = [];
        let count = 0;
        const visit = (item, depth, path) => {
            count++;
            // Kotlin trim() uses Unicode whitespace and space separators.
            const title = item.title.replace(/^[\p{Z}\u0009-\u000d\u001c-\u001f]+|[\p{Z}\u0009-\u000d\u001c-\u001f]+$/gu, '');
            if (!title || Array.from(title).length > 100) errors.push(`${path}: el título debe tener entre 1 y 100 caracteres. Ajusta las opciones o el contenido de origen.`);
            if (item.description.length > 16000) errors.push(`${path}: la descripción supera 16.000 caracteres.`);
            if (title.includes('[[arachnode:') || item.description.includes('[[arachnode:')) errors.push(`${path}: contiene una referencia interna no permitida.`);
            if (depth > 32) errors.push(`${path}: supera 32 niveles.`);
            (item.children || []).forEach((child, i) => visit(child, depth + 1, `${path}.${i + 1}`));
        };
        if (!document.items.length) errors.push('Selecciona al menos un título.');
        document.items.forEach((item, i) => visit(item, 1, `Elemento ${i + 1}`));
        if (count > 1000) errors.push(`La estructura contiene ${count} elementos; el máximo es 1.000, incluidas las capas.`);
        const json = JSON.stringify(document, null, 2);
        if (new TextEncoder().encode(json).length > 2 * 1024 * 1024) errors.push('El JSON supera 2 MiB UTF-8.');
        return { json, errors };
    },
    render(document, target, episodes = []) {
        target.replaceChildren();
        const tree = (items, parent) => {
            const list = documentCreate('ul');
            items.forEach(item => {
                const row = documentCreate('li');
                const title = documentCreate('span');
                title.textContent = `${item.type === 'layer' ? '▤ Capa' : '☐ Tarea'}: ${item.title || '(título vacío)'}`;
                row.appendChild(title);
                if (item.description) {
                    const detail = documentCreate('p');
                    detail.textContent = item.description;
                    detail.style.whiteSpace = 'pre-wrap';
                    row.appendChild(detail);
                }
                if (item.children) {
                    // Seasons group the preview only; exported children remain flat and ordered.
                    const seasons = new Map();
                    item.children.forEach((child, index) => {
                        const season = episodes[index]?.season;
                        if (!seasons.has(season)) seasons.set(season, []);
                        seasons.get(season).push(child);
                    });
                    seasons.forEach((children, season) => {
                        const group = documentCreate('details');
                        const summary = documentCreate('summary');
                        summary.textContent = `${season == null ? 'Episodios' : 'Temporada ' + season} · ${children.length} ${children.length === 1 ? 'episodio' : 'episodios'}`;
                        group.appendChild(summary);
                        tree(children, group);
                        row.appendChild(group);
                    });
                }
                list.appendChild(row);
            });
            parent.appendChild(list);
        };
        const documentCreate = tag => window.document.createElement(tag);
        tree(document.items, target);
    }
};

window.PreviewComponent = window.PreviewComponent || class PreviewComponent {
    constructor(previewElement) { this.previewElement = previewElement; }
    update(options, language = 'es-ES') {
        const names = language === 'en-US' ? ['Pilot', 'Paternity'] : ['Piloto', 'Paternidad'];
        const sample = { title: language === 'es-MX' ? 'Dr. House' : 'House', release_date: '2004-11-16', vote_average: 8.6, director: 'David Shore', genres: 'Drama' };
        const episodes = names.map((name, i) => ({ season: 1, episode: i + 1, name, air_date: `2004-11-${16 + i * 7}`, director: 'Bryan Singer' }));
        PopcornExport.render(PopcornExport.build([sample], episodes, options), this.previewElement, episodes);
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

// Names are taken verbatim from TMDB. Generic numbered placeholders are not translations.
const TitleLanguages = {
    labels: { 'es-MX': 'Español latino', 'es-ES': 'Español de España', 'en-US': 'Inglés' },
    priority(language) {
        return language === 'en-US' ? ['en-US'] : [language, language === 'es-MX' ? 'es-ES' : 'es-MX', 'en-US'];
    },
    real(name) {
        const value = (name || '').trim();
        return Boolean(value) && !/^(?:(?:episode|episodio|cap[ií]tulo|temporada|season|t[ií]tulo|title)\s*(?:n[.º°o]*\s*)?\d*|(?:sin t[ií]tulo|untitled|tba|tbd)|[st]\d+\s*[| -]?\s*e\d+)$/iu.test(value);
    },
    resolve(rows, language, choice = 'mix') {
        const priority = choice === 'mix' ? this.priority(language) : [choice];
        return rows.map(row => {
            const usedLanguage = priority.find(lang => this.real(row.names[lang]));
            return { ...row, name: usedLanguage ? row.names[usedLanguage].trim() : '', usedLanguage };
        });
    },
    coverage(rows, language, choice = 'mix') {
        const resolved = this.resolve(rows, language, choice);
        const total = rows.length;
        const available = Object.fromEntries(Object.keys(this.labels).map(lang => [lang, rows.filter(row => this.real(row.names[lang])).length]));
        const used = Object.fromEntries(Object.keys(this.labels).map(lang => [lang, resolved.filter(row => row.usedLanguage === lang).length]));
        const seasons = [...new Set(rows.map(row => row.season))].map(season => {
            const group = rows.filter(row => row.season === season);
            return { season, total: group.length, available: group.filter(row => this.real(row.names[language])).length };
        });
        return { total, available, used, seasons, missing: resolved.filter(row => !row.usedLanguage).length };
    }
};

// Servicio para interactuar con la API de TMDB
class TMDBService {
    constructor() {
        this.baseURL = todoPopcornConfig.tmdb.baseURL;
        this.imageBase = todoPopcornConfig.tmdb.imageBase;
        this.language = todoPopcornConfig.tmdb.language;
        this.cache = new Map();
    }

    // Share in-flight requests as well as responses. Capture language before the first await.
    request(path, language = this.language, params = {}) {
        const query = new URLSearchParams({ language, ...params }).toString();
        const cacheKey = `${path}?${query}`;
        if (!this.cache.has(cacheKey)) {
            const pending = (async () => {
                const res = await fetch(`${this.baseURL}/${path}?${query}`);
                if (!res.ok) throw new Error(`TMDB: respuesta ${res.status}`);
                return res.json();
            })();
            this.cache.set(cacheKey, pending);
            pending.catch(() => { if (this.cache.get(cacheKey) === pending) this.cache.delete(cacheKey); });
            if (this.cache.size > 200) this.cache.delete(this.cache.keys().next().value);
        }
        return this.cache.get(cacheKey);
    }

    async searchMulti(query, language = this.language) {
        const data = await this.request('search/multi', language, { query, include_adult: 'false' });
        return data.results || [];
    }
    getTVDetails(id, language = this.language) { return this.request(`tv/${id}`, language); }
    getTVCredits(id, language = this.language) { return this.request(`tv/${id}/credits`, language); }
    getSeasonDetails(id, season, language = this.language) { return this.request(`tv/${id}/season/${season}`, language); }
    getEpisodeCredits(id, season, episode, language = this.language) { return this.request(`tv/${id}/season/${season}/episode/${episode}/credits`, language); }
    getMovieDetails(id, language = this.language) { return this.request(`movie/${id}`, language); }
    getMovieCredits(id, language = this.language) { return this.request(`movie/${id}/credits`, language); }

    async localizeItem(item, language = this.language) {
        const isTV = item.media_type === 'tv' || (!item.title && item.name);
        const details = await (isTV ? this.getTVDetails(item.id, language) : this.getMovieDetails(item.id, language));
        const field = isTV ? 'name' : 'title';
        let title = details[field];
        if (!TitleLanguages.real(title)) {
            for (const fallback of TitleLanguages.priority(language).slice(1)) {
                const alternative = await (isTV ? this.getTVDetails(item.id, fallback) : this.getMovieDetails(item.id, fallback));
                if (TitleLanguages.real(alternative[field])) { title = alternative[field]; break; }
            }
        }
        const director = isTV ? await this.getTVCreator(item.id, language) : await this.getMovieCreator(item.id, language);
        return { ...item, ...details, [field]: TitleLanguages.real(title) ? title : '',
            media_type: isTV ? 'tv' : 'movie', director, genres: (details.genres || []).map(g => g.name).join(', ') };
    }

    async seasonTitles(id, seasons, language = this.language) {
        const rows = [];
        const failedSeasons = [];
        const unavailable = [];
        // One response per season/language, reused for names, dates and episode crew.
        for (const season of seasons.filter(s => s.season_number > 0)) {
            const number = season.season_number;
            const languages = Object.keys(TitleLanguages.labels);
            const responses = await Promise.allSettled(languages.map(lang => this.getSeasonDetails(id, number, lang)));
            const byEpisode = new Map();
            responses.forEach((result, index) => {
                const lang = languages[index];
                if (result.status !== 'fulfilled' || !Array.isArray(result.value.episodes)) {
                    unavailable.push({ season: number, language: lang });
                    return;
                }
                result.value.episodes.forEach(ep => {
                    if (!byEpisode.has(ep.episode_number)) byEpisode.set(ep.episode_number, { season: number, episode: ep.episode_number, names: {}, air_date: ep.air_date, director: (ep.crew || []).filter(c => c.job === 'Director').map(c => c.name).join(', ') });
                    byEpisode.get(ep.episode_number).names[lang] = ep.name || '';
                });
            });
            if (!byEpisode.size || byEpisode.size < (season.episode_count || 0)) failedSeasons.push(number);
            rows.push(...byEpisode.values());
        }
        rows.sort((a, b) => a.season - b.season || a.episode - b.episode);
        return { rows, failedSeasons, unavailable };
    }

    async getTVCreator(id, language = this.language) {
        try {
            const tv = await this.getTVDetails(id, language);
            if (tv.created_by && tv.created_by.length > 0) {
                return tv.created_by.map(c => c.name).join(', ');
            }
            // Fallback: si no hay created_by, buscar en créditos
            const credits = await this.getTVCredits(id, language);
            const creators = credits.crew?.filter(c => c.job === 'Creator') || [];
            const executiveProducers = credits.crew?.filter(c => c.job === 'Executive Producer') || [];
            return creators.length > 0 ? creators.map(c => c.name).join(', ') :
                   executiveProducers.length > 0 ? executiveProducers.map(c => c.name).join(', ') : '';
        } catch (e) {
            console.warn('Error al obtener creador de TV:', e);
            return '';
        }
    }

    async getTVGenres(id, language = this.language) {
        try {
            const tv = await this.getTVDetails(id, language);
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

    async getEpisodeDirector(tvId, seasonNum, episodeNum, language = this.language) {
        try {
            const credits = await this.getEpisodeCredits(tvId, seasonNum, episodeNum, language);
            const directors = credits.crew?.filter(c => c.job === 'Director') || [];
            return directors.length > 0 ? directors.map(d => d.name).join(', ') : '';
        } catch (e) {
            console.warn('Error al obtener director de episodio:', e);
            return '';
        }
    }

    async getMovieCreator(id, language = this.language) {
        try {
            const credits = await this.getMovieCredits(id, language);
            const creators = credits.crew?.filter(c => c.job === 'Creator') || [];
            const directors = credits.crew?.filter(c => c.job === 'Director') || [];
            return creators.length > 0 ? creators.map(c => c.name).join(', ') : 
                   directors.length > 0 ? directors.map(d => d.name).join(', ') : '';
        } catch (e) {
            console.warn('Error al obtener creador de película:', e);
            return '';
        }
    }

    async getMovieGenres(id, language = this.language) {
        try {
            const movie = await this.getMovieDetails(id, language);
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
        this.revision = 0;
        this.searchRevision = 0;
        this.languageChoice = 'mix';
        this.episodeTitles = [];
        this.translationUnavailable = [];
        this.MOVIES_PER_PAGE = 5;
        
        this.tutorialCards = [
            'ToDo Popcorn! usa datos de TMDB y genera JSON para Arachn0de.',
            'Modo títulos: selecciona películas o series para crear tareas independientes.',
            'Modo serie: crea una Capa con todos los episodios de las temporadas normales como Tareas, en orden.',
            'Elige si incluir año, códigos y nombres. Los metadatos seleccionados se conservan en la descripción.',
            'Genera el JSON, revisa la jerarquía y pulsa «Copiar JSON». En Arachn0de abre Crear → Desde texto, pega y confirma la vista previa.',
            'Los límites del importador se validan antes de copiar. Si falla una temporada, debes aceptar explícitamente la exportación incompleta.'
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

        const languageBtns = DOMUtils.getElements('.language-btn');
        languageBtns.forEach(btn => {
            DOMUtils.addEventListener(btn, 'click', () => this.handleLanguageClick(btn));
        });

        const modeBtns = DOMUtils.getElements('.mode-btn');
        modeBtns.forEach(btn => {
            DOMUtils.addEventListener(btn, 'click', () => this.handleModeClick(btn));
        });

        const searchBtn = DOMUtils.getElement('searchBtn');
        const searchInput = DOMUtils.getElement('searchInput');
        if (searchBtn) {
            DOMUtils.addEventListener(searchBtn, 'click', () => this.doSearch());
        }
        if (searchInput) {
            DOMUtils.addEventListener(searchInput, 'keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.doSearch(); } });
            DOMUtils.addEventListener(searchInput, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.doSearch(); } });
        }

        DOMUtils.addEventListener(DOMUtils.getElement('coverageChoices'), 'change', event => {
            if (event.target.matches('input')) this.changeTitleLanguage(event.target.value);
        });

        const closeOutputModal = DOMUtils.getElement('closeOutputModal');
        const outputModal = DOMUtils.getElement('outputModal');
        if (closeOutputModal) {
            DOMUtils.addEventListener(closeOutputModal, 'click', () => this.closeOutput());
        }
        if (outputModal) {
            DOMUtils.addEventListener(outputModal, 'click', (event) => {
                if (event.target === outputModal) this.closeOutput();
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

        DOMUtils.addEventListener(DOMUtils.getElement('copyJson'), 'click', () => this.copyJson());
        DOMUtils.addEventListener(DOMUtils.getElement('acceptIncomplete'), 'change', () => this.updateCopyState());

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
        if (this.refreshing) return;
        this.invalidateOutput();
        this.updatePreview();
        this.saveOptions();
    }

    closeOutput() {
        DOMUtils.getElement('outputModal').classList.remove('visible');
        DOMUtils.getElement('coverageSlot').appendChild(DOMUtils.getElement('languageCoverage'));
    }

    invalidateOutput() {
        this.revision = (this.revision || 0) + 1;
        this.lastGeneratedOutput = null;
        DOMUtils.getElement('jsonOutput').value = '';
        DOMUtils.getElement('copyJson').disabled = true;
        DOMUtils.getElement('viewPreviousBtn').disabled = true;
        this.closeOutput();
    }

    updateGenerationState() {
        const busy = this.refreshing || this.loadingDetails || this.generating;
        DOMUtils.getElement('generateBtn').disabled = Boolean(busy || this.refreshError || this.detailsError);
        DOMUtils.getElements('.mode-btn, .remove-movie').forEach(btn => { btn.disabled = Boolean(this.refreshing); });
        DOMUtils.getElements('.option-row input').forEach(input => {
            const seriesOnly = ['optSeasonEpisode', 'optEpisodeName', 'optAirDate', 'optIncludeEpisodeDirector'].includes(input.id);
            input.disabled = Boolean(this.refreshing || (seriesOnly && this.currentMode !== 'tv'));
        });
        DOMUtils.getElement('languageStatus').textContent = busy ? 'Actualizando datos…' :
            this.refreshError || this.detailsError ? 'No se pudo actualizar. Vuelve a pulsar el idioma para reintentar.' : '';
    }

    async handleLanguageClick(btn) {
        const language = btn.dataset.language;
        this.tmdbService.language = language;
        DOMUtils.getElements('.language-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.invalidateOutput();
        const revision = this.revision;
        this.languageChoice = 'mix';
        this.refreshing = true;
        this.refreshError = false;
        this.episodeTitles = [];
        DOMUtils.getElement('languageCoverage').hidden = true;
        DOMUtils.getElement('previewContent').replaceChildren();
        this.updateGenerationState();
        this.saveOptions();
        try {
            const refresh = this.selectedMovies.map(async item => {
                const updated = await this.tmdbService.localizeItem(item, language);
                if (this.revision === revision && this.selectedMovies.includes(item)) Object.assign(item, updated);
            });
            if (this.selectedItem) refresh.push(this.loadDetails(this.selectedItem));
            if (DOMUtils.getElement('searchInput').value.trim()) refresh.push(this.doSearch());
            await Promise.all(refresh);
            if (this.revision === revision) {
                this.updateSelectedMoviesPreview();
                this.updatePreview();
            }
        } catch (_) {
            if (this.revision === revision) this.refreshError = true;
        } finally {
            if (this.revision === revision) {
                this.refreshing = false;
                this.updateGenerationState();
                this.updatePreview();
            }
        }
    }

    handleModeClick(btn) {
        if (this.refreshing) return;
        const modeBtns = DOMUtils.getElements('.mode-btn');
        modeBtns.forEach(b => DOMUtils.removeClass(b, 'active'));
        DOMUtils.addClass(btn, 'active');
        this.invalidateOutput();
        this.episodeTitles = [];
        DOMUtils.getElement('languageCoverage').hidden = true;
        this.currentMode = btn.dataset.mode;
        this.updateModeUI();
        this.updatePreview();
        this.saveOptions();
    }

    updateModeUI() {
        const isTV = this.currentMode === 'tv';
        const isMulti = this.currentMode === 'multi-movies';
        
        const tvOnlyOptions = ['optSeasonEpisode', 'optEpisodeName', 'optAirDate', 'optIncludeEpisodeDirector'];
        tvOnlyOptions.forEach(id => {
            const opt = DOMUtils.getElement(id);
            if (opt) {
                opt.disabled = !isTV;
                const label = opt.parentElement;
                if (!isTV) {
                    DOMUtils.addClass(label, 'option-unavailable');
                } else {
                    DOMUtils.removeClass(label, 'option-unavailable');
                }
            }
        });

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
        this.selectedKey = null;
        this.detailsToken = null;
        this.loadingDetails = false;
        this.detailsError = false;
        this.updateGenerationState();
    }

    updatePreview() {
        const options = this.getCurrentOptions();
        if (this.refreshing || this.loadingDetails) return;
        if (options.isTV && this.selectedItem && !this.detailsError) {
            PopcornExport.render(PopcornExport.build([this.selectedItem], this.episodesList, options), DOMUtils.getElement('previewContent'), this.episodesList);
        } else if (!options.isTV && this.selectedMovies.length) {
            PopcornExport.render(PopcornExport.build(this.selectedMovies, [], options), DOMUtils.getElement('previewContent'));
        } else this.previewComponent.update(options, this.tmdbService.language);
    }

    getCurrentOptions() {
        const fields = {
            includeYear: 'optIncludeYear', includeSE: 'optSeasonEpisode', includeName: 'optEpisodeName',
            includeDate: 'optAirDate', includeRating: 'optIncludeRating', includeDirector: 'optIncludeDirector',
            includeGenre: 'optIncludeGenre', includeEpisodeDirector: 'optIncludeEpisodeDirector'
        };
        return { isTV: this.currentMode === 'tv', ...Object.fromEntries(
            Object.entries(fields).map(([key, id]) => [key, Boolean(DOMUtils.getElement(id)?.checked)])
        ) };
    }

    saveOptions() {
        const options = this.getCurrentOptions();
        options.currentMode = this.currentMode;
        options.language = this.tmdbService.language;
        this.storageService.save(todoPopcornConfig.storage.keys.options, options);
    }

    loadSavedOptions() {
        const saved = this.storageService.load(todoPopcornConfig.storage.keys.options);
        if (saved) {
            if (['tv', 'multi-movies'].includes(saved.currentMode)) this.currentMode = saved.currentMode;
            DOMUtils.getElements('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === this.currentMode));
            this.updateModeUI();
            const fields = {
                includeYear: 'optIncludeYear', includeSE: 'optSeasonEpisode', includeName: 'optEpisodeName',
                includeDate: 'optAirDate', includeRating: 'optIncludeRating', includeDirector: 'optIncludeDirector',
                includeGenre: 'optIncludeGenre', includeEpisodeDirector: 'optIncludeEpisodeDirector'
            };
            Object.entries(fields).forEach(([key, id]) => {
                if (typeof saved[key] === 'boolean') DOMUtils.getElement(id).checked = saved[key];
            });
            if (['es-ES', 'es-MX', 'en-US'].includes(saved.language)) this.tmdbService.language = saved.language;
            DOMUtils.getElements('.language-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.language === this.tmdbService.language));
            // Persist only supported preferences; legacy emoji and format values are discarded.
            this.saveOptions();
        }
        this.updatePreview();
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
        const language = this.tmdbService.language;
        const searchRevision = ++this.searchRevision;
        const searchInput = DOMUtils.getElement('searchInput');
        const searchBtn = DOMUtils.getElement('searchBtn');
        const resultsEl = DOMUtils.getElement('results');
        const outputModal = DOMUtils.getElement('outputModal');
        
        const q = searchInput.value.trim();
        if (!q) return;
        
        if (!this.refreshing) showGlobalLoader();
        
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
                results = await this.tmdbService.searchMulti(q, language);
                results = results.filter(item => item.media_type === 'tv' || (!item.title && item.name));
            } else {
                results = await this.tmdbService.searchMulti(q, language);
            }
            if (this.tmdbService.language !== language || this.searchRevision !== searchRevision) return;
            this.displayResults(results);
        } catch (error) {
            if (this.tmdbService.language !== language || this.searchRevision !== searchRevision) return;
            if (resultsEl) {
                DOMUtils.setHTML(resultsEl, '<p>Error buscando resultados. Por favor intenta de nuevo.</p>');
            }
        } finally {
            if (!this.refreshing) hideGlobalLoader();
            if (searchBtn) {
                searchBtn.classList.remove('loading');
                searchBtn.disabled = false;
                searchBtn.textContent = 'Buscar';
            }
        }
    }

    displayResults(items) {
        const language = this.tmdbService.language;
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
            const heading = document.createElement('h4');
            heading.textContent = `${title}${year ? ' (' + year + ')' : ''}`;
            const overview = document.createElement('p');
            overview.className = 'result-overview';
            overview.textContent = (it.overview || '').slice(0, 220);
            const creator = document.createElement('p');
            creator.className = 'result-director';
            info.append(heading, overview, creator);

            const badge = document.createElement('div');
            badge.className = 'result-badge';
            const directorEl = info.querySelector('.result-director');
            const meta = document.createElement('p');
            meta.className = 'result-meta';
            DOMUtils.setText(meta, it.vote_average ? `⭐ ${it.vote_average.toFixed(1)} / 10` : '');

            if (mediaType === 'tv') {
                DOMUtils.setText(badge, 'Serie');
                this.tmdbService.getTVDetails(it.id, language).then(tv => {
                    if (this.tmdbService.language !== language || !div.isConnected) return;
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
                this.tmdbService.getMovieDetails(it.id, language).then(movie => {
                    if (this.tmdbService.language !== language || !div.isConnected) return;
                    const duration = movie.runtime ? `${movie.runtime} min` : '';
                    DOMUtils.setText(badge, duration || 'Película');
                    if (movie.vote_average) {
                        DOMUtils.setText(meta, `⭐ ${movie.vote_average.toFixed(1)} / 10`);
                    }
                    this.tmdbService.getMovieCredits(it.id, language).then(credits => {
                        if (this.tmdbService.language !== language || !div.isConnected) return;
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
            if (this.selectedKey === div.dataset.key || this.selectedMovies.some(movie => this.getItemKey(movie) === div.dataset.key)) {
                if (this.selectedKey === div.dataset.key) this.selectedCard = div;
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
        if (this.refreshing) return;
        if (this.currentMode === 'multi-movies') {
            await this.toggleMovieSelection(it, card);
            return;
        }

        this.invalidateOutput();
        DOMUtils.getElement('languageCoverage').hidden = true;
        DOMUtils.getElement('languageCoverage').open = false;
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
        this.invalidateOutput();
        const revision = this.revision;
        const language = this.tmdbService.language;
        const key = this.getItemKey(it);
        const existingIndex = this.selectedMovies.findIndex(movie => this.getItemKey(movie) === key);
        if (existingIndex >= 0) {
            this.selectedMovies.splice(existingIndex, 1);
            card.classList.remove('selected');
        } else {
            showGlobalLoader();
            card.classList.add('loading');
            try {
                const updated = await this.tmdbService.localizeItem(it, language);
                if (this.revision !== revision || this.tmdbService.language !== language) return;
                Object.assign(it, updated);
            } catch (_) {
                this.showAlert('No se pudieron cargar los datos del título. Vuelve a seleccionarlo.');
                return;
            } finally {
                hideGlobalLoader();
                card.classList.remove('loading');
            }
            this.selectedMovies.push(it);
            card.classList.add('selected');
        }
        this.updateSelectedMoviesPreview();
        this.updatePreview();
    }

    async loadDetails(it) {
        const token = {};
        const language = this.tmdbService.language;
        this.detailsToken = token;
        this.loadingDetails = true;
        this.detailsError = false;
        this.episodeTitles = [];
        this.episodesList = [];
        this.updateGenerationState();
        try {
            const localized = await this.tmdbService.localizeItem(it, language);
            const data = await this.tmdbService.seasonTitles(it.id, localized.seasons || [], language);
            if (this.detailsToken !== token || this.tmdbService.language !== language || this.selectedItem !== it) return;
            Object.assign(it, localized);
            if (this.selectedCard) this.selectedCard.querySelector('h4').textContent = PopcornExport.title(it, { includeYear: true });
            this.failedSeasons = data.failedSeasons;
            this.translationUnavailable = data.unavailable;
            this.episodeTitles = data.rows;
            this.languageChoice = 'mix';
            this.episodesList = TitleLanguages.resolve(data.rows, language);
            this.renderCoverage();
        } catch (_) {
            if (this.detailsToken === token && this.tmdbService.language === language) {
                this.detailsError = true;
                this.showAlert('No se pudo cargar la serie. Vuelve a seleccionarla o pulsa su idioma para reintentar.');
            }
        } finally {
            if (this.detailsToken === token) {
                this.loadingDetails = false;
                this.updateGenerationState();
                this.updatePreview();
            }
        }
    }

    renderCoverage() {
        const language = this.tmdbService.language;
        const stats = TitleLanguages.coverage(this.episodeTitles, language, this.languageChoice);
        const panel = DOMUtils.getElement('languageCoverage');
        panel.hidden = !stats.total || stats.available[language] === stats.total;
        if (panel.hidden) return;
        const percent = count => stats.total ? (100 * count / stats.total).toFixed(1) : '0.0';
        DOMUtils.getElement('coverageWarning').textContent = 'Hay episodios sin título real en el idioma seleccionado.';
        const segments = DOMUtils.getElement('coverageSegments');
        segments.replaceChildren();
        Object.entries(stats.used).concat([['missing', stats.missing]]).forEach(([lang, count]) => {
            if (!count) return;
            const part = document.createElement('span');
            part.className = `language-${lang}`;
            part.style.width = `${percent(count)}%`;
            part.title = `${TitleLanguages.labels[lang] || 'Sin título real'}: ${count}`;
            segments.appendChild(part);
        });
        segments.setAttribute('aria-label', 'Títulos utilizados: ' + Object.entries(stats.used).map(([lang, count]) => `${TitleLanguages.labels[lang]} ${count}`).join(', ') + `; sin título real ${stats.missing}`);
        const bars = DOMUtils.getElement('coverageBars');
        bars.replaceChildren();
        Object.entries(TitleLanguages.labels).forEach(([lang, label]) => {
            const row = document.createElement('div');
            const caption = document.createElement('p');
            caption.textContent = `${label}: ${stats.available[lang]}/${stats.total} disponibles (${percent(stats.available[lang])}%) · ${stats.used[lang]} utilizados (${percent(stats.used[lang])}%)`;
            const bar = document.createElement('div');
            bar.className = 'coverage-bar';
            const fill = document.createElement('span');
            fill.className = `language-${lang}`;
            fill.style.width = `${percent(stats.available[lang])}%`;
            bar.appendChild(fill); row.append(caption, bar); bars.appendChild(row);
        });
        DOMUtils.getElement('coverageSeasons').textContent = stats.seasons.map(s => `Temporada ${s.season}: ${s.available}/${s.total} en ${TitleLanguages.labels[language]} (${s.available === s.total ? 'completa' : 'parcial'})`).join(' · ');
        DOMUtils.getElement('coverageMissing').textContent = (stats.missing ? `La elección deja ${stats.missing} episodios sin título real. Se conservará el código si está activado; no se inventarán nombres.` : '') +
            (this.translationUnavailable.length ? ' No se pudo consultar parte de las traducciones; las cifras cuentan solo los nombres comprobados.' : '');
        DOMUtils.getElement('coverageChoices').querySelectorAll('input').forEach(input => { input.checked = input.value === this.languageChoice; });
    }

    changeTitleLanguage(choice) {
        if (!['mix', ...Object.keys(TitleLanguages.labels)].includes(choice)) return;
        const wasGenerated = Boolean(this.lastGeneratedOutput);
        const wasOpen = DOMUtils.getElement('outputModal').classList.contains('visible');
        this.languageChoice = choice;
        this.episodesList = TitleLanguages.resolve(this.episodeTitles, this.tmdbService.language, choice);
        this.invalidateOutput();
        this.renderCoverage();
        this.updatePreview();
        if (wasGenerated) {
            this.lastGeneratedOutput = { document: PopcornExport.build([this.selectedItem], this.episodesList, this.getCurrentOptions()), episodes: this.episodesList, failedSeasons: this.failedSeasons };
            DOMUtils.getElement('viewPreviousBtn').disabled = false;
            // Update the saved JSON even when the user has closed the modal.
            DOMUtils.getElement('jsonOutput').value = PopcornExport.validate(this.lastGeneratedOutput.document).json;
            if (wasOpen) this.viewPreviousOutput();
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
                if (this.refreshing) return;
                const chip = event.target.closest('.movie-chip');
                const key = chip.dataset.key;
                this.invalidateOutput();
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
        this.invalidateOutput();
        this.refreshing = false;
        this.refreshError = false;
        this.searchRevision++;
        this.detailsToken = null;
        this.loadingDetails = false;
        this.detailsError = false;
        this.episodeTitles = [];
        DOMUtils.getElement('languageCoverage').hidden = true;
        this.updateGenerationState();
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
        if (this.generating || this.refreshing || this.refreshError) return;
        if (this.currentMode === 'tv' && (this.loadingDetails || this.detailsError)) {
            return this.showAlert('Espera a que termine la descarga o vuelve a seleccionar la serie si falló.');
        }
        const revision = this.revision;
        const language = this.tmdbService.language;
        const options = this.getCurrentOptions();
        const items = options.isTV ? (this.selectedItem ? [this.selectedItem] : []) : this.selectedMovies.slice();
        if (!items.length) return this.showAlert('Selecciona al menos un título.');
        const episodes = this.episodesList.map(ep => ({ ...ep }));
        const failedSeasons = options.isTV ? (this.failedSeasons || []).slice() : [];
        const button = DOMUtils.getElement('generateBtn');
        this.generating = true;
        button.disabled = true;
        showGlobalLoader();
        try {
            if (options.isTV && options.includeEpisodeDirector) {
                for (const ep of episodes) {
                    if (!ep.director) ep.director = await this.tmdbService.getEpisodeDirector(items[0].id, ep.season, ep.episode, language);
                }
            }
            if (this.revision !== revision || this.tmdbService.language !== language) return;
            this.lastGeneratedOutput = { document: PopcornExport.build(items, episodes, options), failedSeasons, episodes: options.isTV ? episodes : [] };
            this.viewPreviousOutput();
            DOMUtils.getElement('viewPreviousBtn').disabled = false;
        } catch (_) {
            this.showAlert('No se pudo generar el JSON. Vuelve a intentarlo.');
        } finally {
            this.generating = false;
            this.updateGenerationState();
            hideGlobalLoader();
        }
    }

    viewPreviousOutput() {
        if (!this.lastGeneratedOutput) return this.showAlert('No hay JSON anterior disponible.');
        const { document, failedSeasons } = this.lastGeneratedOutput;
        const { json, errors } = PopcornExport.validate(document);
        DOMUtils.getElement('jsonOutput').value = json;
        DOMUtils.getElement('jsonErrors').textContent = errors.join('\n');
        DOMUtils.getElement('incompleteWarning').hidden = !failedSeasons.length;
        DOMUtils.getElement('incompleteMessage').textContent = `Serie incompleta: no se pudieron descargar las temporadas ${failedSeasons.join(', ')}. Vuelve a seleccionar la serie para reintentar o acepta exportar sin esas temporadas.`;
        DOMUtils.getElement('acceptIncomplete').checked = false;
        PopcornExport.render(document, DOMUtils.getElement('outputPreview'), this.lastGeneratedOutput.episodes);
        DOMUtils.getElement('outputCoverage').appendChild(DOMUtils.getElement('languageCoverage'));
        DOMUtils.getElement('jsonDisclosure').open = !window.matchMedia('(max-width: 600px)').matches;
        this.updateCopyState();
        DOMUtils.getElement('outputModal').classList.add('visible');
    }

    updateCopyState() {
        const output = this.lastGeneratedOutput;
        DOMUtils.getElement('copyJson').disabled = !output || PopcornExport.validate(output.document).errors.length > 0 ||
            (output.failedSeasons.length > 0 && !DOMUtils.getElement('acceptIncomplete').checked);
    }

    async copyJson() {
        this.updateCopyState();
        const button = DOMUtils.getElement('copyJson');
        if (button.disabled) return;
        const field = DOMUtils.getElement('jsonOutput');
        // Always copy the validated snapshot rather than mutable textarea contents.
        field.value = PopcornExport.validate(this.lastGeneratedOutput.document).json;
        try {
            try {
                await navigator.clipboard.writeText(field.value);
            } catch (_) {
                field.select();
                if (!document.execCommand('copy')) throw new Error('No se pudo copiar');
            }
            button.textContent = '✓ JSON copiado';
            setTimeout(() => { button.textContent = 'Copiar JSON'; }, 1500);
        } catch (_) {
            this.showAlert('No se pudo copiar al portapapeles. Selecciona y copia manualmente el JSON validado.');
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


}

// Inicializar la aplicación cuando el DOM esté completamente cargado
function initApp() {
    const root = document.querySelector('.todo-popcorn');
    if (!root || root.todoPopcornApp) return;
    try {
        console.log('DOM completamente cargado, inicializando aplicación...');
        const app = new TodoPopcornApp();
        root.todoPopcornApp = app;
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

// Exponer initApp globalmente para que el router pueda llamarla
window.initTodoPopcorn = initApp;
})();
