import {ICellFormat} from './cell';
import {IXLSXExtractOptions} from './types';

/**
 converts a raw xlsx-date to js date
 */
export function xlsx_date(value: number, date1904: boolean): Date {
	let date = Math.floor(value),
		time = Math.round(86400 * (value - date)),
		d;
	if (date1904) {
		date += 1462;
	}
	// Open XML stores dates as the number of days from 1 Jan 1900. Well, skipping the incorrect 29 Feb 1900 as a valid day.
	if (date === 60) {
		d = new Date(1900, 1, 29);
	} else {
		if (date > 60) {
			--date;
		}
		/* 1 = Jan 1 1900 */
		d = new Date(1900, 0, 1, 0, 0, 0);
		d.setDate(d.getDate() + date - 1);
	}
	d.setSeconds(time % 60);
	time = Math.floor(time / 60);
	d.setMinutes(time % 60);
	time = Math.floor(time / 60);
	d.setHours(time - d.getTimezoneOffset() / 60);
	return d;
}

/**
 xlsx build in nr formats
 */
export const xlsx_fmts: { [id: number]: string | null } = {
	0: null, // General
	1: '0',
	2: '0.00',
	3: '#,##0',
	4: '#,##0.00',

	9: '0%',
	10: '0.00%',
	11: '0.00E+00',
	12: '# ?/?',
	13: '# ??/??',
	14: 'mm-dd-yy',
	15: 'd-mmm-yy',
	16: 'd-mmm',
	17: 'mmm-yy',
	18: 'h:mm AM/PM',
	19: 'h:mm:ss AM/PM',
	20: 'h:mm',
	21: 'h:mm:ss',
	22: 'm/d/yy h:mm',

	37: '#,##0 ;(#,##0)',
	38: '#,##0 ;[Red](#,##0)',
	39: '#,##0.00;(#,##0.00)',
	40: '#,##0.00;[Red](#,##0.00)',

	45: 'mm:ss',
	46: '[h]:mm:ss',
	47: 'mmss.0',
	48: '##0.0E+0',
	49: '@'
};

const Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 converts a column index to chars e.g. 1 -> A
 */
export function numAlpha(i: number): string {
	const t = Math.floor(i / 26) - 1;
	return (t > -1 ? numAlpha(t) : '') + Alphabet.charAt(i % 26);
}

/**
 converts a chars to column index e.g. A -> 1
 */
export function alphaNum(name: string) {
	let result = 0;
	let multiplier = 1;
	for (let i = name.length - 1; i >= 0; i--) {
		const value = ((name[i].charCodeAt(0) - 'A'.charCodeAt(0)) + 1);
		result = result + value * multiplier;
		multiplier = multiplier * 26;
	}
	return (result - 1);
}

/**
 split and parse cell formats
 */
export function containsOnlyChars(value: string, chars: string): boolean {
	for (let i = 0; i < value.length; i++) {
		if (chars.indexOf(value[i]) < 0) {
			return false;
		}
	}
	return (value.length > 0);
}

/**
 splits and parse cell formats
 */
export function splitCellFormats(s: string): Array<ICellFormat> {
	/*
	 http://office.microsoft.com/en-gb/excel-help/create-or-delete-a-custom-number-format-HP005199500.aspx?redir=0
	 _-* #,##0\ _€_-;\-* #,##0\ _€_-;_-* "-"??\ _€_-;_-@_-
	 positive value ; negative value ; zero; string
	 */
	const fmts = s.split(/(?!\\);/);
	let nr = 0;
	let last = {t: 'x'};
	const result: Array<ICellFormat> = [];
	for (let i = 0; i < fmts.length; i++) {
		let ff = parseFmtType(fmts[i]);
		ff = (ff.t === 'l' ? last : ff);
		last = ff;
		result.push({fmt: fmts[i], fmt_type: ff.t, digits: ff.f});
		nr++;
	}
	return result;
}

/**
 parse cell format
 */
function parseFmtType(fmt: string): { t: string, f?: number } {
	// messy hack for extracting some info from the number format (type and float-digits}
	let s = fmt;
	let b = '';
	while (s.length > 0) {
		const c = s[0];
		s = s.slice(1);
		if ((c === '_') || (c === '\\') || (c === '*')) {
			s = s.slice(1);
		} else if (c === '[') {
			s = s.slice(s.indexOf(']') + 1);
		} else if (c === '"') {
			s = s.slice(s.indexOf('"') + 1);
		} else if ((c === '(') || (c === ')')) {
			// nop
		} else {
			b += c;
		}
	}
	b = b.replace(/#/g, '0').replace(/%/g, '');
	// deal with thousands separator 12000 -> 12 -> formatCode	'#,'
	let sp = b.split(',');
	b = sp[sp.length - 1];
	if (b === '' || (b.trim().indexOf(' ') < 0) && !isNaN(parseInt(b, 10))) {
		if (b.indexOf('.') >= 0) {
			let di = sp[sp.length - 1].split('.')[1].trim().length;
			if (b.indexOf('E+') >= 0) {
				di += 14;
			}
			return {t: 'f', f: di};
		} else {
			return {t: 'i'};
		}
	} else if (b === '@') {
		return {t: 's'};
	}
	// '-'?? zero value
	if (b === '??') {
		return {t: 'l'}; // last fmt should by used
	}
	sp = b.split(' ');
	// test '# ??/??'
	if ((sp.length > 1) && (containsOnlyChars(sp[sp.length - 1], '?/'))) {
		// '# ?/?' or '# ??/??',
		const digits = sp[sp.length - 1].split('/')[0].trim().length + 1;
		return {t: 'f', f: digits};
	}
	// date format?
	if (containsOnlyChars(b, 'tmdyhseAPTMH:/-.0 ')) {
		return {t: 'd'};
	}
	return {t: 'x'};
}

/*
 A1 -> 0
 A2 -> 0
 B2 -> 1
 */
export function getColumnFromDef(colDef: string): number {
	let cc = '';
	for (let i = 0; i < colDef.length; i++) {
		if (isNaN(parseInt(colDef[i], 10))) {
			cc += colDef[i];
		} else {
			break;
		}
	}
	return alphaNum(cc);
}

export function isValidDate(d: any): boolean {
	return d instanceof Date && !isNaN(d.getTime());
}

export function escapeTSV(val: string, options: IXLSXExtractOptions): string {
	const delimiter = options.tsv_delimiter || '\t';
	if (val && val.indexOf('"') > -1 || val.indexOf('\n') > -1 || val.indexOf('\r') > -1 || val.indexOf(delimiter) > -1) {
		val = '"' + val.replace(/"/g, '""') + '"';
	}
	return val;
}

export function unescapexml(text: string): string {
	const encregex = /&(?:quot|apos|gt|lt|amp|#x?([\da-fA-F]+));/g;
	const coderegex = /_x([\da-fA-F]{4})_/g;
	const encodings: { [key: string]: string } = {
		'&quot;': '"',
		'&apos;': '\'',
		'&gt;': '>',
		'&lt;': '<',
		'&amp;': '&'
	};
	const s = text + '';
	const i = s.indexOf('<![CDATA[');
	if (i === -1) {
		return s.replace(encregex, function($$, $1) {
			return encodings[$$] || String.fromCharCode(parseInt($1, $$.indexOf('x') > -1 ? 16 : 10)) || $$;
		}).replace(coderegex, function(m, c) {
			return String.fromCharCode(parseInt(c, 16));
		});
	}
	const j = s.indexOf(']]>');
	return unescapexml(s.slice(0, i)) + s.slice(i + 9, j) + unescapexml(s.slice(j + 3));

}
