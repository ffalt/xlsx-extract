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
	new XLSX().extract('path/to/file.xlsx', {sheet_nr:1})
		.on('row', function (row) {
			console.log(row);  //row is a array of values or []
		})
		.on('cell', function (cell) {
			console.log(cell); //cell is a value or null
		})
		.on('error', function (err) {
			console.error(err);
		})
		.on('end', function (err) {
			console.log('eof');
		});

	//dump by row in tsv-format
	new XLSX().extract('path/to/file.xlsx', {sheet_nr:1, format:'tsv'})
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
        sheet_nr: 1, // default 1 - the number of the sheet starting on 1
        ignore_header: 0,  // default 0 - the number of header lines to ignore
        include_empty_rows: false,  // default false - include empty rows in the middle/at start
        date1904: false,    // default false - use date 1904 conversion
        tsv_float_comma: false  // default false - use "," als decimal point for floats
        format: '',     // default array - convert to 'array'||'json'||'tsv'||'obj'
        raw_values: false,   // default false - do not apply cell formats (get values as string as in xlsx)
		convert_values: { // apply cell number formats or not
			ints: true,  // rounds to int if number format is for int
			floats: true,  // rounds floats according to float number format
			dates: true,   // converts xlsx date to js date
			bools: true   // converts xlsx bool to js boolean
		}
     };


```

#TODO

- better error handling
- more testing
- publish to npm
- docu for command-line tool xlsxe
- docu for XLSX.utils
- docu for formats callback

