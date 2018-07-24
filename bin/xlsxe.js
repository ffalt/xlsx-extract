#!/usr/bin/env node

/* vim: set ts=2: */
const XLSX = require('../dist/index.min.js').XLSX;
const fs = require('fs');
const program = require('commander');
const pack = require('../package.json');

program
.version(pack.version)
.usage('[options] <file> [destfile]')
.option('-m, --mode <mode>', 'json or tsv (default tsv)')
.option('-p, --parser <mode>', 'sax or expat (default sax)')
.option('-f, --file <file>', 'source .xlsx')
.option('-s, --sheet <nr>', 'sheet nr')
.option('-d, --dest <file>', 'destination .tsv')
.option('-h, --header <nr>', 'nr of headers to ignore')
.option('-e, --empty', 'include empty lines')
.option('-r, --raw', 'do not convert values')
.option('--d1904', 'convert dates with 1904 base')
.parse(process.argv);

const options = {
	sheet_nr: 1
};
let filename = null;
let destfile = null;
if (program.args[0]) {
	filename = program.args[0];
	if (program.args[1]) {
		destfile = program.args[1];
	}
}
if (program.sheet) {
	options.sheet_nr = program.sheet;
}
if (program.file) {
	filename = program.file;
}
if (program.dest) {
	destfile = program.dest;
}
if (program.empty) {
	options.include_empty_rows = program.empty;
}
if (program.header) {
	options.ignore_header = program.header;
}
if (program.raw) {
	options.raw_values = program.raw;
}
if (program.d1904) {
	options.date1904 = program.d1904;
}
if (program.mode) {
	options.format = program.mode;
}
if (program.parser) {
	options.parser = program.parser;
}
if (!filename) {
	console.error('xlsxe: must specify a filename');
	process.exit(1);
}
if (!fs.existsSync(filename)) {
	console.error('xlsxe: No such file or directory: ' + filename);
	process.exit(2);
}

if (destfile) {
	let error;
	console.time('written');
	new XLSX().convert(filename, destfile, options)
		.on('error', function (err) {
			error = err;
			console.error(err);
		})
		.on('end', function () {
			if (!error) {
				console.timeEnd('written');
			}
		});
} else {
	if (options.format !== 'json') {
		options.format = 'tsv';
	}
	new XLSX().extract(filename, options)
		.on('row', function (row) {
			console.log(row);
		})
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function (err) {
		});
}
