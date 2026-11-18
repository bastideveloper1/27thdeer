const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise production code without booting the page or making TMDB requests.
const elements = new Map();
const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', checked: false, disabled: false, style: {}, classList: { add() {}, remove() {} }, replaceChildren() {}, appendChild() {} });
    return elements.get(id);
};
const document = { readyState: 'loading', addEventListener() {}, getElementById: element, createElement: () => ({ style: {}, appendChild() {} }) };
const context = { window: { document }, document, TextEncoder, console, setTimeout, navigator: { clipboard: { writeText: async () => {} } } };
vm.createContext(context);
let source = fs.readFileSync('js/todo_popcorn_traditional.js', 'utf8');
source = source.replace('// Inicializar la aplicación cuando el DOM', 'window.testApi = { PopcornExport, TodoPopcornApp };\n// Inicializar la aplicación cuando el DOM');
vm.runInContext(source, context);
const { PopcornExport: exporter, TodoPopcornApp } = context.window.testApi;
const options = { isTV: false, includeSE: true, includeName: true, titleFormat: '1', format: '1', emoji: '' };
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
    assert.deepEqual(plain(root.children.map(ep => ep.title)), ['🍿 T01|E01 - Inicio', 'T01|E02 - Final', '🍿 T02|E01 - Regreso']);
    assert.equal(root.title, 'Una "película" 🎬 (2024)');
    assert.match(root.description, /Puntuación: 8.5 \/ 10\nCreador: Directora\nGénero: Drama\nFecha: 2024-01-01/);
    assert.equal(root.children[0].description, 'Fecha de emisión: 2024-01-01\nDirector: Ana');
    assert.equal(validate(doc).errors.length, 0);
});

test('episode options remove codes/names, preserve reverse format and reject empty titles', () => {
    const build = changes => exporter.build([movie], episodes, { ...options, isTV: true, ...changes });
    assert.equal(build({ includeSE: false }).items[0].children[0].title, 'Inicio');
    assert.equal(build({ includeName: false }).items[0].children[0].title, 'T01|E01');
    assert.equal(build({ format: '2', emoji: '🎬' }).items[0].children[0].title, '🎬 Inicio - T01|E01');
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
    app.tmdbService = {
        getTVDetails: async () => ({ seasons: [{ season_number: 0 }, { season_number: 1 }, { season_number: 2 }] }),
        getTVCreator: async () => '', getTVGenres: async () => '',
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
