import {alphaNum, splitCellFormats, xlsx_fmts} from './utils';
import {Workbook} from './book';
import * as fs from 'fs';
import * as os from 'os';
import {Row} from './row';
import {Cell, ICellFormatStyles} from './cell';
import {IXLSXExtractOptions} from '../types';
import {Sheet} from './sheet';
import {Sax} from './sax';

const unzip = require('unzip2');
const debug = require('debug')('xlsx-extract-reader');

interface IZipEntry {
	path: string;
	pipe: (stream: any) => any;
	autodrain: () => any;
}

export class XLSXReader {
	filename: string;
	options: IXLSXExtractOptions = {
		sheet_nr: '1',
		ignore_header: 0,
		date1904: false,
		include_empty_rows: false,
		tsv_float_comma: false,
		tsv_delimiter: '\t',
		tsv_endofline: os.EOL,
		format: 'array',
		raw_values: false,
		round_floats: true,
		convert_values: {
			ints: true,
			floats: true,
			dates: true,
			bools: true
		}
	};

	constructor(filename: string, options: IXLSXExtractOptions) {
		this.filename = filename;
		this.options = Object.assign(this.options, options);
	}

	private createParser(): Sax {
		const sax = new Sax();
		return sax;
	}

	private parseXMLSheet(entry: IZipEntry, workbook: Workbook, emit: (row?: Row | null, cell?: Cell | null) => void, cb: (err?: Error) => void) {
		/*
		 A1 -> 0
		 A2 -> 0
		 B2 -> 1
		 */
		const getColumnFromDef = (coldef: string) => {
			let cc = '';
			for (let i = 0; i < coldef.length; i++) {
				if (isNaN(parseInt(coldef[i], 10))) {
					cc += coldef[i];
				} else {
					break;
				}
			}
			return alphaNum(cc);
		};

		/*
		 converts cell value according to the cell type & number format
		 */
		let addvalue = false;
		let row: Row;
		let rownum = 1;
		let cell: Cell;
		const sax = this.createParser()
			.onStartElement((name, attrs) => {
				if (name === 'row') {
					if (this.options.include_empty_rows) {
						const rownr = parseInt(attrs.r || '', 10);
						//TODO: if rows are not sorted, we are screwed - track and warn user if so
						//reading them first and sort is not wanted, since rows are streamed
						while (rownum < rownr) {
							rownum++;
							emit(new Row());
						}
						rownum = rownr + 1;
					}
					row = new Row();
				} else if (name === 'c') {
					cell = new Cell();
					cell.typ = (attrs.t ? attrs.t : 'n');
					cell.fmt = attrs.s ? workbook.styles[attrs.s] : undefined;
					cell.col = getColumnFromDef(attrs.r || '');
					//TODO: if cols are not sorted, we are screwed - track and warn user if so
					while (row.count() < cell.col) {
						const empty = new Cell();
						empty.col = row.count();
						row.push(empty);
						emit(null, cell);
					}
					row.push(cell);
				} else if (name === 'v') {
					addvalue = true;
				} else if (name === 't') { // support for inline text <c t="inlineStr"><is><t>Product</t></is></c>
					addvalue = true;
				}
			})
			.onEndElement((name) => {
				if (name === 'row') {
					if (row) {
						emit(row);
					}
				} else if (name === 'v') {
					addvalue = false;
				} else if (name === 't') {
					addvalue = false;
				} else if (name === 'c') {
					addvalue = false;
					if (cell.col >= 0) {
						if (cell.typ === 's') {
							cell.val = workbook.sharedStrings[parseInt(cell.val, 10)];
						}
						cell.raw = cell.val;
						if (!this.options.raw_values) {
							cell.convertValue(this.options);
						}
						emit(null, cell);
					}
				}
			})
			.onText((txt: string) => {
				if (addvalue) {
					cell.val = (cell.val ? cell.val : '') + txt;
				}
			})
			.onClose(cb);
		entry.pipe(sax.piper());
	}

	private parseXMLWorkbookSheets(entry: IZipEntry, cb: (err: Error | undefined, sheets: Array<Sheet>) => void) {
		const sheets: Array<Sheet> = [];
		const sax = this.createParser()
			.onStartElement((name, attrs) => {
				if (name === 'sheet') {
					const sheet = new Sheet();
					sheet.rid = attrs['r:id'] || '';
					sheet.id = attrs.sheetId;
					sheet.name = attrs.name;
				}
			})
			.onClose((err) => {
				cb(err, sheets);
			});
		entry.pipe(sax.piper());
	}

	private parseXMLWorkbookRelations(entry: IZipEntry, cb: (err: Error | undefined, relations: Array<{ sheetid: string, filename: string }>) => void) {
		const relations: Array<{ sheetid: string, filename: string }> = [];
		const sax = this.createParser()
			.onStartElement((name, attrs) => {
				if (
					(name === 'Relationship') &&
					(typeof attrs.Target === 'string') &&
					(attrs.Target.toLowerCase().indexOf('worksheets/sheet') >= 0) &&
					attrs.Id) {
					relations.push({sheetid: attrs.Id, filename: attrs.Target});
				}
			})
			.onClose((err) => {
				cb(err, relations);
			});
		entry.pipe(sax.piper());
	}

	private parseXMLStyles(entry: IZipEntry, cb: (err: Error | undefined, formatstyles: ICellFormatStyles) => void) {
		const formatstyles: ICellFormatStyles = {};
		const numFmts: { [id: string]: string } = {};
		const cellXfs: Array<number> = [];
		let cellXfs_collect = false;
		const sax = this.createParser()
			.onStartElement((name, attrs) => {
				if (name === 'numFmt') {
					if (attrs.numFmtId && attrs.formatCode) {
						numFmts[attrs.numFmtId] = attrs.formatCode;
					}
				} else if (name === 'cellXfs') {
					cellXfs_collect = true;
				} else if ((cellXfs_collect) && (name === 'xf')) {
					const fmtnr = parseInt(attrs.numFmtId || '', 10);
					cellXfs.push(fmtnr);
					const stylenr = (cellXfs.length - 1).toString();
					const fmt = numFmts[fmtnr] || xlsx_fmts[fmtnr];
					formatstyles[stylenr] = {
						fmt: fmt === null ? undefined : fmt,
						fmtnr: fmtnr,
						fmts: (fmt ? splitCellFormats(fmt) : []),
						def: attrs
					};
				}
			})
			.onEndElement((name: string) => {
				if (name === 'cellXfs') {
					cellXfs_collect = false;
				}
			})
			.onClose((err) => {
				cb(err, formatstyles);
			});
		entry.pipe(sax.piper());
	}

	private parseXMLStrings(entry: IZipEntry, cb: (err: Error | undefined, strings: Array<string>) => void) {
		const strings: Array<string> = [];
		let strings_collect = false;
		let sl: Array<string> = [];
		let s = '';
		const sax = this.createParser()
			.onStartElement((name, attrs) => {
				if (name === 'si') {
					sl = [];
				}
				if (name === 't') {
					strings_collect = true;
					s = '';
				}
			})
			.onEndElement((name) => {
				if (name === 't') {
					sl.push(s);
					strings_collect = false;
				}
				if (name === 'si') {
					strings.push(sl.join(''));
				}
			})
			.onText((txt) => {
				if (strings_collect) {
					s = s + txt;
				}
			})
			.onClose((err) => {
				cb(err, strings);
			});
		entry.pipe(sax.piper());
	}

	private getLookups(workbook: Workbook): Array<{ sheet?: Sheet, filename: string }> {
		let sheet: Sheet | undefined;
		let result: Array<{ sheet?: Sheet, filename: string }> = [];
		if (this.options.sheet_name) {
			sheet = workbook.getByName(this.options.sheet_name);
		} else if (this.options.sheet_id) {
			sheet = workbook.getById(this.options.sheet_id);
		} else if (this.options.sheet_nr) {
			sheet = workbook.getByNr(this.options.sheet_nr);
			if (!sheet) {
				result.push({filename: 'xl/worksheets/sheet' + this.options.sheet_nr + '.xml'});
			}
		}
		if (sheet) {
			let sheetId = sheet.id;
			let rel = workbook.relations.find(r => r.sheetid === sheetId);
			if (rel) {
				result.push({sheet, filename: 'xl/' + rel.filename});
			}
		}
		return result;
	}

	private parseSheets(workbook: Workbook, emit: (part: { err?: Error, cell?: Cell, row?: Row, sheet?: Sheet }) => void) {
		let running = 1;

		const finish = () => {
			if (running === 0) {
				emit({});
			}
		};
		let lookups = this.getLookups(workbook);
		fs.createReadStream(this.filename)
			.pipe(unzip.Parse())
			.on('error', (err: Error) => {
				emit({err});
			})
			.on('entry', (entry: IZipEntry) => {
				const lookup = lookups.find(l => l.filename === entry.path);
				if (lookup) {
					running++;
					let row_count = 1;
					let row_start = this.options.ignore_header || 0;
					if (lookup.sheet) {
						emit({sheet: lookup.sheet});
					}
					this.parseXMLSheet(entry, workbook, (row, cell) => {
						if (cell) {
							if (row_count > row_start) {
								emit({cell: cell});
							}
						} else if (row) {
							if (row_count > row_start) {
								emit({row: row});
							}
							row_count++;
						}
					}, (err) => {
						if (err) {
							emit({err: err})
						} else {
							running--;
							finish();
						}
					});
				} else {
					entry.autodrain();
				}
			})
			.on('close', () => {
				running--;
				finish();
			});
	}

	private parseWorkbook(emit: (part: { err?: Error, cell?: Cell, row?: Row, sheet?: Sheet }) => void) {
		const workbook = new Workbook();
		let collecting = 1;

		const checkStartParseSheet = () => {
			collecting--;
			if (collecting === 0) {
				this.parseSheets(workbook, emit);
			}
		};

		// first get styles & strings
		// TODO: is there really no memory friendly way to NOT read zip stream twice for styles/strings/etc and then for sheets?
		fs.createReadStream(this.filename)
			.pipe(unzip.Parse())
			.on('error', (err: Error) => {
				emit({err});
				emit({});
			})
			.on('entry', (entry: IZipEntry) => {
				if (entry.path === 'xl/sharedStrings.xml') {
					collecting++;
					this.parseXMLStrings(entry, (err, strings) => {
						workbook.sharedStrings = strings;
						checkStartParseSheet();
					});
				} else if (entry.path === 'xl/styles.xml') {
					collecting++;
					this.parseXMLStyles(entry, (err, formatstyles) => {
						workbook.styles = formatstyles;
						checkStartParseSheet();
					});
				} else if (entry.path === 'xl/workbook.xml') {
					collecting++;
					this.parseXMLWorkbookSheets(entry, (err, sheets) => {
						workbook.sheets = sheets;
						checkStartParseSheet();
					});
				} else if (entry.path === 'xl/_rels/workbook.xml.rels') {
					collecting++;
					this.parseXMLWorkbookRelations(entry, (err, relations) => {
						workbook.relations = relations;
						checkStartParseSheet();
					});
				} else {
					entry.autodrain();
				}
			})
			.on('close', () => {
				checkStartParseSheet();
			});
	}

	read(emit: (what: string, data?: any) => void) {
		this.parseWorkbook(part => {
			if (part.err) {
				emit('error', part.err);
			} else if (part.cell) {
				emit('cell', part.cell.getFormat(this.options));
			} else if (part.row) {
				emit('row', part.row.getFormat(this.options));
			} else if (part.sheet) {
				emit('sheet', part.sheet.getFormat(this.options));
			} else {
				emit('end');
			}
		});
	}
}
