#!/usr/bin/env node

import { XLSX } from "../dist/lib/index.js";
import fs from "node:fs";
import { createRequire } from "node:module";
import { program } from "commander";

const pack = createRequire(import.meta.url)("../package.json");

program
	.version(pack.version)
	.argument("[file]", "source .xlsx")
	.argument("[destfile]", "destination file")
	.option("-m, --mode <mode>", "json or tsv (default tsv)")
	.option("-f, --file <file>", "source .xlsx")
	.option("-s, --sheet <nr>", "sheet nr")
	.option("-d, --dest <file>", "destination .tsv")
	.option("-n, --header <nr>", "n header rows to skip")
	.option("-e, --empty", "include empty lines")
	.option("-r, --raw", "do not convert values")
	.option("--d1904", "convert dates with 1904 base")
	.parse(process.argv);

const parameters = program.opts();
const options = {
	sheet_nr: 1
};
let filename;
let destinationFile;
if (program.args.at(0)) {
	filename = program.args.at(0);
	if (program.args.at(1)) {
		destinationFile = program.args.at(1);
	}
}
if (parameters.sheet) {
	options.sheet_nr = parameters.sheet;
}
if (parameters.file) {
	filename = parameters.file;
}
if (parameters.dest) {
	destinationFile = parameters.dest;
}
if (parameters.empty) {
	options.include_empty_rows = parameters.empty;
}
if (parameters.header) {
	options.ignore_header = parameters.header;
}
if (parameters.raw) {
	options.raw_values = parameters.raw;
}
if (parameters.d1904) {
	options.date1904 = parameters.d1904;
}
if (parameters.mode) {
	options.format = parameters.mode;
}
if (parameters.parser) {
	options.parser = parameters.parser;
}
if (!filename) {
	console.error("xlsxe: must specify a filename");
	process.exit(1);
}
if (!fs.existsSync(filename)) {
	console.error(`xlsxe: No such file or directory: ${filename}`);
	process.exit(2);
}

if (destinationFile) {
	let error;
	console.time("written");
	new XLSX().convert(filename, destinationFile, options)
		.on("error", function (error_) {
			error = error_;
			console.error(error_);
		})
		.on("end", function () {
			if (!error) {
				console.timeEnd("written");
			}
		});
} else {
	if (options.format !== "json") {
		options.format = "tsv";
	}
	new XLSX().extract(filename, options)
		.on("row", row => {
			console.log(row);
		})
		.on("error", error => {
			console.error(error);
		})
		.on("end", () => {
			// nop
		});
}
