import { escapeHtml } from '../utils/format.js';
import { byId } from '../utils/dom.js';
import { parseDateTime, formatAmPm } from '../utils/date.js';
import { toInt } from '../utils/format.js';
import { REPORT_TITLE } from '../config.js';

export function renderReport({ rows, incidentQuery, dateField, mountId = 'report' }) {
	const mount = byId(mountId);
	mount.textContent = ''
	if (!mount) return { incident: '' };
	if (!rows || rows.length === 0) {
		mount.innerHTML = '';
		return { incident: '' };
	}

	const groups = new Map();
	for (const r of rows) {
		const k = String(r.incidencia_principal || 'N/A');
		if (!groups.has(k)) groups.set(k, []);
		groups.get(k).push(r);
	}
	const q = (incidentQuery || '').toLowerCase();
	let targetKey = null;
	if (q) {
		for (const k of groups.keys()) {
			if (k.toLowerCase() === q) {
				targetKey = k;
				break;
			}
		}
		if (!targetKey)
			for (const k of groups.keys()) {
				if (k.toLowerCase().includes(q)) {
					targetKey = k;
					break;
				}
			}
	}
	if (!targetKey) targetKey = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)[0][0];

	const g = groups.get(targetKey) || [];

	const dates = g.map((x) => parseDateTime(x?.[dateField])).filter(Boolean);
	const inicio = dates.length ? new Date(Math.min(...dates)) : null;
	const corte = dates.length ? new Date(Math.max(...dates)) : null;

	const withSec = g.find((x) => toInt(x?.incidencia_secundarias) > 0) || g[0] || {};

	const aplicacion = withSec?.app || '';
	const falla = withSec?.nombreproyecto || 'Reportes de Fallas en Totem tomaturnos';
	const mensajeError = withSec?.errorScreen || '';
	const impacto = withSec?.impact_app ?? '';
	const afectacion = withSec?.Numero_afectados ?? '';
	const incidentePadre = targetKey;
	const incidentesAsoc = withSec?.incidencia_secundarias ?? '';
	const hInicio = formatAmPm(inicio);
	const hCorte = formatAmPm(corte);
	const img_size = Number(withSec?.img_size ?? NaN);
	const img_64   = withSec?.img_b64 || '';

	mount.innerHTML = `
    <div class="report-card">
      <div class="report-header">
        <div class="slot-logo-header"><img src="./js/generics/images/logoServiceDesk.svg" alt="Logotipo ServiceDesk"></div>
        <div class="title">${REPORT_TITLE} - ${escapeHtml(aplicacion).toUpperCase()}</div>
      </div>
      <div class="report-body">
        <div class="row-aviso"><span class="label">Aplicación:</span>
          <div class="value editable" contenteditable="true" data-key="aplication" data-placeholder="Escribe la aplicación">${escapeHtml(
						aplicacion
					)}</div></div>
        <div class="row-aviso"><span class="label">Falla:</span>
          <div class="value editable" contenteditable="true" data-key="fail" data-placeholder="Describe la falla">${escapeHtml(
						falla
					)}</div></div>
        <div class="row-aviso"><span class="label">Mensaje de Error / Pantalla de Error:</span>
          <div class="value editable" contenteditable="true" data-key="errorScreen" data-placeholder="Mensaje o pantalla de error">${escapeHtml(
						mensajeError
					)}</div></div>
        <div class="row-aviso"><span class="label">Impacto:</span>
          <div class="value editable" contenteditable="true" data-key="affected" data-placeholder="Número de afectados / detalle">${escapeHtml(
						impacto
					)}</div></div>
        <div class="row-aviso"><span class="label">Afectación:</span>
          <div class="value editable" contenteditable="true" data-key="affectedService" data-placeholder="Área/servicio afectado">${escapeHtml(
						afectacion
					)}</div></div>
        <div class="row-aviso"><span class="label">Incidente Padre:</span>
          <span class="value strong" data-key="principalTicket">${escapeHtml(incidentePadre)}</span></div>
        <div class="row-aviso"><span class="label">Incidentes Asociados:</span>
          <div class="value editable" contenteditable="true" data-key="associateTickets" data-placeholder="Cantidad o lista">${escapeHtml(
						incidentesAsoc
					)}</div></div>
        <div class="row-aviso"><span class="label">Horario de inicio:</span>
          <div class="value editable" contenteditable="true" data-key="dateBegin" data-placeholder="YYYY-MM-DD hh:mm am/pm">${escapeHtml(
						hInicio
					)}</div></div>
        <div class="row-aviso"><span class="label">Hora de corte:</span>
          <div class="value editable" contenteditable="true" data-key="dateCut" data-placeholder="YYYY-MM-DD hh:mm am/pm">${escapeHtml(
						hCorte
					)}</div></div>
      </div>
      <div class="report-imagen">
		<div class="modal fade" id="fail-screen-modal" tabindex="-1" aria-labelledby="fail-screen-modalLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered modal-xl">
				<div class="modal-content">
				<div class="modal-header">
					<h1 class="modal-title fs-5" id="fail-screen-modalLabel">Pantalla de Error</h1>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
				</div>

				<div class="modal-body">
					<!-- Viewport scrollable -->
					<div id="screenZoomViewport">
					<!-- Stage transformable -->
					<img id="ScreenFailImg" class="img-fluid" alt="Pantalla de error" draggable="false" />
					</div>
				</div>

				<div class="modal-footer">
					<div class="btn-group me-auto" role="group" aria-label="Zoom controls">
					<button type="button" class="btn btn-outline-secondary btn-sm" id="zoomOutBtn" title="Alejar">−</button>
					<button type="button" class="btn btn-outline-secondary btn-sm" id="zoomResetBtn" title="Restablecer">100%</button>
					<button type="button" class="btn btn-outline-secondary btn-sm" id="zoomInBtn" title="Acercar">+</button>
					</div>
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
				</div>
				</div>
			</div>
		</div>
	  </div>
      <div class="report-footer">
        <div class="slot-brand-footer"><img src="./js/generics/images/Banco_Santander_Logotipo.png" alt="Logotipo Santander"></div>
        <div class="sd">SERVICE DESK<br/>Soporte usuarios y Edificios<br/>End User Technologies<br/>Tel. 5551741101 Ext. 70767<br/>Bandejas Ext. 79500</div>
      </div>
    </div>`;

	return { incident: targetKey, img_size, img_64 };
}
