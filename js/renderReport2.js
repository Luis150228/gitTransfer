import { escapeHtml } from '../utils/format.js';
import { byId } from '../utils/dom.js';
import { parseDateTime, formatAmPm } from '../utils/date.js';
import { toInt } from '../utils/format.js';
import { REPORT_TITLE } from '../config.js';

export function renderReport({ rows, incidentQuery, dateField, mountId = 'report' }) {
	const mount = byId(mountId);
	if (!mount) return { incident: '' };

	// Limpiar render anterior (incluye modal previo, así no quedan listeners “huérfanos”)
	mount.innerHTML = '';
	if (!rows || rows.length === 0) return { incident: '' };

	// --- Agrupar por incidente padre y elegir target ---
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

	// --- Fechas e item representativo ---
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

	// --- Imagen (base64) que viene del dataset ---
	const img_b64 = String(withSec?.img_b64 || withSec?.img_64 || '');
	const hasImage = img_b64 && img_b64.length > 100;

	// --- Render HTML (incluye modal con controles de zoom) ---
	mount.innerHTML = `
    <div class="report-card">
      <div class="report-header">
        <div class="slot-logo-header">
          <img src="./js/generics/images/logoServiceDesk.svg" alt="Logotipo ServiceDesk">
        </div>
        <div class="title">${REPORT_TITLE}${aplicacion ? ' - ' + escapeHtml(aplicacion).toUpperCase() : ''}</div>
      </div>

      <div class="report-body">
        <div class="row-aviso"><span class="label">Aplicación:</span>
          <div class="value editable" contenteditable="true" data-key="aplication">${escapeHtml(aplicacion)}</div></div>

        <div class="row-aviso"><span class="label">Falla:</span>
          <div class="value editable" contenteditable="true" data-key="fail">${escapeHtml(falla)}</div></div>

        <div class="row-aviso"><span class="label">Mensaje de Error / Pantalla de Error:</span>
          <div class="value editable" contenteditable="true" data-key="errorScreen">${escapeHtml(
						mensajeError
					)}</div></div>

        <div class="row-aviso"><span class="label">Impacto:</span>
          <div class="value editable" contenteditable="true" data-key="affected">${escapeHtml(impacto)}</div></div>

        <div class="row-aviso"><span class="label">Afectación:</span>
          <div class="value editable" contenteditable="true" data-key="affectedService">${escapeHtml(
						afectacion
					)}</div></div>

        <div class="row-aviso"><span class="label">Incidente Padre:</span>
          <span class="value strong" data-key="principalTicket">${escapeHtml(incidentePadre)}</span></div>

        <div class="row-aviso"><span class="label">Incidentes Asociados:</span>
          <div class="value editable" contenteditable="true" data-key="associateTickets">${escapeHtml(
						incidentesAsoc
					)}</div></div>

        <div class="row-aviso"><span class="label">Horario de inicio:</span>
          <div class="value editable" contenteditable="true" data-key="dateBegin">${escapeHtml(hInicio)}</div></div>

        <div class="row-aviso"><span class="label">Hora de corte:</span>
          <div class="value editable" contenteditable="true" data-key="dateCut">${escapeHtml(hCorte)}</div></div>
      </div>

      <!-- Modal con Zoom -->
      <div class="modal fade" id="fail-screen-modal" tabindex="-1" aria-labelledby="fail-screen-modalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="fail-screen-modalLabel">Pantalla de Error</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div id="screenZoomViewport">
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

      <div class="report-footer">
        <div class="slot-brand-footer">
          <img src="./js/generics/images/Banco_Santander_Logotipo.png" alt="Logotipo Santander">
        </div>
        <div class="sd">
          SERVICE DESK<br/>Soporte usuarios y Edificios<br/>End User Technologies<br/>Tel. 5551741101 Ext. 70767<br/>Bandejas Ext. 79500
        </div>
      </div>
    </div>
  `;

	// --- Asignar imagen y toggle del botón ---
	const imgEl = document.getElementById('ScreenFailImg');
	const btn = document.getElementById('ScreenFailBtn'); // botón del layout base
	if (imgEl) {
		if (hasImage) {
			const src = img_b64.startsWith('data:') ? img_b64 : `data:image/*;base64,${img_b64}`;
			imgEl.removeAttribute('src'); // fuerza refresh si es misma cadena
			requestAnimationFrame(() => {
				imgEl.src = src;
			});

			if (btn) {
				btn.style.display = 'inline-block';
				btn.disabled = false;
				btn.removeAttribute('aria-disabled');
				btn.title = 'Ver pantalla de error';
				btn.textContent = 'Pantalla error';
			}
		} else {
			imgEl.removeAttribute('src');
			if (btn) {
				btn.style.display = 'none';
				btn.disabled = true;
				btn.setAttribute('aria-disabled', 'true');
				btn.title = 'Sin imagen disponible';
				btn.textContent = 'Pantalla error';
			}
		}
	}

	// --- Inicializar Zoom para este modal recién creado ---
	(function initZoomForThisModal() {
		const modalEl = document.getElementById('fail-screen-modal');
		const viewport = document.getElementById('screenZoomViewport');
		const img = document.getElementById('ScreenFailImg');
		const btnIn = document.getElementById('zoomInBtn');
		const btnOut = document.getElementById('zoomOutBtn');
		const btnReset = document.getElementById('zoomResetBtn');
		if (!modalEl || !viewport || !img) return;

		let scale = 1,
			tx = 0,
			ty = 0;
		const MIN = 1,
			MAX = 5,
			STEP = 0.2;
		let panning = false,
			startX = 0,
			startY = 0;

		const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
		const apply = () => {
			img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
			if (btnReset) btnReset.textContent = `${Math.round(scale * 100)}%`;
		};
		const reset = () => {
			scale = 1;
			tx = 0;
			ty = 0;
			apply();
		};
		const zoom = (d) => {
			scale = clamp(+(scale + d).toFixed(2), MIN, MAX);
			if (scale === 1) {
				tx = 0;
				ty = 0;
			}
			apply();
		};

		btnIn?.addEventListener('click', () => zoom(+STEP));
		btnOut?.addEventListener('click', () => zoom(-STEP));
		btnReset?.addEventListener('click', reset);

		img.addEventListener('mousedown', (e) => {
			if (scale <= 1) return;
			panning = true;
			img.classList.add('is-grabbing');
			startX = e.clientX - tx;
			startY = e.clientY - ty;
			const onMove = (ev) => {
				if (!panning) return;
				tx = ev.clientX - startX;
				ty = ev.clientY - startY;
				apply();
			};
			const onUp = () => {
				panning = false;
				img.classList.remove('is-grabbing');
				document.removeEventListener('mousemove', onMove);
				document.removeEventListener('mouseup', onUp);
			};
			document.addEventListener('mousemove', onMove);
			document.addEventListener('mouseup', onUp);
			e.preventDefault();
		});

		viewport.addEventListener(
			'wheel',
			(e) => {
				if (!e.ctrlKey) return; // solo con Ctrl
				e.preventDefault();
				zoom(e.deltaY > 0 ? -STEP : +STEP);
			},
			{ passive: false }
		);

		modalEl.addEventListener('shown.bs.modal', reset);
		modalEl.addEventListener('hidden.bs.modal', reset);
	})();

	// Compatibilidad con quien consuma el retorno
	const img_size = Number(withSec?.img_size ?? NaN);
	return { incident: targetKey, img_size, img_64: img_b64 };
}
