import os from 'os';
export function applyDefaults(options) {
    var defaults = {
        sheet_nr: '1',
        ignore_header: 0,
        date1904: false,
        include_empty_rows: false,
        tsv_float_comma: false,
        tsv_delimiter: '\t',
        tsv_endofline: os.EOL,
        parser: 'sax',
        format: 'array',
        workfolder: 'xl',
        raw_values: false,
        round_floats: true,
        convert_values: {
            ints: true,
            floats: true,
            dates: true,
            bools: true
        }
    };
    return Object.assign(defaults, options);
}
//# sourceMappingURL=defaults.js.map