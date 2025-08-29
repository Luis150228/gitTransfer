import { DEFAULT_KEYS, REPORT_TITLE } from './js/config.js';
import { byId } from './js/utils/dom.js';
import { fetchAll, resolveDateField } from './js/data/load.js';
import { filterTickets } from './js/filters/index.js';
import { renderTreemap } from './js/treemap/index.js';
import { renderReport } from './js/report/renderReport.js';
import { saveReportAsPng } from './js/export/saveImage.js';
import { fetchGet, fetchPOST } from '../../../js/connect.js';
import { divLoader, divLoaderCreate } from '../../../js/elements.js';
import { initImageZoomOnce, setScreenFailImage } from './helpersMain.js';

let ALL = [];
let DATE_FIELD = 'abierto';
let CURRENT_REPORT_INCIDENT = '';
let LEVEL_USR = sessionStorage.getItem('lev');
if (LEVEL_USR > 1) {
	byId('toggleEditBtn')?.setAttribute('disabled', true);
	byId('toggleEditBtn').style.display = 'none';
}

google.charts.load('current', { packages: ['treemap'] });
const chartsReady = () => new Promise((resolve) => google.charts.setOnLoadCallback(resolve));

(async () => {
	await chartsReady();
	// divLoaderCreate();
	divLoader();
	ALL = await fetchGet('genericos', { generics: true, order: 'AllGenerics' });
	DATE_FIELD = resolveDateField(ALL.data, 'abierto');

	draw(ALL.data);

	byId('applyFilters')?.addEventListener('click', applyFilters);
	byId('clearFilters')?.addEventListener('click', () => {
		byId('qIncident').value = '';
		byId('qRegion').value = '';
		byId('qDate').value = '';
		draw(ALL.data);
	});
	divLoader();

	['qIncident', 'qRegion', 'qDate'].forEach((id) => {
		byId(id)?.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') applyFilters();
		});
	});

	byId('saveReportBtn')?.addEventListener('click', async () => {
		const node = byId('report');
		await saveReportAsPng({
			node,
			incidentName: CURRENT_REPORT_INCIDENT,
			background: getComputedStyle(document.body).backgroundColor || '#121212',
		});
	});

	byId('toggleEditBtn')?.addEventListener('click', async () => {
		const editables = document.querySelectorAll('#report .value.editable');
		const on = byId('toggleEditBtn').dataset.state !== 'on';
		editables.forEach((n) => n.setAttribute('contenteditable', on ? 'true' : 'false'));
		byId('toggleEditBtn').dataset.state = on ? 'on' : 'off';
		byId('toggleEditBtn').textContent = on ? 'Terminar edición' : 'Editar';

		if (byId('toggleEditBtn').dataset.state == 'off') {
			const out = {}; /**Objeto Vacio */
			const cardBody = document.querySelector('.report-body');
			const dataKeys = cardBody.querySelectorAll('[data-key]');
			for (const dataKey of dataKeys) {
				const key = dataKey.dataset.key;
				const content = dataKey.innerText;
				out[key] = content; /*Llenar objeto**/
			}
			divLoader();
			await fetchPOST('genericos', out);
			divLoader();
			// console.log(out)
			// console.log(updateGeneric);
			// return out
		}
	});
})().catch(console.error);

function applyFilters() {
	const incident = byId('qIncident')?.value.trim();
	const region = byId('qRegion')?.value.trim();
	const onlyDate = byId('qDate')?.value;
	const rows = filterTickets(ALL.data, {
		incident: incident || undefined,
		region: region || undefined,
		onlyDate: onlyDate || undefined,
		dateField: DATE_FIELD,
	});
	draw(rows, incident);
}

function draw(rows, incidentQuery) {
	// 1) Dibuja treemap y pasa callback de selección
	renderTreemap('chart_generics', rows, DEFAULT_KEYS, {
		dateField: DATE_FIELD,
		onSelectIncident: (incident) => {
			// Cada clic en el treemap vuelve a filtrar y REDIBUJA TODO
			const filtered = filterTickets(ALL.data, {
				incident,
				dateField: DATE_FIELD,
			});
			draw(filtered, incident); // <- aquí se reactualiza Aviso + Imagen
		},
	});

	// 2) Render del “Aviso”
	const info = renderReport({
		rows,
		incidentQuery,
		dateField: DATE_FIELD,
		reportTitle: REPORT_TITLE,
		mountId: 'report',
	});

	CURRENT_REPORT_INCIDENT = info.incident || '';

	// 3) Modal/zoom + imagen (esto es lo que ya hicimos)
	initImageZoomOnce();

	const btn = document.getElementById('ScreenFailBtn');
	const imgEl = document.getElementById('ScreenFailImg');
	if (!btn || !imgEl) return;

	// soporta img_64 o img_b64; no dependas solo de img_size
	const base64Raw = info?.img_64 || info?.img_b64 || '';
	const dataUrl = String(base64Raw || '').startsWith('data:')
		? base64Raw
		: base64Raw
		? `data:image/*;base64,${base64Raw}`
		: '';

	const hasImage =
		(Number.isFinite(Number(info?.img_size)) && Number(info.img_size) > 0) ||
		(typeof base64Raw === 'string' && base64Raw.length > 100);

	console.log('[ScreenFail] incident=', info.incident, 'img_size=', info?.img_size, 'b64_len=', base64Raw?.length || 0);

	if (hasImage && dataUrl) {
		imgEl.style.transform = '';
		imgEl.removeAttribute('src');
		requestAnimationFrame(() => {
			imgEl.src = dataUrl;
			imgEl.__resetZoom?.();
		});

		btn.style.display = 'inline-block';
		btn.disabled = false;
		btn.removeAttribute('aria-disabled');
		btn.title = 'Ver pantalla de error';
		btn.textContent = 'Pantalla error';
	} else {
		imgEl.removeAttribute('src');
		imgEl.style.transform = '';
		btn.style.display = 'none';
		btn.disabled = true;
		btn.setAttribute('aria-disabled', 'true');
		btn.title = 'Sin imagen disponible';
		btn.textContent = 'Pantalla error';
	}
}
