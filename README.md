# xlsx-extract 

-- extracts data from XLSX files with low memory footprint


xlsx-files can get pretty large, so nodejs & full featured xlsx-modules often reach memory limits or just use more than is needed for that task.

(--max-old-space-size & --stack_size can't help you all the time either)

hence these magnificent features:

- filestreams are piped & xml is parsed with sax parser `node-expat`
- get rows/cells each by callback or write them to a .tsv or .json file
- empty lines at the end of the file are ignored

#Convenience API

```javascript

	var XLSX = require('xlsx-extract').XLSX;

	//dump by row
	new XLSX().extract('path/to/file.xlsx', {sheetNr:1})
		.on('row', function (row) {
			console.log(row);
		})
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function (err) {
			console.log('eof');
		});

	//dump by row in tsv-format
	new XLSX().extract('path/to/file.xlsx', {sheetNr:1, format:'tsv'})
		.on('row', function (row) {
			console.log(row); //row a tsv line
		})
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function (err) {
			console.log('eof');
		});

	//convert to tsv-file
	new XLSX().convert('path/to/file.xlsx', 'path/to/destfile.tsv')
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function () {
			console.log('written');
		})

	//convert to json-file
	new XLSX().convert('path/to/file.xlsx', 'path/to/destfile.json')
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function () {
			console.log('written');
		})


	demo_options = {
        sheetnr: 1, // default 1 - the number of the sheet starting on 1
        ignore_header: 0,  // default 0 - the number of header lines to ignore
        include_trailing_empty_rows: false, // default false - include empty rows at the end or not
        include_empty_rows: false,  // default false - include empty rows in the middle/at start
        raw_values: false,   // default false - do not try to apply cell nr formats
        date1904: false,    // default false - use date 1904 conversion
        tsv_float_comma: false  // default false - use "," als decimal point for floats
        format: ''     // default nothing - convert to nothing||'json'||'tsv'
     };


```

#TODO

- better error handling
- more testing
- publish to npm
- docu for command-line tool xlsxe
- docu for XLSX.utils
- test & docu for cell callback

