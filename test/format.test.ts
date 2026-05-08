import { alphaNum as alphaNumber, numAlpha as numberAlpha, splitCellFormats, xlsx_fmts } from '../src/utils';

describe('utils', () => {
	describe('column row translation', () => {
		it('should match column conversation', () => {
			expect(numberAlpha(0)).toBe('A');
			expect(numberAlpha(26)).toBe('AA');
			expect(numberAlpha(701)).toBe('ZZ');
			expect(alphaNumber('A')).toBe(0);
			expect(alphaNumber('ZZ')).toBe(701);
			let index = 0;
			while (index < 9999) {
				expect(alphaNumber(numberAlpha(index))).toBe(index);
				index++;
			}
		});
	});

	describe('cell formats', () => {
		it('should detect right number format types', () => {
			function checkformat(s: string | null, ffs: string | string[], digits?: number[], fmtNr?: string) {
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

			checkformat('0\\ %', 'i'); // 0.8 -> 80
			checkformat('0%', 'i'); // 0.8 -> 80
			checkformat('0.000', 'f', [3]); // 3.1415926 -> 3.142
			checkformat('#,##0', 'i'); //  1234.56 -> 1,235
			checkformat('#,##0.00', 'f', [2]); //   1234.56 -> 1,234.56
			checkformat('#,', 'i'); //    thousands separator
			checkformat('#,##0 ;[Red](#,##0)', ['i', 'i']); //    optional stuff
			checkformat('#,##0.00 ;[Red](#,##0.00)', ['f', 'f'], [2, 2]); //    optional stuff
			checkformat('_-* #,##0\\ _€_-;\\-* #,##0\\ _€_-;_-* "-"??\\ _€_-;_-@_-', ['i', 'i', 'i', 's']); //    optional stuff

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
					checkformat(xlsx_fmts[k], fmts_types[k], fmts_types_digits[k], key);
				}
			}
		});
	});
});
