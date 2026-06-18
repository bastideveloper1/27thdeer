import { config } from '../config/config.js';

// Servicio para interactuar con la API de TMDB
export class TMDBService {
    constructor() {
        this.apiKey = config.tmdb.apiKey;
        this.baseURL = config.tmdb.baseURL;
        this.imageBase = config.tmdb.imageBase;
    }

    // Búsqueda multi (películas, series, personas)
    async searchMulti(query) {
        const url = `${this.baseURL}/search/multi?api_key=${this.apiKey}&language=es-ES&query=${encodeURIComponent(query)}&include_adult=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error en la búsqueda: ' + res.status);
        const data = await res.json();
        return data.results || [];
    }

    // Obtener detalles de una serie de TV
    async getTVDetails(id) {
        const url = `${this.baseURL}/tv/${id}?api_key=${this.apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener detalles de TV: ' + res.status);
        return await res.json();
    }

    // Obtener créditos de una serie de TV
    async getTVCredits(id) {
        const url = `${this.baseURL}/tv/${id}/credits?api_key=${this.apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener créditos de TV: ' + res.status);
        return await res.json();
    }

    // Obtener detalles de una temporada
    async getSeasonDetails(tvId, seasonNum) {
        const url = `${this.baseURL}/tv/${tvId}/season/${seasonNum}?api_key=${this.apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener temporada: ' + res.status);
        return await res.json();
    }

    // Obtener créditos de un episodio
    async getEpisodeCredits(tvId, seasonNum, episodeNum) {
        const url = `${this.baseURL}/tv/${tvId}/season/${seasonNum}/episode/${episodeNum}/credits?api_key=${this.apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener créditos de episodio: ' + res.status);
        return await res.json();
    }

    // Obtener detalles de una película
    async getMovieDetails(id) {
        const url = `${this.baseURL}/movie/${id}?api_key=${this.apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener detalles de película: ' + res.status);
        return await res.json();
    }

    // Obtener créditos de una película
    async getMovieCredits(id) {
        const url = `${this.baseURL}/movie/${id}/credits?api_key=${this.apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener créditos de película: ' + res.status);
        return await res.json();
    }

    // Obtener creador de una serie de TV
    async getTVCreator(id) {
        try {
            const tv = await this.getTVDetails(id);
            if (tv.created_by && tv.created_by.length > 0) {
                return tv.created_by.map(c => c.name).join(', ');
            }
            // Fallback a credits/crew
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

    // Obtener géneros de una serie de TV
    async getTVGenres(id) {
        try {
            const tv = await this.getTVDetails(id);
            if (tv.genres && tv.genres.length > 0) {
                return tv.genres.map(g => g.name).join(', ');
            }
            return '';
        } catch (e) {
            console.warn('Error al obtener géneros de TV:', e);
            return '';
        }
    }

    // Obtener creador de una película
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

    // Obtener géneros de una película
    async getMovieGenres(id) {
        try {
            const movie = await this.getMovieDetails(id);
            if (movie.genres && movie.genres.length > 0) {
                return movie.genres.map(g => g.name).join(', ');
            }
            return '';
        } catch (e) {
            console.warn('Error al obtener géneros de película:', e);
            return '';
        }
    }

    // Obtener director de un episodio
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

    // Obtener URL de imagen
    getImageURL(path) {
        return path ? `${this.imageBase}${path}` : '';
    }
}
