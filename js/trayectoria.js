(function () {
    'use strict';
    const labels = {project: 'Proyecto', education: 'Formación', milestone: 'Hito'};
    const node = (tag, text, className) => {
        const el = document.createElement(tag);
        if (text) el.textContent = text;
        if (className) el.className = className;
        return el;
    };
    function safeUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        try {
            const url = new URL(value, document.baseURI);
            return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
        } catch (_) { return null; }
    }
    function dateLabel(value) {
        if (!value) return 'Fecha por confirmar';
        if (/^\d{4}$/.test(value)) return value;
        if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return 'Fecha por confirmar';
        const date = new Date(value.length === 7 ? value + '-01T12:00:00' : value + 'T12:00:00');
        return Number.isNaN(date.getTime()) ? 'Fecha por confirmar' : date.toLocaleDateString('es-CL', {year:'numeric', month:'short', ...(value.length === 10 ? {day:'numeric'} : {})});
    }
    function tags(values) {
        const list = node('div', '', 'trajectory-tags');
        (values || []).forEach(value => list.append(node('span', value)));
        return list;
    }
    function gallery(images) {
        const list = node('div', '', 'trajectory-gallery');
        (images || []).forEach(item => {
            const src = safeUrl(item.src);
            if (!src) return;
            const img = node('img'); img.src = src; img.alt = item.alt || ''; img.loading = 'lazy';
            list.append(img);
        });
        return list;
    }
    function link(item) {
        const url = safeUrl(item.url);
        const el = node(url ? 'a' : 'span', item.title + (url ? ' ↗' : ' · No disponible'), url ? '' : 'trajectory-unavailable');
        if (url) {el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer';}
        return el;
    }
    window.initTrayectoria = async function (data) {
        const root = document.querySelector('.trajectory');
        if (!root || root.dataset.ready) return;
        root.dataset.ready = 'true';
        const message = root.querySelector('.trajectory-message');
        const list = root.querySelector('.trajectory-line');
        const dialog = root.querySelector('dialog');
        const detail = root.querySelector('.trajectory-detail');
        let entries = [], selected = 'all', opener;
        const navigation = root.querySelector('.trajectory-navigation');
        const progress = root.querySelector('.trajectory-progress');
        const desktop = window.matchMedia('(min-width:769px)');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        function updateNavigation() {
            const max = Math.max(0, list.scrollWidth - list.clientWidth);
            navigation.querySelector('[data-direction="-1"]').disabled = list.scrollLeft <= 2;
            navigation.querySelector('[data-direction="1"]').disabled = list.scrollLeft >= max - 2;
            const bounds = list.getBoundingClientRect();
            const distance = desktop.matches ? max : Math.max(0, bounds.bottom + window.scrollY - window.innerHeight);
            const position = desktop.matches ? list.scrollLeft : window.scrollY;
            const fraction = distance > 0 ? Math.max(0, Math.min(1, position / distance)) : 1;
            progress.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
            progress.firstElementChild.style.transform = `scaleX(${fraction})`;
        }
        function move(direction) {
            list.scrollBy({left: direction * list.clientWidth * .85, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
        }
        navigation.querySelectorAll('[data-direction]').forEach(button => {
            button.onclick = () => move(Number(button.dataset.direction));
        });
        list.addEventListener('keydown', event => {
            if (!desktop.matches || event.target !== list) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                move(event.key === 'ArrowLeft' ? -1 : 1);
            } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                list.scrollTo({left: event.key === 'Home' ? 0 : list.scrollWidth, behavior: 'instant'});
            }
        });
        list.addEventListener('scroll', updateNavigation, {passive:true});
        function onPageScroll() {
            if (!root.isConnected) {
                window.removeEventListener('scroll', onPageScroll);
                window.removeEventListener('resize', onPageScroll);
                return;
            }
            if (!desktop.matches) updateNavigation();
        }
        window.addEventListener('scroll', onPageScroll, {passive:true});
        window.addEventListener('resize', onPageScroll);
        const resizeObserver = new ResizeObserver(() => {
            if (!root.isConnected) {
                resizeObserver.disconnect();
                window.removeEventListener('scroll', onPageScroll);
                window.removeEventListener('resize', onPageScroll);
                return;
            }
            updateNavigation();
        });
        resizeObserver.observe(list);

        dialog.querySelector('.trajectory-close').onclick = () => dialog.close();
        dialog.addEventListener('click', event => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();}});
        dialog.addEventListener('close', () => {if (opener?.isConnected) opener.focus();});
        function show(entry, button) {
            if (button) opener = button;
            detail.replaceChildren(node('span', labels[entry.type], 'trajectory-category'));
            const title = node('h2', entry.title); title.id = 'trajectory-detail-title'; detail.append(title);
            detail.append(node('p', dateLabel(entry.date) + (entry.status ? ' · ' + entry.status : '')));
            detail.append(tags([...(entry.technologies || []), ...(entry.skills || [])]));
            const blocks = entry.blocks?.length ? entry.blocks : [{type:'paragraph', text:entry.summary}];
            blocks.forEach(block => {
                if (block.title) detail.append(node('h3', block.title));
                if (block.type === 'heading' && block.text) detail.append(node('h3', block.text));
                if (block.type === 'paragraph' && block.text) detail.append(node('p', block.text));
                if (block.type === 'list') {const ul = node('ul'); (block.items || []).forEach(item => ul.append(node('li', item))); detail.append(ul);}
                if (block.type === 'image') detail.append(gallery([block]));
                if (block.type === 'gallery') detail.append(gallery(block.images));
                if (block.type === 'link') detail.append(link(block));
                if (block.type === 'tags') detail.append(tags(block.items));
            });
            if (entry.images?.length) detail.append(gallery(entry.images));
            const related = entries.filter(item => item.id !== entry.id && ((item.relatedIds || []).includes(entry.id) || (entry.relatedIds || []).includes(item.id)));
            if (related.length) {detail.append(node('h3', 'Entradas relacionadas')); related.forEach(item => {const b = node('button', item.title, 'trajectory-related'); b.type = 'button'; b.onclick = () => show(item); detail.append(b);});}
            if (entry.links?.length) {const links = node('div', '', 'trajectory-detail-links'); entry.links.forEach(item => links.append(link(item))); detail.append(links);}
            if (!dialog.open) dialog.showModal();
            detail.scrollTop = 0;
        }
        function render() {
            list.replaceChildren();
            list.scrollLeft = 0;
            const filtered = entries.filter(entry => selected === 'all' || entry.type === selected);
            message.hidden = !!filtered.length;
            message.textContent = 'Todavía no hay entradas en esta categoría.';
            filtered.forEach(entry => {
                const row = node('li', '', 'trajectory-entry');
                const date = node('time', dateLabel(entry.date), 'trajectory-date');
                if (entry.date && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(entry.date)) date.setAttribute('datetime', entry.date);
                const card = node('button', '', 'trajectory-card'); card.type = 'button'; card.setAttribute('aria-haspopup', 'dialog'); card.setAttribute('aria-label', 'Ver detalle de ' + entry.title);
                const body = node('div'); body.append(node('h2', entry.title));
                body.append(node('span', 'Explorar ↗', 'trajectory-open'));
                card.append(body);
                const image = entry.images?.[0];
                if (image && safeUrl(image.src)) {const img = node('img'); img.src = safeUrl(image.src); img.alt = image.alt || ''; img.loading = 'lazy'; card.append(img);}
                else card.style.gridTemplateColumns = '1fr';
                card.onclick = () => show(entry, card);
                row.append(date, card); list.append(row);
            });
            updateNavigation();
        }
        root.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => {
            selected = button.dataset.filter;
            root.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
            render();
        });
        try {
            if (!data) {
                const response = await fetch(new URL('data/timeline.json', document.baseURI));
                if (!response.ok) throw new Error('No se pudo cargar la trayectoria');
                data = await response.json();
            }
            if (data.version !== 1 || !Array.isArray(data.entries)) throw new Error('Formato de trayectoria incorrecto');
            entries = data.entries.filter(entry => entry.id && entry.title && labels[entry.type]).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
            if (root.isConnected) render();
        } catch (_) {message.hidden = false; message.textContent = 'No se pudo cargar la trayectoria. Vuelve a abrir Proyectos para intentarlo de nuevo.';}
    };
})();
