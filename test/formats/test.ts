import {alphaNum, numAlpha, splitCellFormats, xlsx_fmts} from '../../src/utils';

describe('utils', () => {

	describe('column row translation', () => {
		it('should match column conversation', () => {
			expect(numAlpha(0)).toBe('A');
			expect(numAlpha(26)).toBe('AA');
			expect(numAlpha(701)).toBe('ZZ');
			expect(alphaNum('A')).toBe(0);
			expect(alphaNum('ZZ')).toBe(701);
			let i = 0;
			while (i < 9999) {
				expect(alphaNum(numAlpha(i))).toBe(i);
				i++;
			}
		});
	});

	describe('cell formats', () => {
		it('should detect right number format types', () => {

			function checkformat(s: string | null, ffs: string | Array<string>, digits?: Array<number>, fmtNr?: string) {
				if (typeof ffs === 'string') {
					ffs = [ffs];
				}
				const fmts = splitCellFormats(s || '');
				for (let i = 0; i < fmts.length; i++) {
					let msg = fmts[i].fmt_type + '=' + ffs[i] + ' ' + JSON.stringify(fmts[i]) + ' check:' + s + (fmtNr ? ' fmtNr:' + fmtNr : '');
					expect(fmts[i].fmt_type, msg).toBe(ffs[i]);
					if (digits) {
						msg = 'Invalid digits in format' + ' check:' + s + (fmtNr ? ' fmtNr:' + fmtNr : '');
						expect(fmts[i].digits, msg).toBe(digits[i]);
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
			const fmts_types_digits: { [num: number]: Array<number> } = {
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
			const fmts_types: { [num: number]: string | Array<string> } = {
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

			Object.keys(xlsx_fmts).forEach(key => {
				const k = parseInt(key, 10);
				if (xlsx_fmts[k]) {
					checkformat(xlsx_fmts[k], fmts_types[k], fmts_types_digits[k], key);
				}
			});

		});
	});

});
