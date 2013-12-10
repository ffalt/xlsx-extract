#!/usr/bin/env node

/* vim: set ts=2: */
var XLSX = require('../lib').XLSX,
	path = require('path'),
	fs = require('fs'),
	program = require('commander');
program
	.version('0.0.2')
	.usage('[options] <file> [destfile]')
	.option('-m, --mode <mode>', 'json or tsv (default tsv)')
	.option('-f, --file <file>', 'source .xlsx')
	.option('-s, --sheet <nr>', 'sheet nr')
	.option('-d, --dest <file>', 'destination .tsv')
	.option('-h, --header <nr>', 'nr of headers to ignore')
	.option('-e, --empty', 'include empty lines')
	.option('-r, --raw', 'do not convert values')
	.option('--d1904', 'convert dates with 1904 base')
	.parse(process.argv);

var options = {
	sheet_nr: 1
};
var filename, destfile;
if (program.args[0]) {
	filename = program.args[0];
	if (program.args[1]) destfile = program.args[1];
}
if (program.sheet) options.sheet_nr = program.sheet;
if (program.file) filename = program.file;
if (program.dest) destfile = program.dest;
if (program.empty) options.include_empty_rows = program.empty;
if (program.header) options.ignore_header = program.header;
if (program.raw) options.raw_values = program.raw;
if (program.d1904) options.date1904 = program.d1904;
if (program.mode) options.format = program.mode;

if (!filename) {
	console.error("xlsx2tsv: must specify a filename");
	process.exit(1);
}

if (!fs.existsSync(filename)) {
	console.error("xlsx2tsv: " + filename + ": No such file or directory");
	process.exit(2);
}

if (destfile) {
	var error;
	new XLSX().convert(filename, destfile, options)
		.on('error', function (err) {
			error = err;
			console.error(err);
		})
		.on('end', function () {
			if (!error)
				console.log('written');
		});

} else {
	if (options.format !== 'json')
		options.format = 'tsv';
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