import { IXLSXExtractOptions } from './types';
export declare function applyDefaults(options: IXLSXExtractOptions | undefined): {
    sheet_nr: string;
    ignore_header: number;
    date1904: boolean;
    include_empty_rows: boolean;
    tsv_float_comma: boolean;
    tsv_delimiter: string;
    tsv_endofline: string;
    parser: string;
    format: string;
    workfolder: string;
    raw_values: boolean;
    round_floats: boolean;
    convert_values: {
        ints: boolean;
        floats: boolean;
        dates: boolean;
        bools: boolean;
    };
} & IXLSXExtractOptions;
