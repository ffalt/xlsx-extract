/*
 * Mocha tests, run with `mocha -R spec`
 * http://visionmedia.github.io/mocha/
 */

var assert = require("assert"),
	path = require('path'),
	fs = require('fs'),
	XLSX = require('../lib').XLSX;

describe('xlsx', function () {

	var sourcefile = path.resolve('./test.xlsx');

	describe('extract', function () {
		it('should read all columns and rows', function (done) {
			var demo_colcounts = [1, 0, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
			var rowcount = 0;
			new XLSX().extract(sourcefile, {include_empty_rows: true})
				.on('row', function (row) {
					assert.equal(row.length, demo_colcounts[rowcount], 'invalid column count : row ' + rowcount);
					rowcount++;
				})
				.on('end', function () {
					assert.equal(rowcount, demo_colcounts.length, 'invalid row count');
					done();
				})
				.on('error', function (error) {
					assert.equal(error, null, 'error!!1!');
				});
		});

		it('should read all columns and all but the first row', function (done) {
			var demo_colcounts = [0, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ];
			var rowcount = 0;
			new XLSX().extract(sourcefile, {include_empty_rows: true, ignore_header: 1})
				.on('row', function (row) {
					assert.equal(row.length, demo_colcounts[rowcount], 'invalid column count : row ' + rowcount);
					rowcount++;
				})
				.on('end', function () {
					assert.equal(rowcount, demo_colcounts.length, 'invalid row count');
					done();
				})
				.on('error', function (error) {
					assert.equal(error, null, 'error!!1!');
				});
		});

		it('should read all columns and non-empty-rows', function (done) {
			var demo_colcounts = [1, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
			var rowcount = 0;
			new XLSX().extract(sourcefile)
				.on('row', function (row) {
					assert.equal(row.length, demo_colcounts[rowcount], 'invalid column count : row ' + rowcount);
					rowcount++;
				})
				.on('end', function () {
					assert.equal(rowcount, demo_colcounts.length, 'invalid row count');
					done();
				})
				.on('error', function (error) {
					assert.equal(error, null, 'error!!1!');
				});
		});

		it('should read all raw cell values', function (done) {
			var rowcount = 0;
			var second_column_value = [
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
				'4.123456'
			];
			new XLSX().extract(sourcefile, {raw_values: true, include_empty_rows: true})
				.on('row', function (row) {
					assert.equal(row[1], second_column_value[rowcount], 'invalid value in row: ' + rowcount);
					rowcount++;
				})
				.on('end', function () {
					assert.equal(rowcount, second_column_value.length, 'invalid row count');
					done();
				})
				.on('error', function (error) {
					assert.equal(error, null, 'error!!1!');
				});
		});

		it('should read and format all cell values', function (done) {
			var rowcount = 0;
			var second_column_value = [
				null,
				null,
				'aha',
				1296428400000,
				'00002222',
				5.94202898550725,
				5.94,
				5.942,
				5.94202898550725,
				5,
				5,
				4.12,
				4
			];

			new XLSX().extract(sourcefile, {include_empty_rows: true})
				.on('row', function (row) {
					var v = row[1];
					if (rowcount == 3)
						v = row[1].valueOf();
					assert.equal(v, second_column_value[rowcount], 'invalid value in row: ' + rowcount);
					rowcount++;
				})
				.on('end', function () {
					assert.equal(rowcount, second_column_value.length, 'invalid row count');
					done();
				})
				.on('error', function (error) {
					console.error(error);
					assert.equal(error, null, 'error!!1!');
				});
		});

	});

	describe('utils', function () {

		it('should match column conversation', function (done) {
			assert.equal(XLSX.utils.numAlpha(0), 'A');
			assert.equal(XLSX.utils.numAlpha(26), 'AA');
			assert.equal(XLSX.utils.numAlpha(701), 'ZZ');
			assert.equal(XLSX.utils.alphaNum('A'), 0);
			assert.equal(XLSX.utils.alphaNum('ZZ'), 701);
			var i = 0;
			while (i < 9999) {
				assert.equal(XLSX.utils.alphaNum(XLSX.utils.numAlpha(i)), i);
				i++;
			}

			done();
		});

		it('should detect right number format types', function (done) {

			function checkformat(s, ffs, digits) {
				if (typeof ffs == 'string')
					ffs = [ffs];
				if (digits)
					if (typeof digits == 'number')
						digits = [digits];
				var fmts = XLSX.utils.splitFormats(s);
				for (var i = 0; i < fmts.length; i++) {
					assert.equal(fmts[i].fmt_type, ffs[i], fmts[i].fmt_type + '=' + ffs[i] + ' ' + JSON.stringify(fmts[i]));
					if (digits) {
						assert.equal(fmts[i].digits, digits[i]);
					}
				}
			}

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
			var fmts_types_digits = {
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
			var fmts_types = {
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

			for (var key in XLSX.consts.fmts) {
				if (XLSX.consts.fmts[key])
					checkformat(XLSX.consts.fmts[key], fmts_types[key], fmts_types_digits[key]);
			}

			done();
		});
	});

	describe('tsv', function () {

		var filetest = function (options, demo_colcounts, cb) {
			var destfile = path.resolve('./test.tsv');
			if (fs.existsSync(destfile))
				fs.unlinkSync(destfile);

			new XLSX().convert(sourcefile, destfile, options)
				.on('end', function () {
					var exists = fs.existsSync(destfile);
					assert.equal(exists, true, 'file not written');
					if (exists) {
						var lines = fs.readFileSync(destfile).toString();
						lines = lines.split('\n');
						if (lines[lines.length - 1].length == 0)
							lines = lines.slice(0, lines.length - 1);
						assert.equal(lines.length, demo_colcounts.length, 'invalid row count in tsv');
						for (var i = 0; i < lines.length; i++) {
							assert.equal(demo_colcounts[i], lines[i].split('\t').length, 'invalid cols.count in tsv - row: ' + i + ' ' + lines[i]);
						}
						fs.unlinkSync(destfile);
					}
					cb();
				})
				.on('error', function (error) {
					assert.equal(error, null, 'error!!1!');
				});
		};

		it('should write a tsv without the header', function (done) {
			filetest({ignore_header: 2, include_empty_rows: true}, [238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], function () {
				done();
			});
		});

		it('should write a tsv without empty lines', function (done) {
			filetest({}, [1, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], function () {
				done();
			});
		});

		it('should write a tsv with all', function (done) {
			filetest({include_empty_rows: true}, [1, 1, 238, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], function () {
				done();
			});
		});

	});

	describe('end', function () {

		it('should do nothing', function (done) {
			console.log('done with do nothing<3');
			setTimeout(done, 2000);
		});

	});

});