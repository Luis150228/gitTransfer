import { DEFAULT_KEYS, REPORT_TITLE } from './js/config.js';
import { byId } from './js/utils/dom.js';
import { resolveDateField } from './js/data/load.js';
import { filterTickets } from './js/filters/index.js';
import { renderTreemap } from './js/treemap/index.js';
import { renderReport } from './js/report/renderReport.js';
import { saveReportAsPng } from './js/export/saveImage.js';
import { fetchGet, fetchPOST } from '../../../js/connect.js';
import { divLoader } from '../../../js/elements.js';
import { initImageZoomOnce, setScreenFailImage } from './helpersMain.js';

let ALL = { data: [] };
let DATE_FIELD = 'abierto';
let CURRENT_REPORT_INCIDENT = '';
const LEVEL_USR = Number(sessionStorage.getItem('lev') || 0);

// Google Charts
google.charts.load('current', { packages: ['treemap'] });
const chartsReady = () => new Promise((resolve) => google.charts.setOnLoadCallback(resolve));

// ===== Auto-refresh =====
let __autoRefreshTimer = null;
let __autoRefreshMs = 0;

async function refreshOnce() {
	const isEditing = byId('toggleEditBtn')?.dataset.state === 'on';
	if (isEditing) return; // no pises edición

	try {
		divLoader();
		const resp = await fetchGet('genericos', { generics: true, order: 'AllGenerics' });
		if (!resp || !resp.data) return;

		ALL = resp;
		DATE_FIELD = resolveDateField(ALL.data, 'abierto');

		const incident = CURRENT_REPORT_INCIDENT || undefined;
		const rowsToDraw = incident ? filterTickets(ALL.data, { incident, dateField: DATE_FIELD }) : ALL.data;

		draw(rowsToDraw, incident);
	} catch (e) {
		console.error('[auto-refresh]', e);
	} finally {
		divLoader();
	}
}

function startAutoRefresh(minutes = 10) {
	stopAutoRefresh();
	__autoRefreshMs = Math.max(1, minutes) * 60 * 1000;
	__autoRefreshTimer = setInterval(refreshOnce, __autoRefreshMs);
	refreshOnce(); // arranque inmediato
}

function stopAutoRefresh() {
	if (__autoRefreshTimer) clearInterval(__autoRefreshTimer);
	__autoRefreshTimer = null;
}

document.addEventListener('visibilitychange', () => {
	if (document.hidden) {
		stopAutoRefresh();
	} else if (__autoRefreshMs) {
		startAutoRefresh(__autoRefreshMs / 60000);
	}
});

// ===== Arranque =====
(async () => {
	await chartsReady();
	divLoader();

	ALL = await fetchGet('genericos', { generics: true, order: 'AllGenerics' });
	DATE_FIELD = resolveDateField(ALL.data, 'abierto');

	draw(ALL.data);

	// Filtros
	byId('applyFilters')?.addEventListener('click', applyFilters);
	byId('clearFilters')?.addEventListener('click', () => {
		byId('qIncident') && (byId('qIncident').value = '');
		byId('qRegion') && (byId('qRegion').value = '');
		byId('qDate') && (byId('qDate').value = '');
		CURRENT_REPORT_INCIDENT = '';
		draw(ALL.data);
	});
	['qIncident', 'qRegion', 'qDate'].forEach((id) => {
		byId(id)?.addEventListener('keydown', (e) => e.key === 'Enter' && applyFilters());
	});

	// Guardar PNG
	byId('saveReportBtn')?.addEventListener('click', async () => {
		const node = byId('report');
		await saveReportAsPng({
			node,
			incidentName: CURRENT_REPORT_INCIDENT,
			background: getComputedStyle(document.body).backgroundColor || '#121212',
		});
	});

	// Editar aviso
	if (LEVEL_USR > 1) {
		byId('toggleEditBtn')?.setAttribute('disabled', true);
		if (byId('toggleEditBtn')) byId('toggleEditBtn').style.display = 'none';
	} else {
		byId('toggleEditBtn')?.addEventListener('click', async () => {
			const editables = document.querySelectorAll('#report .value.editable');
			const on = byId('toggleEditBtn').dataset.state !== 'on';
			editables.forEach((n) => n.setAttribute('contenteditable', on ? 'true' : 'false'));
			byId('toggleEditBtn').dataset.state = on ? 'on' : 'off';
			byId('toggleEditBtn').textContent = on ? 'Terminar edición' : 'Editar';

			if (byId('toggleEditBtn').dataset.state === 'off') {
				const out = {};
				const cardBody = document.querySelector('.report-body');
				const dataKeys = cardBody?.querySelectorAll('[data-key]') || [];
				for (const dataKey of dataKeys) out[dataKey.dataset.key] = dataKey.innerText;
				divLoader();
				await fetchPOST('genericos', out);
				divLoader();
			}
		});
	}

	// Pausar auto-refresh con el modal abierto (opcional)
	const modalEl = document.getElementById('fail-screen-modal');
	modalEl?.addEventListener('shown.bs.modal', stopAutoRefresh);
	modalEl?.addEventListener('hidden.bs.modal', () => {
		if (__autoRefreshMs) startAutoRefresh(__autoRefreshMs / 60000);
	});

	// Auto-refresh: 10 min (cámbialo a 15 si quieres)
	startAutoRefresh(10);

	divLoader();
})().catch(console.error);

// ===== Lógica de UI =====
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

	CURRENT_REPORT_INCIDENT = incident || '';
	draw(rows, incident);
}

function draw(rows, incidentQuery) {
	// 1) Treemap con callback
	renderTreemap('chart_generics', rows, DEFAULT_KEYS, {
		dateField: DATE_FIELD,
		onSelectIncident: (incident) => {
			const filtered = filterTickets(ALL.data, { incident, dateField: DATE_FIELD });
			CURRENT_REPORT_INCIDENT = incident || '';
			draw(filtered, incident);
		},
	});

	// 2) Aviso
	const info = renderReport({
		rows,
		incidentQuery,
		dateField: DATE_FIELD,
		reportTitle: REPORT_TITLE,
		mountId: 'report',
	});

	CURRENT_REPORT_INCIDENT = info.incident || CURRENT_REPORT_INCIDENT || '';

	// 3) Modal + Imagen
	initImageZoomOnce();

	const btn = document.getElementById('ScreenFailBtn');
	const imgEl = document.getElementById('ScreenFailImg');
	if (!btn || !imgEl) return;

	const base64Raw = info?.img_64 || info?.img_b64 || '';
	const hasImage =
		(Number.isFinite(Number(info?.img_size)) && Number(info.img_size) > 0) ||
		(typeof base64Raw === 'string' && base64Raw.length > 100);

	if (hasImage) {
		setScreenFailImage(base64Raw);
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
