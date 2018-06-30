export interface IXLSXExtractOptions {
	sheet_name?: string;
	sheet_id?: string;
	sheet_nr?: string;
	sheet_all?: boolean;
	ignore_header?: number;
	date1904?: boolean;
	include_empty_rows?: boolean;
	tsv_float_comma?: boolean;
	tsv_delimiter?: string;
	tsv_endofline?: string;
	format?: string;
	raw_values?: boolean;
	round_floats?: boolean;
	parser?: string;
	convert_values?: {
		ints?: boolean;
		floats?: boolean;
		dates?: boolean;
		bools?: boolean;
	};
}
