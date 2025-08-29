// ===== Imports =====
import { DEFAULT_KEYS, REPORT_TITLE } from './js/config.js';
import { byId } from './js/utils/dom.js';
import { resolveDateField } from './js/data/load.js';
import { filterTickets } from './js/filters/index.js';
import { renderTreemap } from './js/treemap/index.js';
import { renderReport } from './js/report/renderReport.js';
import { saveReportAsPng } from './js/export/saveImage.js';
import { fetchGet, fetchPOST } from '../../../js/connect.js';
import { divLoader } from '../../../js/elements.js';
// (si ya no usas estos helpers porque el zoom vive en renderReport, puedes quitar esta línea)
// import { initImageZoomOnce, setScreenFailImage } from './helpersMain.js';

// ===== Estado =====
let ALL = { data: [] };
let DATE_FIELD = 'abierto';
let CURRENT_REPORT_INCIDENT = '';
const LEVEL_USR = Number(sessionStorage.getItem('lev') || 0);

// ===== Google Charts ready =====
google.charts.load('current', { packages: ['treemap'] });
const chartsReady = () => new Promise((resolve) => google.charts.setOnLoadCallback(resolve));

// ===== Auto-refresh (treemap + aviso actual) =====
let __autoRefreshTimer = null;
let __autoRefreshMs = 0;

async function refreshAll() {
	// Evita pisar edición manual
	const isEditing = byId('toggleEditBtn')?.dataset.state === 'on';
	if (isEditing) return;

	try {
		// 1) Pide TODO otra vez
		const resp = await fetchGet('genericos', { generics: true, order: 'AllGenerics' });
		if (!resp || !resp.data) return;

		ALL = resp; // mantener { data: [...] }
		DATE_FIELD = resolveDateField(ALL.data, 'abierto');

		// 2) Redibuja el TREEMAP con la data fresca
		renderTreemap('chart_generics', ALL.data, DEFAULT_KEYS, { dateField: DATE_FIELD });

		// 3) Si hay un Aviso visible, refresca ese incidente también
		//    - primero intenta leerlo del DOM (lo escribe renderReport)
		const incidentFromDOM = document.querySelector('[data-key="principalTicket"]')?.textContent?.trim();
		const currentIncident = incidentFromDOM || CURRENT_REPORT_INCIDENT || '';

		if (currentIncident) {
			const generico = { generics: true, incident: currentIncident, noPrint: true };
			const dataTable = await fetchGet('genericos', generico);
			if (dataTable?.code === '200') {
				renderReport({
					rows: dataTable.data,
					incidentQuery: currentIncident,
					dateField: 'abierto',
					reportTitle: REPORT_TITLE,
					mountId: 'report',
				});
				CURRENT_REPORT_INCIDENT = currentIncident;
			}
		}
	} catch (e) {
		console.error('[auto-refresh]', e);
	}
}

function startAutoRefresh(minutes = 10) {
	stopAutoRefresh();
	__autoRefreshMs = Math.max(1, minutes) * 60 * 1000;
	__autoRefreshTimer = setInterval(refreshAll, __autoRefreshMs);
	// Disparo inmediato para no esperar al primer intervalo
	refreshAll();
}

function stopAutoRefresh() {
	if (__autoRefreshTimer) clearInterval(__autoRefreshTimer);
	__autoRefreshTimer = null;
}

// Pausa cuando la pestaña no está visible; reanuda al volver
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

	// Carga inicial
	ALL = await fetchGet('genericos', { generics: true, order: 'AllGenerics' });
	DATE_FIELD = resolveDateField(ALL.data, 'abierto');

	// Primer render
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
		byId(id)?.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') applyFilters();
		});
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

	// Editar reporte (según nivel)
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

			// Guardar al salir de edición
			if (byId('toggleEditBtn').dataset.state === 'off') {
				const out = {};
				const cardBody = document.querySelector('.report-body');
				const dataKeys = cardBody?.querySelectorAll('[data-key]') || [];
				for (const dataKey of dataKeys) {
					const key = dataKey.dataset.key;
					const content = dataKey.innerText;
					out[key] = content;
				}
				divLoader();
				await fetchPOST('genericos', out);
				divLoader();
			}
		});
	}

	// Auto-refresh cada 10 min (cámbialo a 15 si quieres)
	startAutoRefresh(2);

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
	// 1) Treemap
	renderTreemap('chart_generics', rows, DEFAULT_KEYS, { dateField: DATE_FIELD });

	// 2) Aviso (para la primera carga o cuando filtras desde inputs)
	const info = renderReport({
		rows,
		incidentQuery,
		dateField: DATE_FIELD,
		reportTitle: REPORT_TITLE,
		mountId: 'report',
	});

	// Guarda el último incidente renderizado (si vino desde filtros o primer load)
	CURRENT_REPORT_INCIDENT = info?.incident || CURRENT_REPORT_INCIDENT || '';
}
