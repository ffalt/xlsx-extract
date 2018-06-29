/*
 * Mocha tests, run with `mocha -R spec`
 * http://visionmedia.github.io/mocha/
 */

const assert = require("assert"),
	path = require('path'),
	fs = require('fs'),
	XLSX = require('../dist/index').XLSX,
	utils = require('../dist/lib/utils'),
	debug = require('debug');

debug.enable('xlsx-extract');

describe('xlsx', function () {
	this.timeout(10000);

	const sourcefile = path.join(__dirname, 'test.xlsx');

	describe('extract', () => {
		it('should read sheet name', done => {
			new XLSX().extract(sourcefile, {include_empty_rows: true})
			.on('sheet', sheet => {
				assert.equal(sheet[0], 'Tabelle1', 'invalid sheet name');
				assert.equal(sheet[1], 'rId1', 'invalid sheet id');
				assert.equal(sheet[2], '1', 'invalid sheet nr');
			})
			.on('end', () => {
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read by sheet name', done => {
			new XLSX().extract(sourcefile, {sheet_name: 'Tabelle1', include_empty_rows: true})
			.on('sheet', sheet => {
				assert.equal(sheet[0], 'Tabelle1', 'invalid sheet');
			})
			.on('end', () => {

				new XLSX().extract(sourcefile, {sheet_name: 'HelloWorld', include_empty_rows: true})
				.on('sheet', sheet => {
					assert.equal(sheet[0], 'HelloWorld', 'invalid sheet');
				})
				.on('end', () => {
					done();
				})
				.on('error', error => {
					console.error(error);
					assert.equal(error, null, 'error!!1!');
				});

			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read by sheet id', done => {
			new XLSX().extract(sourcefile, {sheet_id: 2, include_empty_rows: true})
			.on('sheet', sheet => {
				assert.equal(sheet[0], 'HelloWorld', 'invalid sheet');
			})
			.on('end', () => {
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read all columns and rows', done => {
			const demo_colcounts = [1, 0, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
			let rowcount = 0;
			new XLSX().extract(sourcefile, {include_empty_rows: true})
			.on('row', row => {
				assert.equal(row.length, demo_colcounts[rowcount], 'invalid column count in row ' + rowcount);
				rowcount++;
			})
			.on('end', () => {
				assert.equal(rowcount, demo_colcounts.length, 'invalid row count');
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read all columns and all but the first row', done => {
			const demo_colcounts = [0, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
			let rowcount = 0;
			new XLSX().extract(sourcefile, {include_empty_rows: true, ignore_header: 1})
			.on('row', row => {
				assert.equal(row.length, demo_colcounts[rowcount], 'invalid column count : row ' + rowcount);
				rowcount++;
			})
			.on('end', () => {
				assert.equal(rowcount, demo_colcounts.length, 'invalid row count');
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read all columns and non-empty-rows', done => {
			const demo_colcounts = [1, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
			let rowcount = 0;
			new XLSX().extract(sourcefile)
			.on('row', row => {
				assert.equal(row.length, demo_colcounts[rowcount], 'invalid column count : row ' + rowcount);
				rowcount++;
			})
			.on('end', () => {
				assert.equal(rowcount, demo_colcounts.length, 'invalid row count');
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read all raw cell values', done => {
			let rowcount = 0;
			const second_column_value = [
				null,
				null,
				'aha',
				'40574',
				'00002222',
				'5.9420289855072497',
				'5.9420289855072461',
				'5.9420289855072461',
				'5.9420289855072497',
				'5',
				'5',
				'4.123456',
				'4.123456',
				'0.8',
				'0.1'
			];
			new XLSX().extract(sourcefile, {raw_values: true, include_empty_rows: true})
			.on('row', row => {
				assert.equal(row[1], second_column_value[rowcount], 'invalid value in row: ' + rowcount);
				rowcount++;
			})
			.on('end', () => {
				assert.equal(rowcount, second_column_value.length, 'invalid row count');
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read and format all cell values', done => {
			let rowcount = 0;
			const second_column_value = [
				null,
				null,
				'aha',
				(new Date(2011, 0, 31)).valueOf(),
				'00002222',
				5.94202898550725,
				5.94,
				5.942,
				5.94202898550725,
				5,
				5,
				4.12,
				4,
				80,
				10
			];

			new XLSX().extract(sourcefile, {include_empty_rows: true})
			.on('row', row => {
				let v = row[1];
				if (rowcount === 3) {
					v = row[1].valueOf();
				}
				assert.equal(v, second_column_value[rowcount], 'invalid value in row: ' + rowcount);
				rowcount++;
			})
			.on('end', () => {
				assert.equal(rowcount, second_column_value.length, 'invalid row count');
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should read and format all cell values except floats', done => {
			let rowcount = 0;
			const second_column_value = [
				null,
				null,
				'aha',
				(new Date(2011, 0, 31)).valueOf(),
				'00002222',
				5.94202898550725,
				5.942028985507246,
				5.942028985507246,
				5.94202898550725,
				5,
				5,
				4.123456,
				4,
				80,
				10
			];

			new XLSX().extract(sourcefile, {include_empty_rows: true, round_floats: false})
			.on('row', row => {
				let v = row[1];
				if (rowcount === 3)
					v = row[1].valueOf();
				assert.equal(v, second_column_value[rowcount], 'invalid value in row: ' + rowcount);
				rowcount++;
			})
			.on('end', () => {
				assert.equal(rowcount, second_column_value.length, 'invalid row count');
				done();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		});

		it('should emit error for non-xlsx files', done => {
			let emittedError = null;
			const file = path.join(__dirname, 'fake.xlsx');
			new XLSX().extract(file, {include_empty_rows: true})
			.on('error', error => {
				emittedError = error;
			})
			.on('end', () => {
				assert.notEqual(emittedError, null);

				done();
			});
		});

		it('should xlsx files with inlineStr cells', done => {
			const file = path.join(__dirname, 'inlinestr.xlsx');
			let rowcount = 0;
			const texts = ['Product', 'Advertiser', 'Campaign', 'Origin', 'Site', 'Region', 'Market', 'Keyword', 'Department', 'Target',
				'Partition', 'Start Date', 'Post Date', 'Creative', 'Tracking Number', 'Spend', 'GRP',
				'Rate', 'Clicks', 'Impressions', 'Conversions'];
			new XLSX().extract(file, {include_empty_rows: true})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			})
			.on('row', row => {
				rowcount++;
				for (let i = 0; i < row.length; i++) {
					assert.equal(row[i], texts[i], 'invalid value in cell: ' + i);
				}
			})
			.on('end', () => {
				assert.equal(rowcount, 1, 'invalid row count');
				done();
			});
		});

	});

	describe('utils', () => {

		it('should match column conversation', done => {
			assert.equal(utils.numAlpha(0), 'A');
			assert.equal(utils.numAlpha(26), 'AA');
			assert.equal(utils.numAlpha(701), 'ZZ');
			assert.equal(utils.alphaNum('A'), 0);
			assert.equal(utils.alphaNum('ZZ'), 701);
			let i = 0;
			while (i < 9999) {
				assert.equal(utils.alphaNum(utils.numAlpha(i)), i);
				i++;
			}

			done();
		});

		it('should detect right number format types', done => {

			function checkformat(s, ffs, digits, fmtNr) {
				if (typeof ffs === 'string')
					ffs = [ffs];
				if (digits)
					if (typeof digits === 'number')
						digits = [digits];
				const fmts = utils.splitCellFormats(s);
				for (let i = 0; i < fmts.length; i++) {
					assert.equal(fmts[i].fmt_type, ffs[i], fmts[i].fmt_type + '=' + ffs[i] + ' ' + JSON.stringify(fmts[i]) + ' check:' + s + (fmtNr ? ' fmtNr:' + fmtNr : ''));
					if (digits) {
						assert.equal(fmts[i].digits, digits[i]);
					}
				}
			}

			checkformat('0%', 'i', 0); // 0.8 -> 80
			checkformat('0\\ %', 'i', 0); // 0.8 -> 80
			checkformat('0.000', 'f', 3); // 3.1415926 -> 3.142
			checkformat('#,##0', 'i'); //  1234.56 -> 1,235
			checkformat('#,##0.00', 'f', 2); //   1234.56 -> 1,234.56
			checkformat('#,', 'i'); //    thousands separator
			checkformat('#,##0 ;[Red](#,##0)', ['i', 'i']); //    optional stuff
			checkformat('#,##0.00 ;[Red](#,##0.00)', ['f', 'f'], [2, 2]); //    optional stuff
			checkformat('_-* #,##0\\ _€_-;\\-* #,##0\\ _€_-;_-* "-"??\\ _€_-;_-@_-', ['i', 'i', 'i', 's']); //    optional stuff

			/*
			 xlsx build in nr formats types
			 */
			const fmts_types_digits = {
				2: 2, //'0.00',
				4: 2, // '#,##0.00',
				10: 2, // '0.00%',
				11: 20, // '0.00E+00',
				12: 2, //'# ?/?',
				13: 3, //'# ??/??',
				39: [2, 2],//'#,##0.00;(#,##0.00)',
				40: [2, 2],//'#,##0.00;[Red](#,##0.00)',
				48: 18 // '##0.0E+0',
			};
			const fmts_types = {
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

			for (let key in utils.xlsx_fmts) {
				if (utils.xlsx_fmts.hasOwnProperty(key) && utils.xlsx_fmts[key])
					checkformat(utils.xlsx_fmts[key], fmts_types[key], fmts_types_digits[key], key);
			}

			done();
		});
	});

	describe('tsv', () => {

		const filetest = (options, demo_colcounts, cb) => {
			const destfile = path.resolve('./test.tsv');
			if (fs.existsSync(destfile))
				fs.unlinkSync(destfile);

			new XLSX().convert(sourcefile, destfile, options)
			.on('end', () => {
				const exists = fs.existsSync(destfile);
				assert.equal(exists, true, 'file not written');
				if (exists) {
					let lines = fs.readFileSync(destfile).toString();
					lines = lines.split('\n');
					if (lines[lines.length - 1].length === 0)
						lines = lines.slice(0, lines.length - 1);
					assert.equal(lines.length, demo_colcounts.length, 'invalid row count in tsv');
					for (let i = 0; i < lines.length; i++) {
						assert.equal(demo_colcounts[i], lines[i].split('\t').length, 'invalid cols.count in tsv - row: ' + i + ' ' + lines[i]);
					}
					fs.unlinkSync(destfile);
				}
				cb();
			})
			.on('error', error => {
				console.error(error);
				assert.equal(error, null, 'error!!1!');
			});
		};

		it('should write a tsv without the header', done => {
			filetest({ignore_header: 2, include_empty_rows: true}, [238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], () => {
				done();
			});
		});

		it('should write a tsv without empty lines', done => {
			filetest({}, [1, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], () => {
				done();
			});
		});

		it('should write a tsv with all', done => {
			filetest({include_empty_rows: true}, [1, 1, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], () => {
				done();
			});
		});

	});

	describe('end', () => {

		it('should do nothing and wait for tests cleaned up the file system', done => {
			setTimeout(() => {
				console.log('done with doing nothing <3');
				done();
			}, 3000);
		});

	});

});
