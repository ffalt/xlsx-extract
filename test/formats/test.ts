import {assert} from 'chai';
import {describe, it} from 'mocha';
import {alphaNum, numAlpha, splitCellFormats, xlsx_fmts} from '../../src/utils';

describe('utils', () => {
	describe('column row translation', function() {
		it('should match column conversation', done => {
			assert.equal(numAlpha(0), 'A');
			assert.equal(numAlpha(26), 'AA');
			assert.equal(numAlpha(701), 'ZZ');
			assert.equal(alphaNum('A'), 0);
			assert.equal(alphaNum('ZZ'), 701);
			let i = 0;
			while (i < 9999) {
				assert.equal(alphaNum(numAlpha(i)), i);
				i++;
			}

			done();
		});
	});

	describe('cell formats', function() {

		it('should detect right number format types', done => {

			function checkformat(s: string | null, ffs: string | Array<string>, digits?: Array<number>, fmtNr?: string) {
				if (typeof ffs === 'string')
					ffs = [ffs];
				const fmts = splitCellFormats(s || '');
				for (let i = 0; i < fmts.length; i++) {
					assert.equal(fmts[i].fmt_type, ffs[i], fmts[i].fmt_type + '=' + ffs[i] + ' ' + JSON.stringify(fmts[i]) + ' check:' + s + (fmtNr ? ' fmtNr:' + fmtNr : ''));
					if (digits) {
						assert.equal(fmts[i].digits, digits[i], 'Invalid digits in format' + ' check:' + s + (fmtNr ? ' fmtNr:' + fmtNr : ''));
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
				2: [2], //'0.00',
				4: [2], // '#,##0.00',
				10: [2], // '0.00%',
				11: [20], // '0.00E+00',
				12: [2], //'# ?/?',
				13: [3], //'# ??/??',
				39: [2, 2],//'#,##0.00;(#,##0.00)',
				40: [2, 2],//'#,##0.00;[Red](#,##0.00)',
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

			for (let key in xlsx_fmts) {
				if (xlsx_fmts.hasOwnProperty(key) && xlsx_fmts[key])
					checkformat(xlsx_fmts[key], fmts_types[key], fmts_types_digits[key], key);
			}

			done();
		});
	});

});
