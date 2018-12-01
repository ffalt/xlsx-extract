export interface IXLSXExtractOptions {
    sheet_name?: string;
    sheet_nr?: string;
    sheet_id?: string;
    sheet_rid?: string;
    sheet_all?: boolean;
    parser?: string;
    ignore_header?: number;
    include_empty_rows?: boolean;
    format?: string;
    tsv_float_comma?: boolean;
    tsv_delimiter?: string;
    tsv_endofline?: string;
    raw_values?: boolean;
    round_floats?: boolean;
    date1904?: boolean;
    convert_values?: {
        ints?: boolean;
        floats?: boolean;
        dates?: boolean;
        bools?: boolean;
    };
    workfolder?: string;
}
