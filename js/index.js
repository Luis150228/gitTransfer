import { buildTreemapDataTable } from '../../jsonTable.js';
import { makeTooltip } from './tooltip.js';
import { byId } from '../utils/dom.js';

const _registry = new Map(); // containerId -> redraw fn
let _resizeBound = false;

/** Decora etiquetas del 1er nivel: "FOLIO – ORIGEN" */
function decorateFolioLabels(data, rows) {
	const origenByFolio = new Map();
	for (const r of rows) {
		const folio = String(r.incidencia_principal || '').trim();
		const origen = String(r.app ?? r.origen ?? '').trim();
		if (folio && origen && !origenByFolio.has(folio)) origenByFolio.set(folio, origen);
	}
	for (let i = 0; i < data.getNumberOfRows(); i++) {
		const parent = data.getValue(i, 1);
		if (parent === 'Tickets') {
			const idPath = data.getValue(i, 0);
			const folio = (String(idPath).split('│')[1] || '').trim();
			const origen = origenByFolio.get(folio);
			data.setFormattedValue(i, 0, origen ? `${folio} – ${origen}` : folio);
		}
	}
}

export function renderTreemap(containerId, rows, keys, { dateField, onSelectIncident } = {}) {
	const container = byId(containerId);
	if (!container) {
		console.error(`#${containerId} no existe`);
		return;
	}

	const tableJson = buildTreemapDataTable(rows, keys, { rootLabel: 'Tickets' });
	const data = new google.visualization.DataTable(tableJson);
	decorateFolioLabels(data, rows);

	// Reusar instancia por container
	let tree = _registry.get(`${containerId}::_treeInstance`);
	if (!tree) {
		tree = new google.visualization.TreeMap(container);
		_registry.set(`${containerId}::_treeInstance`, tree);
	}

	// Evita listeners duplicados
	google.visualization.events.removeAllListeners(tree);

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

	// Click -> notifica incidente seleccionado (solo nivel 1)
	google.visualization.events.addListener(tree, 'select', () => {
		const sel = tree.getSelection();
		if (!sel.length) return;

		const row = sel[0].row;
		if (row == null) return;

		const idPath = data.getValue(row, 0) || '';
		const parent = data.getValue(row, 1);
		const parts = idPath.split('│').slice(1); // sin "Tickets"
		const incident = parts[0] || '';
		const isFirstLevel = parts.length === 1;

		const detail = { row, idPath, parent, incident, isFirstLevel };
		if (isFirstLevel && typeof onSelectIncident === 'function') {
			onSelectIncident(incident, detail);
		}

		container.dispatchEvent(new CustomEvent('treemap:select', { detail }));
	});

	// Redraw para resize
	_registry.set(containerId, () => {
		const tjson = buildTreemapDataTable(rows, keys, { rootLabel: 'Tickets' });
		const d2 = new google.visualization.DataTable(tjson);
		decorateFolioLabels(d2, rows);
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
