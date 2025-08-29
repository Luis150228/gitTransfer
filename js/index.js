import { buildTreemapDataTable } from '../../jsonTable.js';
import { makeTooltip } from './tooltip.js';
import { byId } from '../utils/dom.js';
import { fetchGet, fetchPOST } from '../../../../../js/connect.js';
import { renderReport } from '../report/renderReport.js';
import { REPORT_TITLE } from '../config.js';

const _registry = new Map();
let _resizeBound = false;

export function renderTreemap(containerId, rows, keys, { dateField } = {}) {
	const container = byId(containerId);
	if (!container) {
		console.error(`#${containerId} no existe`);
		return;
	}

	const tableJson = buildTreemapDataTable(rows, keys, { rootLabel: 'Tickets' });
	const data = new google.visualization.DataTable(tableJson);

	// Mapea folio -> origen_analist (primera ocurrencia no vacía)
	const origenByFolio = new Map();
	for (const r of rows) {
	const folio  = String(r.incidencia_principal || '').trim();
	const origen = String(r.app ?? r.origen ?? '').trim();
	if (folio && origen && !origenByFolio.has(folio)) {
		origenByFolio.set(folio, origen);
	}
	}

	// Pone 'f' (formatted label) solo en el nivel de folio (parent === 'Tickets')
	for (let i = 0; i < data.getNumberOfRows(); i++) {
	const idPath = data.getValue(i, 0);
	const parent = data.getValue(i, 1);
	if (parent === 'Tickets') { // este row es un folio
		const folio = (String(idPath).split('│')[1] || '').trim();
		const origen = origenByFolio.get(folio);
		// No tocar el 'v' (idPath); solo el 'f' que se renderiza visualmente
		data.setFormattedValue(i, 0, origen ? `${folio} – ${origen}` : folio);
	}
	}


	const tree = new google.visualization.TreeMap(container);

	const showSimpleTooltip = makeTooltip({ data, rows, keys, dateField });

	const options = {
		enableHighlight: true,
		maxDepth: 1,
		maxPostDepth: 2,
		minHighlightColor: '#FDF2F2',
		midHighlightColor: '#EF4444',
		maxHighlightColor: '#7F1D1D',
		minColor: '#7F1D1D',
		midColor: '#DC2626',
		maxColor: '#450A0A',
		headerHeight: 15,
		showScale: true,
		height: 600,
		fontColor: '#ffffff',
		fontFamily: 'Arial, Helvetica, sans-serif',
		generateTooltip: showSimpleTooltip,
	};

	tree.draw(data, options);
	/***************Control Click**********************/
	google.visualization.events.addListener(tree, 'select', async () => {
		const sel = tree.getSelection();
		if (!sel.length) return;

		const row = sel[0].row;
		if (row == null) return;

		const idPath = data.getValue(row, 0) || '';    // ej: "Tickets│INC057414910│METRO SUR│2025-08-12│16"
		const parent = data.getValue(row, 1);          // ej: "Tickets│INC057414910" (o "Tickets" en 1er nivel)
		const parts  = idPath.split('│').slice(1);     // sin "Tickets"
		const incident = parts[0] || '';               // INCxxxxx si es 1er nivel

		// ¿es 1er nivel? -> la ruta sólo tiene 1 segmento tras "Tickets"
		const isFirstLevel = parts.length === 1;

		if (isFirstLevel) {
			// console.log({ idPath, parent, incident, isFirstLevel });
			const generico = {generics : true, incident : incident, noPrint : true}
			const divReport = document.getElementById('report')
			const divCardAviso = document.getElementById('card-aviso')
			const actionBtns = document.querySelector('.report-actions')
			divReport.innerHTML = `
			<div class="load-card-aviso">						
				<img src="./js/generics/images/logoServiceDesk.svg" alt="Logotipo ServiceDesk" class="load-aviso">
				<div class="d-flex justify-content-center">
					<div class="spinner-border spinner-border-xl" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
			`
			actionBtns.classList.add('invisible');
			divCardAviso.classList.remove('d-none');
			const dataTable = await fetchGet('genericos', generico)
			// console.log(dataTable)
			if (dataTable.code == '200') {
				const info = {
					rows: dataTable.data,
					incidentQuery: incident,
					dateField: 'abierto',
					reportTitle: REPORT_TITLE,
					mountId: 'report',
				  }
				renderReport(info)
				actionBtns.classList.remove('invisible');
			}
		}


		// Si quieres notificar a tu app:
		const container = document.getElementById('chart_generics'); // o el containerId que uses
		container?.dispatchEvent(new CustomEvent('treemap:select', {
			detail: { row, idPath, parent, incident, isFirstLevel }
		}));
	});
	/***************Control Click**********************/

	// guarda redibujador
	_registry.set(containerId, () => {
		// Re-crear data y tree para tomar nuevos rows
		const tjson = buildTreemapDataTable(rows, keys, { rootLabel: 'Tickets' });
		const d2 = new google.visualization.DataTable(tjson);
		const show2 = makeTooltip({ data: d2, rows, keys, dateField });
		tree.draw(d2, { ...options, generateTooltip: show2 });
	});

	if (!_resizeBound) {
		_resizeBound = true;
		window.addEventListener(
			'resize',
			() => {
				_registry.forEach((fn) => fn());
			},
			{ passive: true }
		);
	}
}
