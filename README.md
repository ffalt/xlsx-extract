# xlsx-extract

extracts data from XLSX files with low memory footprint


xlsx-files can get pretty big, so nodejs & full featured xlsx-modules can reach memory limits or just use more than is needed for that task. (--max-old-space-size & --stack_size can't help you all the time either)

hence these magnificent features:

- files are parsed with sax parser `sax` or `node-expat`
- get rows/cells each by callback or write them to a .tsv or .json file


[![NPM](https://nodei.co/npm/xlsx-extract.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/xlsx-extract/)

[![dependencies](https://img.shields.io/david/ffalt/xlsx-extract.svg)](https://www.npmjs.com/package/xlsx-extract) 
[![license](https://img.shields.io/npm/l/xlsx-extract.svg)](http://opensource.org/licenses/MIT) 
[![developer](https://img.shields.io/badge/developer-awesome-brightgreen.svg)](https://github.com/ffalt/xlsx-extract) 
[![known vulnerabilities](https://snyk.io/test/github/ffalt/xlsx-extract/badge.svg)](https://snyk.io/test/github/ffalt/xlsx-extract) 
[![certification](https://api.codacy.com/project/badge/Grade/7bd868b2fb1c4f38ad9ef2ffb698c314)](https://www.codacy.com/app/ffalt/xlsx-extract) 
[![build status](https://travis-ci.org/ffalt/xlsx-extract.svg?branch=master)](https://travis-ci.org/ffalt/xlsx-extract) 
[![greenkeeper badge](https://badges.greenkeeper.io/ffalt/xlsx-extract.svg)](https://greenkeeper.io/)
[![total downloads](https://badgen.net/npm/dt/xlsx-extract)](https://badgen.net/npm/dt/xlsx-extract)


## Install

```
npm install xlsx-extract
```

The XML files of the format are parsed with [sax-js](https://github.com/isaacs/sax-js) by default. 

If you want to use the faster [node-expat](https://github.com/astro/node-expat) parser please install it manually and use the {parser:"expat"} option. (Needs native compiling on the destination system)
```
npm install node-expat
```


## Options

```

interface IXLSXExtractOptions {
	// sheet selection (provide one of the following)
	sheet_name?: string; // select by sheet name
	sheet_nr?: string; // default "1" - select by number of the sheet starting on 1
	sheet_id?: string; // select by sheet id, e.g. "1"
	sheet_rid?: string; // select by internal sheet rid, e.g. "rId1'
	sheet_all?: boolean; // default false - select all sheets
	// sax parser selection
	parser?: string; // default "sax" - 'sax'|'expat'
	// row selection
	ignore_header?: number; // default 0 - the number of header lines to ignore
	include_empty_rows?: boolean; // default false - include empty rows in the middle/at start
	// how to output sheet, rows and cells
	format?: string; // default array - convert to 'array'||'json'||'tsv'||'obj'
	// tsv output options
	tsv_float_comma?: boolean; // default false - use "," als decimal point for floats
	tsv_delimiter?: string; // default '\t' - use specified character to field delimiter
	tsv_endofline?: string; // default depending on your operating system (node os.EOL) e.g. '\n'
	// cell value formats
	raw_values?: boolean;  // default false - do not apply cell formats (get values as string as in xlsx)
	round_floats?: boolean; // default true - round float values as the cell format defines (values will be reported as parsed floats otherwise)
	date1904?: boolean;   // default false - use date 1904 conversion
	convert_values?: { // apply cell number formats or not (values will be reported as strings otherwise)
		ints?: boolean;  // rounds to int if number format is for int
		floats?: boolean;  // rounds floats according to float number format
		dates?: boolean;  // converts xlsx date to js date
		bools?: boolean; // converts xlsx bool to js boolean
	};
	// xlsx structure options
	workfolder?: string; // default 'xl' - the workbook subfolder in zip structure
}



```

## Convenience API

```javascript

	var XLSX = require('xlsx-extract').XLSX;

	//dump arrays
	new XLSX().extract('path/to/file.xlsx', {sheet_id:1}) // or sheet_name or sheet_nr
		.on('sheet', function (sheet) {
			console.log('sheet',sheet);  //sheet is array [sheetname, sheetid, sheetnr]
		})
		.on('row', function (row) {
			console.log('row', row);  //row is a array of values or []
		})
		.on('cell', function (cell) {
			console.log('cell', cell); //cell is a value or null
		})
		.on('error', function (err) {
			console.error('error', err);
		})
		.on('end', function (err) {
			console.log('eof');
		});

	//dump by row in tsv-format
	new XLSX().extract('path/to/file.xlsx', {sheet_id:1, format:'tsv'}) // or sheet_name or sheet_nr
		.on('sheet', function (sheet) {
			console.log('sheet', sheet);  //sheet is tsv sheetname sheetnr
		})
		.on('row', function (row) {
			console.log(row); //row is a tsv line
		})
		.on('cell', function (cell) {
			console.log(cell); //cell is a tsv value
		})
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function (err) {
			console.log('eof');
		});

	//convert to tsv-file (sheet info is not written to file)
	new XLSX().convert('path/to/file.xlsx', 'path/to/destfile.tsv')
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function () {
			console.log('written');
		})

	//convert to json-file (sheet info is not written to file)
	new XLSX().convert('path/to/file.xlsx', 'path/to/destfile.json')
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function () {
			console.log('written');
		})



```

