// Utilidades para formateo de texto
export const FormatUtils = {
    // Formatear título según el formato seleccionado
    formatTitle(title, year, format) {
        if (!title) return '';
        
        switch (format) {
            case '1':
                // Título (fecha)
                return year ? `${title} (${year})` : title;
            case '2':
                // [fecha] Título
                return year ? `[${year}] ${title}` : title;
            case '3':
                // 2022 · Título
                return year ? `${year} · ${title}` : title;
            default:
                return title;
        }
    },

    // Formatear episodio según el formato seleccionado
    formatEpisode(season, episode, name, format) {
        const seasonStr = season ? `T${String(season).padStart(2, '0')}` : '';
        const episodeStr = episode ? `E${String(episode).padStart(2, '0')}` : '';
        const code = seasonStr && episodeStr ? `${seasonStr}|${episodeStr}` : '';

        switch (format) {
            case '1':
                // T01|E01 - Nombre
                return code && name ? `${code} - ${name}` : code || name;
            case '2':
                // Nombre - T01|E01
                return name && code ? `${name} - ${code}` : name || code;
            default:
                return name || code;
        }
    },

    // Formatear rating
    formatRating(rating) {
        return rating ? ` ⭐${rating.toFixed(1)} / 10` : '';
    },

    // Formatear fecha
    formatDate(date) {
        if (!date) return '';
        return ` ${date}`;
    },

    // Formatear creador
    formatCreator(creator) {
        return creator ? ` | Creador: ${creator}` : '';
    },

    // Formatear género
    formatGenre(genre) {
        return genre ? ` | ${genre}` : '';
    },

    // Formatear director de episodio
    formatEpisodeDirector(director) {
        return director ? ` | Dir: ${director}` : '';
    },

    // Formatear código de temporada/episodio
    formatSeasonEpisode(season, episode) {
        const seasonStr = season ? `T${String(season).padStart(2, '0')}` : '';
        const episodeStr = episode ? `E${String(episode).padStart(2, '0')}` : '';
        return seasonStr && episodeStr ? `${seasonStr}|${episodeStr}` : seasonStr || episodeStr;
    }
};
