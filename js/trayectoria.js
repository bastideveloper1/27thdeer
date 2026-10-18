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
    window.initTrayectoria = async function () {
        const root = document.querySelector('.trajectory');
        if (!root || root.dataset.ready) return;
        root.dataset.ready = 'true';
        const message = root.querySelector('.trajectory-message');
        const list = root.querySelector('.trajectory-line');
        const dialog = root.querySelector('dialog');
        const detail = root.querySelector('.trajectory-detail');
        let entries = [], selected = 'all', opener;
        const navigation = root.querySelector('.trajectory-navigation');
        const svgNS = 'http://www.w3.org/2000/svg';
        const connectors = document.createElementNS(svgNS, 'svg');
        connectors.classList.add('trajectory-connectors');
        connectors.setAttribute('aria-hidden', 'true');
        root.prepend(connectors);
        function updateConnectors() {
            connectors.replaceChildren();
            if (!window.matchMedia('(min-width:769px)').matches) return;
            const navLink = document.querySelector('.subtle-nav a[href="#/proyectos"]');
            if (!navLink) return;
            const origin = root.getBoundingClientRect();
            const nav = navLink.getBoundingClientRect();
            const startX = nav.left + nav.width / 2 - origin.left;
            const startY = nav.bottom - origin.top + 6;
            const buttons = Array.from(root.querySelectorAll('[data-filter]'));
            const targets = buttons.map(button => {
                const rect = button.getBoundingClientRect();
                return {x:rect.left + rect.width / 2 - origin.left, y:rect.top - origin.top - 4};
            });
            const branchY = targets[0].y - 8;
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', `M ${startX} ${startY} V ${branchY} H ${targets[0].x} M ${startX} ${branchY} H ${targets[targets.length - 1].x} ` + targets.map(target => `M ${target.x} ${branchY} V ${target.y}`).join(' '));
            connectors.append(path);

        }

        const timelinePulse = node('span', '', 'trajectory-axis-pulse');
        timelinePulse.setAttribute('aria-hidden', 'true');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let pulsePoints = [], pulseStart = null;
        function updatePulseGeometry() {
            const rows = Array.from(list.querySelectorAll('.trajectory-entry'));
            if (!rows.length) {pulsePoints = []; return;}
            list.append(timelinePulse);
            const bounds = list.getBoundingClientRect();
            const horizontal = window.matchMedia('(min-width:769px)').matches;
            pulsePoints = rows.map(row => {
                const rect = row.getBoundingClientRect();
                return {row, x:rect.left - bounds.left + list.scrollLeft + (horizontal ? 6 : 7), y:rect.top - bounds.top + list.scrollTop + (horizontal ? rect.height / 2 : 13)};
            });
            pulseStart = null;
        }
        function animateTimeline(time) {
            if (!root.isConnected) return;
            timelinePulse.hidden = reducedMotion.matches || !pulsePoints.length || dialog.open;
            if (!timelinePulse.hidden) {
                if (pulseStart === null) pulseStart = time;
                const duration = Math.max(6000, pulsePoints.length * 1800);
                const progress = ((time - pulseStart) % duration) / duration;
                const position = progress * Math.max(1, pulsePoints.length - 1);
                const index = Math.min(Math.floor(position), pulsePoints.length - 1);
                const from = pulsePoints[index], to = pulsePoints[Math.min(index + 1, pulsePoints.length - 1)];
                const fraction = position - index;
                timelinePulse.style.left = (from.x + (to.x - from.x) * fraction) + 'px';
                timelinePulse.style.top = (from.y + (to.y - from.y) * fraction) + 'px';
                pulsePoints.forEach((point, i) => point.row.classList.toggle('trajectory-node-lit', Math.abs(position - i) < .12));
            } else {
                pulsePoints.forEach(point => point.row.classList.remove('trajectory-node-lit'));
            }
            requestAnimationFrame(animateTimeline);
        }
        requestAnimationFrame(animateTimeline);

        function updateNavigation() {
            const max = list.scrollWidth - list.clientWidth;
            navigation.querySelector('[data-direction="-1"]').disabled = list.scrollLeft <= 2;
            navigation.querySelector('[data-direction="1"]').disabled = list.scrollLeft >= max - 2;
        }
        navigation.querySelectorAll('[data-direction]').forEach(button => {
            button.onclick = () => list.scrollBy({left: Number(button.dataset.direction) * list.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
        });
        list.addEventListener('scroll', updateNavigation, {passive:true});
        const resizeObserver = new ResizeObserver(() => {
            if (!root.isConnected) { resizeObserver.disconnect(); return; }
            updateNavigation();
            updateConnectors();
            updatePulseGeometry();
        });
        resizeObserver.observe(list);
        resizeObserver.observe(root.querySelector('.trajectory-toolbar'));

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
                const date = node('div', dateLabel(entry.date), 'trajectory-date');
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
            requestAnimationFrame(() => { updateNavigation(); updatePulseGeometry(); });
        }
        root.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => {
            selected = button.dataset.filter;
            root.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
            render();
        });
        try {
            const response = await fetch(new URL('data/timeline.json', document.baseURI));
            if (!response.ok) throw new Error('No se pudo cargar la trayectoria');
            const data = await response.json();
            if (data.version !== 1 || !Array.isArray(data.entries)) throw new Error('Formato de trayectoria incorrecto');
            entries = data.entries.filter(entry => entry.id && entry.title && labels[entry.type]).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
            if (root.isConnected) render();
        } catch (_) {message.hidden = false; message.textContent = 'No se pudo cargar la trayectoria. Vuelve a abrir Proyectos para intentarlo de nuevo.';}
    };
    window.initTrayectoria();
})();
