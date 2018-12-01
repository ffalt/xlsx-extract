export interface IXLSXExtractOptions {
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

