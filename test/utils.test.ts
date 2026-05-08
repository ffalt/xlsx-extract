import {
	xlsx_date, getColumnFromDefinition, isValidDate, escapeTSV, unescapeXML,
	containsOnlyChars, splitCellFormats, xlsx_fmts, numberToAlpha, alphaToNumber
} from '../src/utils';
import { IXLSXExtractOptions } from '../src/types';

const tsvOpts: IXLSXExtractOptions = { tsv_delimiter: '\t' };

describe('column row translation', () => {
	it('should match column conversation', () => {
		expect(numberToAlpha(0)).toBe('A');
		expect(numberToAlpha(26)).toBe('AA');
		expect(numberToAlpha(701)).toBe('ZZ');
		expect(alphaToNumber('A')).toBe(0);
		expect(alphaToNumber('ZZ')).toBe(701);
		let index = 0;
		while (index < 9999) {
			expect(alphaToNumber(numberToAlpha(index))).toBe(index);
			index++;
		}
	});
});

describe('xlsx_date', () => {
	it('converts day 1 to Jan 1 1900', () => {
		const d = xlsx_date(1, false, true);
		expect(d.getFullYear()).toBe(1900);
		expect(d.getMonth()).toBe(0);
		expect(d.getDate()).toBe(1);
	});

	it('converts day 60 via the Excel fake-leap-year special case', () => {
		// The code uses new Date(1900, 1, 29) for this slot; 1900 is not a
		// Gregorian leap year, so JS overflows Feb 29 → Mar 1.
		const d = xlsx_date(60, false, true);
		expect(d.getFullYear()).toBe(1900);
		expect(d.getMonth()).toBe(2); // March after overflow
		expect(d.getDate()).toBe(1);
	});

	it('converts day 61 to Mar 1 1900 (skips fake Feb 29)', () => {
		const d = xlsx_date(61, false, true);
		expect(d.getFullYear()).toBe(1900);
		expect(d.getMonth()).toBe(2);
		expect(d.getDate()).toBe(1);
	});

	it('decodes fractional day as time-of-day', () => {
		const d = xlsx_date(1.5, false, true); // noon
		expect(d.getHours()).toBe(12);
		expect(d.getMinutes()).toBe(0);
		expect(d.getSeconds()).toBe(0);
	});

	it('applies 1904 date system: day 0 is Jan 1 1904', () => {
		const d = xlsx_date(0, true, true);
		expect(d.getFullYear()).toBe(1904);
		expect(d.getMonth()).toBe(0);
		expect(d.getDate()).toBe(1);
	});

	it('applies 1904 date system: day 1 is Jan 2 1904', () => {
		const d = xlsx_date(1, true, true);
		expect(d.getFullYear()).toBe(1904);
		expect(d.getMonth()).toBe(0);
		expect(d.getDate()).toBe(2);
	});

	it('correctly adjusts hours for a whole-hour timezone (e.g. UTC+2)', () => {
		const spy = jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);
		try {
			// serial 1.5 = Jan 1 1900 at 12:00 stored; UTC+2 should yield 14:00
			const d = xlsx_date(1.5, false, false);
			expect(d.getHours()).toBe(14);
			expect(d.getMinutes()).toBe(0);
		} finally {
			spy.mockRestore();
		}
	});

	it('correctly adjusts hours and minutes for a half-hour timezone (e.g. UTC+5:30)', () => {
		const spy = jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
		try {
			// serial 1.25 = Jan 1 1900 at 06:00 stored; UTC+5:30 should yield 11:30
			const d = xlsx_date(1.25, false, false);
			expect(d.getHours()).toBe(11);
			expect(d.getMinutes()).toBe(30);
		} finally {
			spy.mockRestore();
		}
	});

	it('correctly adjusts hours and minutes for a negative half-hour timezone (e.g. UTC-3:30)', () => {
		const spy = jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(210);
		try {
			// serial 1.5 = Jan 1 1900 at 12:00 stored; UTC-3:30 should yield 08:30
			const d = xlsx_date(1.5, false, false);
			expect(d.getHours()).toBe(8);
			expect(d.getMinutes()).toBe(30);
		} finally {
			spy.mockRestore();
		}
	});
});

describe('containsOnlyChars', () => {
	it('returns true when all chars are in the allowed set', () => {
		expect(containsOnlyChars('abc', 'abcdef')).toBe(true);
	});

	it('returns false when a char is not in the allowed set', () => {
		expect(containsOnlyChars('abz', 'abcdef')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(containsOnlyChars('', 'abc')).toBe(false);
	});

	it('returns true for single char in set', () => {
		expect(containsOnlyChars('a', 'abc')).toBe(true);
	});
});

describe('getColumnFromDef', () => {
	it('returns 0 for A1', () => {
		expect(getColumnFromDefinition('A1')).toBe(0);
	});

	it('returns 1 for B2', () => {
		expect(getColumnFromDefinition('B2')).toBe(1);
	});

	it('returns 26 for AA10', () => {
		expect(getColumnFromDefinition('AA10')).toBe(26);
	});

	it('returns 701 for ZZ1', () => {
		expect(getColumnFromDefinition('ZZ1')).toBe(701);
	});
});

describe('isValidDate', () => {
	it('returns true for a valid Date', () => {
		expect(isValidDate(new Date())).toBe(true);
	});

	it('returns false for an invalid Date', () => {
		expect(isValidDate(new Date('not-a-date'))).toBe(false);
	});

	it('returns false for a string', () => {
		expect(isValidDate('2024-01-01')).toBe(false);
	});

	it('returns false for null', () => {
		expect(isValidDate(null)).toBe(false);
	});

	it('returns false for a number', () => {
		expect(isValidDate(0)).toBe(false);
	});
});

describe('escapeTSV', () => {
	it('returns plain value unchanged', () => {
		expect(escapeTSV('hello', tsvOpts)).toBe('hello');
	});

	it('quotes value containing the tab delimiter', () => {
		expect(escapeTSV('a\tb', tsvOpts)).toBe('"a\tb"');
	});

	it('quotes and escapes double-quotes', () => {
		expect(escapeTSV('say "hi"', tsvOpts)).toBe('"say ""hi"""');
	});

	it('quotes value containing a newline', () => {
		expect(escapeTSV('line1\nline2', tsvOpts)).toBe('"line1\nline2"');
	});

	it('quotes value containing a carriage return', () => {
		expect(escapeTSV('a\rb', tsvOpts)).toBe('"a\rb"');
	});

	it('uses a custom delimiter', () => {
		const opts: IXLSXExtractOptions = { tsv_delimiter: ';' };
		expect(escapeTSV('a;b', opts)).toBe('"a;b"');
	});

	it('returns empty string unchanged', () => {
		expect(escapeTSV('', tsvOpts)).toBe('');
	});

	it('quotes tab-containing value using default delimiter when tsv_delimiter is not set', () => {
		expect(escapeTSV('a\tb', {})).toBe('"a\tb"');
	});
});

describe('unescapexml', () => {
	it('unescapes &amp;', () => {
		expect(unescapeXML('&amp;')).toBe('&');
	});

	it('unescapes &lt; and &gt;', () => {
		expect(unescapeXML('&lt;tag&gt;')).toBe('<tag>');
	});

	it('unescapes &quot; and &apos;', () => {
		expect(unescapeXML('&quot;hello&apos;')).toBe('"hello\'');
	});

	it('unescapes decimal numeric references', () => {
		expect(unescapeXML('&#65;')).toBe('A');
	});

	it('unescapes hex numeric references', () => {
		expect(unescapeXML('&#x41;')).toBe('A');
	});

	it('handles CDATA sections', () => {
		expect(unescapeXML('<![CDATA[<raw & unescaped>]]>')).toBe('<raw & unescaped>');
	});

	it('handles CDATA with surrounding escaped text', () => {
		expect(unescapeXML('&lt;before&gt;<![CDATA[<inside>]]>&lt;after&gt;')).toBe('<before><inside><after>');
	});

	it('handles empty CDATA section', () => {
		expect(unescapeXML('<![CDATA[]]>')).toBe('');
	});

	it('handles malformed CDATA with no closing marker', () => {
		expect(unescapeXML('<![CDATA[no close')).toBe('no close');
	});

	it('handles malformed CDATA with escaped text before it', () => {
		expect(unescapeXML('&amp;<![CDATA[no close')).toBe('&no close');
	});

	it('unescapes _xHHHH_ codes', () => {
		expect(unescapeXML('_x0041_')).toBe('A');
	});

	it('returns plain text unchanged', () => {
		expect(unescapeXML('hello world')).toBe('hello world');
	});
});

describe('xlsx_fmts', () => {
	it('should detect right number format types', () => {
		function checkFormat(s: string | null, ffs: string | string[], digits?: number[], fmtNr?: string) {
			if (typeof ffs === 'string') {
				ffs = [ffs];
			}
			const fmts = splitCellFormats(s ?? '');
			for (const [index, fmt] of fmts.entries()) {
				let message = `${fmt.fmt_type}=${ffs[index]} ${JSON.stringify(fmt)} check:${s ?? ''}${fmtNr ? ' fmtNr:' + fmtNr : ''}`;
				expect(fmt.fmt_type, message).toBe(ffs[index]);
				if (digits) {
					message = `Invalid digits in format check:${s ?? ''}${fmtNr ? ' fmtNr:' + fmtNr : ''}`;
					expect(fmt.digits, message).toBe(digits[index]);
				}
			}
		}

		checkFormat('0\\ %', 'i'); // 0.8 -> 80
		checkFormat('0%', 'i'); // 0.8 -> 80
		checkFormat('0.000', 'f', [3]); // 3.1415926 -> 3.142
		checkFormat('#,##0', 'i'); //  1234.56 -> 1,235
		checkFormat('#,##0.00', 'f', [2]); //   1234.56 -> 1,234.56
		checkFormat('#,', 'i'); //    thousands separator
		checkFormat('#,##0 ;[Red](#,##0)', ['i', 'i']); //    optional stuff
		checkFormat('#,##0.00 ;[Red](#,##0.00)', ['f', 'f'], [2, 2]); //    optional stuff
		checkFormat('_-* #,##0\\ _€_-;\\-* #,##0\\ _€_-;_-* "-"??\\ _€_-;_-@_-', ['i', 'i', 'i', 's']); //    optional stuff

		/*
		 xlsx build in nr formats types
		 */
		const fmts_types_digits: Record<number, number[]> = {
			2: [2], // '0.00',
			4: [2], // '#,##0.00',
			10: [2], // '0.00%',
			11: [20], // '0.00E+00',
			12: [2], // '# ?/?',
			13: [3], // '# ??/??',
			39: [2, 2], // '#,##0.00;(#,##0.00)',
			40: [2, 2], // '#,##0.00;[Red](#,##0.00)',
			48: [18] // '##0.0E+0',
		};
		const fmts_types: Record<number, string | string[]> = {
			1: 'i',
			2: 'f',
			3: 'i',
			4: 'f',
			9: 'i',
			10: 'f',
			11: 'f',
			12: 'f', // ?/? as float
			13: 'f', // ??/?? as float
			14: 'd',
			15: 'd',
			16: 'd',
			17: 'd',
			18: 'd',
			19: 'd',
			20: 'd',
			21: 'd',
			22: 'd',
			37: ['i', 'i'],
			38: ['i', 'i'],
			39: ['f', 'f'],
			40: ['f', 'f'],
			45: 'd',
			46: 'd',
			47: 'd',
			48: 'f',
			49: 's'
		};

		for (const key of Object.keys(xlsx_fmts)) {
			const k = Number.parseInt(key, 10);
			if (xlsx_fmts[k]) {
				checkFormat(xlsx_fmts[k], fmts_types[k], fmts_types_digits[k], key);
			}
		}
	});
});
