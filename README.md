# xlsx-extract

Streaming XLSX reader with low memory footprint for Node.js.

XLSX files can be pretty big. Full-featured xlsx modules can hit memory limits or use far more than necessary. `xlsx-extract` parses only what you need — sheet by sheet, row by row — without loading the entire file into memory.

[![NPM](https://nodei.co/npm/xlsx-extract.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/xlsx-extract)

![test](https://github.com/ffalt/xlsx-extract/workflows/test/badge.svg)
[![license](https://img.shields.io/npm/l/xlsx-extract.svg)](http://opensource.org/licenses/MIT)
[![known vulnerabilities](https://snyk.io/test/github/ffalt/xlsx-extract/badge.svg)](https://snyk.io/test/github/ffalt/xlsx-extract)
[![certification](https://api.codacy.com/project/badge/Grade/7bd868b2fb1c4f38ad9ef2ffb698c314)](https://app.codacy.com/gh/ffalt/xlsx-extract)
[![total downloads](https://badgen.net/npm/dt/xlsx-extract)](https://badgen.net/npm/dt/xlsx-extract)


## Install

```
npm install xlsx-extract
```

Requires Node.js >= 20. XML parsing is done with [sax-js](https://github.com/isaacs/sax-js); ZIP extraction with [yauzl](https://github.com/thejoshwolfe/yauzl).

## API

```javascript
// ES Modules
import { XLSX } from 'xlsx-extract';
```

```javascript
// CommonJS
const { XLSX } = require('xlsx-extract');
```

### `extract(filename, options?)`

Streams sheet/row/cell events from an XLSX file. Returns an `EventEmitter`.

```javascript
new XLSX().extract('path/to/file.xlsx', { sheet_nr: '1' })
  .on('sheet', (sheet) => {
    // sheet: [sheetname, sheetid, sheetnr]
    console.log('sheet', sheet);
  })
  .on('row', (row) => {
    // row: array of values (format:'array') or formatted string (format:'tsv'/'json')
    console.log('row', row);
  })
  .on('cell', (cell) => {
    // cell: a single value or null
    console.log('cell', cell);
  })
  .on('error', (err) => console.error(err))
  .on('end', () => console.log('done'));
```

### `convert(filename, destfile, options?)`

Converts an XLSX file to TSV or JSON and writes the result to `destfile`.

```javascript
new XLSX().convert('path/to/file.xlsx', 'output.tsv')
  .on('error', (err) => console.error(err))
  .on('end', () => console.log('written'));

new XLSX().convert('path/to/file.xlsx', 'output.json')
  .on('error', (err) => console.error(err))
  .on('end', () => console.log('written'));
```

## Options

```typescript
interface IXLSXExtractOptions {
  // Sheet selection — provide one of:
  sheet_name?: string;   // select by sheet name
  sheet_nr?: string;     // default "1" — select by 1-based sheet number
  sheet_id?: string;     // select by sheet id, e.g. "1"
  sheet_rid?: string;    // select by internal sheet rid, e.g. "rId1"
  sheet_all?: boolean;   // default false — iterate all sheets

  // Row selection
  ignore_header?: number;       // default 0 — skip this many header rows
  include_empty_rows?: boolean; // default false — include empty rows

  // Output format
  format?: string; // 'array' (default) | 'json' | 'tsv' | 'obj'

  // TSV options
  tsv_float_comma?: boolean; // default false — use ',' as decimal separator
  tsv_delimiter?: string;    // default '\t'
  tsv_endofline?: string;    // default os.EOL

  // Value conversion
  raw_values?: boolean;      // default false — skip all format conversion
  round_floats?: boolean;    // default true — round floats per cell format
  date1904?: boolean;        // default false — use 1904 date system
  ignore_timezone?: boolean; // default false — ignore timezone in date parsing
  convert_values?: {
    ints?: boolean;    // round to int when number format is integer
    floats?: boolean;  // round floats per number format
    dates?: boolean;   // convert xlsx date serial to JS Date
    bools?: boolean;   // convert xlsx bool to JS boolean
  };

  // XLSX structure
  workfolder?: string; // default 'xl' — workbook subfolder in the ZIP
}
```



## CLI Usage

The package includes the `xlsxe` command-line tool.

```
xlsxe [file] [destfile] [options]

Arguments:
  file          source .xlsx file
  destfile      destination file (tsv or json)

Options:
  -f, --file <file>    source .xlsx
  -d, --dest <file>    destination file
  -m, --mode <mode>    output format: json or tsv (default: tsv)
  -s, --sheet <nr>     sheet number (default: 1)
  -n, --header <nr>    number of header rows to skip
  -e, --empty          include empty rows
  -r, --raw            do not convert values
  --d1904              use 1904 date base
```

**Examples:**

```bash
# Print sheet 1 as TSV to stdout
xlsxe data.xlsx

# Convert to TSV file
xlsxe data.xlsx output.tsv

# Convert sheet 2 to JSON, skipping 1 header row
xlsxe data.xlsx output.json --sheet 2 --header 1 --mode json
```


## Output Formats

| `format`          | `row` event value                            | `cell` event value         |
|-------------------|----------------------------------------------|----------------------------|
| `array` (default) | `any[]` — array of cell values               | single value or `null`     |
| `tsv`             | tab-separated string                         | tab-separated value string |
| `json`            | JSON array string (one row)                  | JSON value string          |
| `obj`             | `Record<string, any>` keyed by column header | single value or `null`     |
