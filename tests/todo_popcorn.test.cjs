const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise production code without booting the page or making TMDB requests.
const elements = new Map();
const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', checked: false, disabled: false, style: {}, setAttribute() {}, querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, replaceChildren() {}, appendChild() {} });
    return elements.get(id);
};
const document = { querySelectorAll: () => [], readyState: 'loading', addEventListener() {}, getElementById: element, createElement: tag => ({ tag, style: {}, children: [], append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); } }) };
const context = { window: { document, matchMedia: () => ({ matches: false }) }, document, TextEncoder, URLSearchParams, console, setTimeout, navigator: { clipboard: { writeText: async () => {} } } };
vm.createContext(context);
let source = fs.readFileSync('js/todo_popcorn_traditional.js', 'utf8');
source = source.replace('// Inicializar la aplicación cuando el DOM', 'window.testApi = { PopcornExport, TodoPopcornApp, TitleLanguages, TMDBService };\n// Inicializar la aplicación cuando el DOM');
vm.runInContext(source, context);
const { PopcornExport: exporter, TodoPopcornApp, TitleLanguages, TMDBService } = context.window.testApi;
const options = { isTV: false, includeSE: true, includeName: true, includeYear: true };
const movie = { title: 'Una "película" 🎬', release_date: '2024-01-01', vote_average: 8.5, director: 'Directora', genres: 'Drama' };
const episodes = [
    { season: 1, episode: 1, name: 'Inicio', air_date: '2024-01-01', director: 'Ana' },
    { season: 1, episode: 2, name: 'Final' },
    { season: 2, episode: 1, name: 'Regreso' }
];
const plain = value => JSON.parse(JSON.stringify(value));
function validate(doc) { return exporter.validate(doc); }

test('multiple titles become independent tasks; JSON escapes text and preserves order', () => {
    const doc = exporter.build([movie, { name: 'Serie' }], [], options);
    assert.deepEqual(plain(doc), { format: 'arachnode.structure', version: 1, items: [
        { type: 'task', title: 'Una "película" 🎬 (2024)', description: '' },
        { type: 'task', title: 'Serie', description: '' }
    ] });
    assert.deepEqual(JSON.parse(validate(doc).json), plain(doc));
    assert.equal(validate(doc).errors.length, 0);
});

test('series are one layer with ordered tasks and optional metadata only in descriptions', () => {
    const doc = exporter.build([movie], episodes, { ...options, isTV: true, includeDate: true, includeRating: true, includeDirector: true, includeGenre: true, includeEpisodeDirector: true, useEvolution: true });
    const root = doc.items[0];
    assert.equal(root.type, 'layer');
    assert.deepEqual(plain(root.children.map(ep => ep.title)), ['T01|E01 - Inicio', 'T01|E02 - Final', 'T02|E01 - Regreso']);
    assert.equal(root.title, 'Una "película" 🎬 (2024)');
    assert.match(root.description, /Puntuación: 8.5 \/ 10\nCreador: Directora\nGénero: Drama\nFecha: 2024-01-01/);
    assert.equal(root.children[0].description, 'Fecha de emisión: 2024-01-01\nDirector: Ana');
    assert.equal(validate(doc).errors.length, 0);
});

test('episode options remove codes/names, ignore legacy formats and reject empty titles', () => {
    const build = changes => exporter.build([movie], episodes, { ...options, isTV: true, ...changes });
    assert.equal(build({ includeSE: false }).items[0].children[0].title, 'Inicio');
    assert.equal(build({ includeName: false }).items[0].children[0].title, 'T01|E01');
    assert.equal(build({ format: '2', emoji: '🎬' }).items[0].children[0].title, 'T01|E01 - Inicio');
    assert.ok(validate(build({ includeSE: false, includeName: false })).errors.length);
    assert.equal(build({}).items[0].children[0].description, '');
});

test('importer limits: Unicode titles, UTF-16 descriptions, count including layer, depth and internal references', () => {
    const task = (title = 'OK', description = '') => ({ type: 'task', title, description });
    const doc = items => ({ format: 'arachnode.structure', version: 1, items });
    assert.equal(validate(doc([task('🎬'.repeat(100), 'x'.repeat(16000))])).errors.length, 0);
    for (const item of [task('🎬'.repeat(101)), task('   '), task('x', '🎬'.repeat(8001)), task('[[arachnode:x]]'), task('x', '[[arachnode:x]]')]) {
        assert.ok(validate(doc([item])).errors.length);
    }
    assert.equal(validate(doc(Array.from({ length: 1000 }, () => task()))).errors.length, 0);
    assert.ok(validate(doc([{ type: 'layer', title: 'Serie', description: '', children: Array.from({ length: 1000 }, () => task()) }])).errors.length);
    let nested = task();
    for (let i = 1; i < 32; i++) nested = { type: 'layer', title: 'Capa', description: '', children: [nested] };
    assert.equal(validate(doc([nested])).errors.length, 0);
    assert.ok(validate(doc([{ type: 'layer', title: 'Extra', description: '', children: [nested] }])).errors.length);
    assert.ok(validate(doc([])).errors.length);
    const large = doc(Array.from({ length: 200 }, () => task('OK', '界'.repeat(5000))));
    assert.ok(validate(large).errors.some(e => e.includes('2 MiB')));
});

test('failed seasons stay explicit and copying requires acknowledgement; invalid JSON stays blocked', async () => {
    const app = Object.create(TodoPopcornApp.prototype);
    app.selectedItem = { id: 1, title: 'Serie' };
    app.selectedMovies = [];
    app.updatePreview = () => {};
    app.tmdbService = {
        language: 'es-MX',
        localizeItem: async item => ({ ...item, seasons: [{ season_number: 0 }, { season_number: 1 }, { season_number: 2 }] }),
        seasonTitles: TMDBService.prototype.seasonTitles,
        getSeasonDetails: async (_, n) => { if (n === 2) throw new Error('offline'); return { episodes: [{ episode_number: 1, name: 'Piloto' }] }; }
    };
    await app.loadDetails(app.selectedItem);
    assert.deepEqual(plain(app.failedSeasons), [2]);
    assert.equal(app.episodesList.length, 1);
    app.lastGeneratedOutput = { document: exporter.build([movie], app.episodesList, { ...options, isTV: true }), failedSeasons: app.failedSeasons };
    app.viewPreviousOutput();
    assert.equal(element('incompleteWarning').hidden, false);
    assert.match(element('incompleteMessage').textContent, /temporadas 2/);
    assert.equal(element('copyJson').disabled, true);
    element('acceptIncomplete').checked = true;
    app.updateCopyState();
    assert.equal(element('copyJson').disabled, false);
    app.lastGeneratedOutput.document.items[0].title = 'x'.repeat(101);
    app.updateCopyState();
    assert.equal(element('copyJson').disabled, true);
});

test('generation and clipboard use the validated snapshot, including previous output', async () => {
    const app = Object.create(TodoPopcornApp.prototype);
    app.currentMode = 'multi-movies';
    app.tmdbService = { language: 'es-ES' };
    app.selectedMovies = [movie, { name: 'Otra serie' }];
    app.episodesList = [];
    app.getCurrentOptions = () => options;
    await app.generateOutput();
    const generated = JSON.parse(element('jsonOutput').value);
    assert.equal(generated.items.length, 2);
    assert.ok(generated.items.every(item => item.type === 'task'));
    let copied;
    context.navigator.clipboard.writeText = async text => { copied = text; };
    element('jsonOutput').value = 'tampered';
    await app.copyJson();
    assert.deepEqual(JSON.parse(copied), generated);
    app.selectedMovies = [];
    app.viewPreviousOutput();
    assert.deepEqual(JSON.parse(element('jsonOutput').value), generated);
});

test('fixed titles support optional year and ignore legacy customizations', () => {
    const legacy = { ...options, titleFormat: '2', format: '2', emoji: '🍿', useEvolution: true };
    assert.equal(exporter.build([movie], [], legacy).items[0].title, 'Una "película" 🎬 (2024)');
    assert.equal(exporter.build([movie], [], { ...legacy, includeYear: false }).items[0].title, 'Una "película" 🎬');
});

test('season groups start collapsed and never alter the exported hierarchy', () => {
    const doc = exporter.build([movie], episodes, { ...options, isTV: true });
    const original = JSON.stringify(doc);
    const target = { children: [], replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); } };
    exporter.render(doc, target, episodes);
    const root = target.children[0].children[0];
    const groups = root.children.filter(node => node.tag === 'details');
    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map(group => group.children[0].textContent), ['Temporada 1 · 2 episodios', 'Temporada 2 · 1 episodio']);
    assert.ok(groups.every(group => !group.open));
    assert.equal(JSON.stringify(doc), original);
    assert.ok(doc.items[0].children.every(child => child.type === 'task' && !child.children));
});


test('real names, regional priority and availability differ from used translations', () => {
    for (const generic of ['', '   ', 'Episodio 12', 'Episode 2', 'Capítulo 3', 'Untitled', 'T01|E01']) assert.equal(TitleLanguages.real(generic), false);
    assert.equal(TitleLanguages.real('Pilot'), true);
    const rows = [
        { season: 1, names: { 'es-MX': 'Nombre latino', 'es-ES': 'Nombre España', 'en-US': 'English name' } },
        { season: 2, names: { 'es-MX': 'Episodio 1', 'es-ES': 'Alternativa', 'en-US': 'Alternative' } },
        { season: 2, names: { 'es-MX': '', 'es-ES': '', 'en-US': 'Last title' } }
    ];
    const stats = TitleLanguages.coverage(rows, 'es-MX');
    assert.deepEqual(plain(stats.available), { 'es-MX': 1, 'es-ES': 2, 'en-US': 3 });
    assert.deepEqual(plain(stats.used), { 'es-MX': 1, 'es-ES': 1, 'en-US': 1 });
    assert.deepEqual(plain(TitleLanguages.resolve(rows, 'es-ES').map(e => e.name)), ['Nombre España', 'Alternativa', 'Last title']);
    assert.deepEqual(plain(TitleLanguages.resolve(rows, 'en-US').map(e => e.name)), ['English name', 'Alternative', 'Last title']);
    assert.equal(TitleLanguages.coverage(rows, 'es-MX', 'es-MX').missing, 2);
    assert.equal(TitleLanguages.resolve(rows, 'es-MX', 'es-MX')[1].name, '');
});

test('TMDB cache shares in-flight requests, separates languages and retries failures', async () => {
    const service = new TMDBService();
    service.apiKey = 'fixture';
    let calls = 0;
    context.fetch = async () => { calls++; return { ok: true, json: async () => ({ episodes: [] }) }; };
    await Promise.all([service.getSeasonDetails(1, 1, 'es-MX'), service.getSeasonDetails(1, 1, 'es-MX')]);
    assert.equal(calls, 1);
    await service.getSeasonDetails(1, 1, 'es-ES');
    assert.equal(calls, 2);
    context.fetch = async () => { calls++; return { ok: false, status: 503 }; };
    await assert.rejects(service.getSeasonDetails(1, 2, 'en-US'));
    await assert.rejects(service.getSeasonDetails(1, 2, 'en-US'));
    assert.equal(calls, 4);
});

test('series refresh is atomic: stale language responses cannot replace the current selection', async () => {
    const app = Object.create(TodoPopcornApp.prototype);
    const item = { id: 1, name: 'Original', media_type: 'tv' };
    app.selectedItem = item;
    app.selectedMovies = [];
    app.updatePreview = () => {};
    app.renderCoverage = () => {};
    const waiting = {};
    app.tmdbService = {
        language: 'es-MX',
        localizeItem: (_, lang) => new Promise(resolve => { waiting[lang] = resolve; }),
        seasonTitles: async (_, __, lang) => ({ rows: [{ season: 1, episode: 1, names: { [lang]: lang + ' title' } }], unavailable: [], failedSeasons: [] })
    };
    const older = app.loadDetails(item);
    app.tmdbService.language = 'en-US';
    const newer = app.loadDetails(item);
    waiting['en-US']({ ...item, name: 'Current', seasons: [] });
    await newer;
    waiting['es-MX']({ ...item, name: 'Stale', seasons: [] });
    await older;
    assert.equal(app.selectedItem, item);
    assert.equal(item.name, 'Current');
    assert.equal(app.episodesList[0].name, 'en-US title');
    assert.equal(app.loadingDetails, false);
});

test('changing coverage choice regenerates JSON without adding language labels or invented names', () => {
    const app = Object.create(TodoPopcornApp.prototype);
    app.tmdbService = { language: 'es-MX' };
    app.selectedItem = { name: 'Serie' };
    app.episodeTitles = [{ season: 1, episode: 1, names: { 'es-MX': 'Episodio 1', 'es-ES': 'Nombre real' } }];
    app.failedSeasons = [];
    app.lastGeneratedOutput = {};
    app.renderCoverage = () => {};
    app.updatePreview = () => {};
    app.getCurrentOptions = () => ({ ...options, isTV: true });
    app.changeTitleLanguage('es-ES');
    assert.equal(JSON.parse(element('jsonOutput').value).items[0].children[0].title, 'T01|E01 - Nombre real');
    app.changeTitleLanguage('es-MX');
    assert.equal(JSON.parse(element('jsonOutput').value).items[0].children[0].title, 'T01|E01');
});
