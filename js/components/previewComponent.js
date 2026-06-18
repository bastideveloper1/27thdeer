import { FormatUtils } from '../utils/formatUtils.js';

// Componente para manejar la vista previa en tiempo real
export class PreviewComponent {
    constructor(previewElement) {
        this.previewElement = previewElement;
    }

    // Actualizar vista previa según las opciones seleccionadas
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
            // Modo: Buscar una serie y sus episodios
            const year = '2023';
            let titleText = 'Ejemplo: Goosebumps';
            
            // Aplicar formato de título seleccionado
            titleText = FormatUtils.formatTitle('Goosebumps', year, titleFormat);

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
            // Modo: Buscar series y películas
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

    // Mostrar placeholder
    showPlaceholder() {
        this.previewElement.textContent = 'Selecciona opciones para ver la vista previa...';
        this.previewElement.classList.add('preview-placeholder');
    }
}
