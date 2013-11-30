/*
 * Mocha tests, run with `mocha -R spec`
 * http://visionmedia.github.io/mocha/
 */

var assert = require("assert"),
	path = require('path'),
	fs = require('fs'),
	XLSX = require('../lib').XLSX;

describe('xlsx-extract', function () {

	var sourcefile = path.resolve('./test.xlsx');

	it('should read all columns and rows', function (done) {
		var demo_colcounts = [1, 0, 238, 2, 2, 2, 2, 2, 2, 2, 2 ];
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
		var demo_colcounts = [0, 238, 2, 2, 2, 2, 2, 2, 2, 2 ];
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
		var demo_colcounts = [1, 238, 2, 2, 2, 2, 2, 2, 2, 2];
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
			'5'
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
			1296514800000,
			'00002222',
			5.94202898550725,
			5.94,
			5.942,
			5.94202898550725,
			5,
			5
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
				assert.equal(error, null, 'error!!1!');
			});
	});

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
		filetest({ignore_header: 2, include_empty_rows: true}, [238, 2, 2, 2, 2, 2, 2, 2, 2], function () {
			done();
		});
	});

	it('should write a tsv without empty lines', function (done) {
		filetest({}, [1, 238, 2, 2, 2, 2, 2, 2, 2, 2], function () {
			done();
		});
	});

	it('should write a tsv with all', function (done) {
		filetest({include_empty_rows: true}, [1, 1, 238, 2, 2, 2, 2, 2, 2, 2, 2], function () {
			done();
		});
	});

	it('should do nothing', function (done) {
		console.log('done with do nothing<3');
		setTimeout(done, 2000);
	});

});