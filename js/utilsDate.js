// Fecha corta: "Aug 28 02:05 pm" (o 24h si ampm:false)
export function formatMonthDayTime(date, { ampm = true, padDay = true } = {}) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return '';

	const fmt = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: padDay ? '2-digit' : 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: ampm,
	});

	// "Aug 28, 02:05 PM" -> "Aug 28 02:05 pm"
	let s = fmt.format(d).replace(',', '').replace(/\s+/g, ' ').trim();
	s = s.replace(/\bAM\b/, 'am').replace(/\bPM\b/, 'pm');
	return s;
}

import { parseDateTime, formatMonthDayTime } from '../utils/date.js';

// ...

// antes
// const hInicio = formatAmPm(inicio);
// const hCorte  = formatAmPm(corte);

// después (mes corto en inglés + día + hora:min)
const hInicio = formatMonthDayTime(inicio, { ampm: true }); // ej: "Aug 28 02:05 pm"
const hCorte = formatMonthDayTime(corte, { ampm: true });
