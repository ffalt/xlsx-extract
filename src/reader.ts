import { getColumnFromDefinition, splitCellFormats, xlsx_fmts } from './utils';
import { Workbook } from './book';
import { Row } from './row';
import { Cell, ICellFormatStyles } from './cell';
import { IXLSXExtractOptions } from './types';
import { Sheet } from './sheet';
import { ISaxParser, SaxSax } from './xml';
import { applyDefaults } from './defaults';
import { IUnzip, IUnzipEntry, YauzlUnzip } from './unzip';

export class XLSXReader {
	filename: string;
	options: IXLSXExtractOptions = {};
	workfolder: string;

	constructor(filename: string, options?: IXLSXExtractOptions) {
		this.filename = filename;
		this.options = applyDefaults(options);
		this.workfolder = this.options.workfolder ?? 'xl';
	}

	private createParser(): ISaxParser {
		return new SaxSax();
	}

	private createUnzip(): IUnzip {
		return new YauzlUnzip();
	}

	private parseXMLSheet(
		entry: IUnzipEntry,
		workbook: Workbook,
		emit: (row?: Row, cell?: Cell) => void,
		callback: (error?: Error) => void
	) {
		/*
		 converts cell value according to the cell type & number format
		 */
		let addValue = false;
		let addFormular = false;
		let row: Row;
		let rowNumber = 1;
		let cell: Cell;
		const sax = this.createParser()
			.onStartElement((name, attributes) => {
				switch (name) {
					case 'row': {
						if (this.options.include_empty_rows) {
							const rownr = parseInt(attributes.r ?? '', 10);
							// TODO: if rows are not sorted, we are screwed - track and warn user if so
							// reading them first and sort is not wanted, since rows are streamed
							while (rowNumber < rownr) {
								rowNumber++;
								emit(new Row());
							}
							rowNumber = rownr + 1;
						}
						row = new Row();

						break;
					}
					case 'c': {
						cell = new Cell();
						cell.typ = (attributes.t ?? 'n');
						cell.fmt = attributes.s ? workbook.styles[attributes.s] : undefined;
						cell.address = attributes.r;
						cell.col = getColumnFromDefinition(attributes.r ?? '');
						// TODO: if cols are not sorted, we are screwed - track and warn user if so
						while (row.count() < cell.col) {
							const empty = new Cell();
							empty.col = row.count();
							row.push(empty);
							emit(undefined, cell);
						}
						row.push(cell);

						break;
					}
					case 'v': {
						addValue = true;

						break;
					}
					case 't': { // support for inline text <c t="inlineStr"><is><t>Product</t></is></c>
						addValue = true;

						break;
					}
					case 'f': {
						addFormular = true;

						break;
					}
					// No default
				}
			})
			.onEndElement(name => {
				switch (name) {
					case 'row': {
						if (row.cells.length > 0 || this.options.include_empty_rows) {
							emit(row);
						}
						break;
					}
					case 'v': {
						addValue = false;
						break;
					}
					case 't': {
						addValue = false;
						break;
					}
					case 'f': {
						addFormular = false;
						break;
					}
					case 'c': {
						addValue = false;
						if (cell.col !== undefined && cell.col >= 0) {
							if (cell.typ === 's') {
								cell.val = workbook.sharedStrings[parseInt(cell.val as string, 10)];
							}
							cell.raw = cell.val as string;
							if (!this.options.raw_values) {
								cell.convertValue(this.options);
							}
							emit(undefined, cell);
						}

						break;
					}
					// No default
				}
			})
			.onText((txt: string) => {
				if (addValue) {
					cell.val = ((cell.val ?? '') as string) + txt;
				}
				if (addFormular) {
					cell.formula = (cell.formula ?? '') + txt;
				}
			})
			.onClose(callback);
		entry.pipe(sax.piper());
	}

	private parseXMLWorkbookSheets(entry: IUnzipEntry, callback: (error: Error | undefined, sheets: Sheet[]) => void) {
		const sheets: Sheet[] = [];
		const sax = this.createParser()
			.onStartElement((name, attributes) => {
				if (name === 'sheet') {
					const sheet = new Sheet();
					sheet.rid = attributes['r:id'] ?? '';
					sheet.id = attributes.sheetid;
					sheet.nr = (sheets.length + 1).toString();
					sheet.name = attributes.name;
					sheets.push(sheet);
				}
			})
			.onClose(error => {
				callback(error, sheets);
			});
		entry.pipe(sax.piper());
	}

	private parseXMLWorkbookRelations(entry: IUnzipEntry, callback: (error: Error | undefined, relations: { sheetid: string; filename: string }[]) => void) {
		const relations: { sheetid: string; filename: string }[] = [];
		const sax = this.createParser()
			.onStartElement((name, attributes) => {
				if (
					(name === 'relationship') &&
					(typeof attributes.target === 'string') &&
					(attributes.target.toLowerCase().includes('worksheets/sheet')) &&
					attributes.id) {
					relations.push({ sheetid: attributes.id, filename: attributes.target });
				}
			})
			.onClose(error => {
				callback(error, relations);
			});
		entry.pipe(sax.piper());
	}

	private parseXMLStyles(entry: IUnzipEntry, callback: (error: Error | undefined, formatStyles: ICellFormatStyles) => void) {
		const formatStyles: ICellFormatStyles = {};
		const numberFmts: Record<string, string> = {};
		const cellXfs: number[] = [];
		let cellXfs_collect = false;
		const sax = this.createParser()
			.onStartElement((name, attributes) => {
				if (name === 'numfmt') {
					if (attributes.numfmtid && attributes.formatcode) {
						numberFmts[attributes.numfmtid] = attributes.formatcode;
					}
				} else if (name === 'cellxfs') {
					cellXfs_collect = true;
				} else if ((cellXfs_collect) && (name === 'xf')) {
					const fmtnr = parseInt(attributes.numfmtid ?? '', 10);
					cellXfs.push(fmtnr);
					const stylenr = (cellXfs.length - 1).toString();
					const fmt = numberFmts[fmtnr] || xlsx_fmts[fmtnr];
					formatStyles[stylenr] = {
						fmt: fmt ?? undefined,
						fmtnr: fmtnr,
						fmts: (fmt ? splitCellFormats(fmt) : []),
						def: attributes
					};
				}
			})
			.onEndElement((name: string) => {
				if (name === 'cellxfs') {
					cellXfs_collect = false;
				}
			})
			.onClose(error => {
				callback(error, formatStyles);
			});
		entry.pipe(sax.piper());
	}

	private parseXMLStrings(entry: IUnzipEntry, callback: (error: Error | undefined, strings: string[]) => void) {
		const strings: string[] = [];
		let collect_strings = false;
		let sl: string[] = [];
		let s = '';
		let phonetic = false;
		const sax = this.createParser()
			.onStartElement(name => {
				switch (name) {
					case 'si': {
						sl = [];
						break;
					}
					case 't': {
						collect_strings = true;
						s = '';
						break;
					}
					case 'rph': {
						phonetic = true;
						break;
					}
				}
			})
			.onEndElement(name => {
				switch (name) {
					case 't': {
						sl.push(s);
						collect_strings = false;
						break;
					}
					case 'rph': {
						phonetic = false;
						break;
					}
					case 'si': {
						strings.push(sl.join(''));
						break;
					}
				}
			})
			.onText(text => {
				if (collect_strings && !phonetic) {
					s = s + text.replaceAll('\r\n', '\n');
				}
			})
			.onClose(error => {
				callback(error, strings);
			});
		entry.pipe(sax.piper());
	}

	private getLookups(workbook: Workbook): { sheet?: Sheet; filename: string }[] {
		const result: { sheet?: Sheet; filename: string }[] = [];
		if (this.options.sheet_all) {
			for (const s of workbook.sheets) {
				const relation = workbook.relations.find(r => r.sheetid === s.rid);
				if (relation) {
					result.push({ sheet: s, filename: `${this.workfolder}/${relation.filename}` });
				}
			}
			return result;
		}
		let sheet: Sheet | undefined;
		if (this.options.sheet_name) {
			sheet = workbook.getByName(this.options.sheet_name);
		} else if (this.options.sheet_rid) {
			sheet = workbook.getByRId(this.options.sheet_rid);
		} else if (this.options.sheet_id) {
			sheet = workbook.getById(this.options.sheet_id);
		} else {
			const sheet_nr = this.options.sheet_nr ?? '1';
			sheet = workbook.getByNr(sheet_nr);
			if (!sheet) {
				result.push({ filename: `${this.workfolder}/worksheets/sheet${sheet_nr}.xml` });
			}
		}
		if (sheet) {
			const sheetId = sheet.rid;
			const relation = workbook.relations.find(r => r.sheetid === sheetId);
			if (relation) {
				result.push({ sheet, filename: `${this.workfolder}/${relation.filename}` });
			}
		}
		return result;
	}

	private parseSheets(workbook: Workbook, emit: (part: { err?: Error; cell?: Cell; row?: Row; sheet?: Sheet }) => void) {
		let running = 1;

		const finish = () => {
			if (running === 0) {
				emit({});
			}
		};
		const lookups = this.getLookups(workbook);
		const unzip = this.createUnzip();
		unzip.read(this.filename,
			entry => {
				const lookup = lookups.find(l => l.filename === entry.path);
				if (lookup) {
					running++;
					let row_count = 1;
					const row_start = this.options.ignore_header ?? 0;
					if (lookup.sheet) {
						emit({ sheet: lookup.sheet });
					}
					this.parseXMLSheet(entry, workbook, (row, cell) => {
						if (cell) {
							if (row_count > row_start) {
								emit({ cell: cell });
							}
						} else if (row) {
							if (row_count > row_start) {
								emit({ row: row });
							}
							row_count++;
						}
					}, error => {
						if (error) {
							emit({ err: error });
						} else {
							running--;
							finish();
						}
					});
				} else {
					entry.ignore();
				}
			},
			error => {
				emit({ err: error });
				emit({});
			},
			() => {
				running--;
				finish();
			}
		);
	}

	private parseWorkbook(emit: (part: { err?: Error; cell?: Cell; row?: Row; sheet?: Sheet }) => void) {
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
		const unzip = this.createUnzip();
		unzip.read(this.filename,
			entry => {
				switch (entry.path) {
					case `${this.workfolder}/sharedStrings.xml`: {
						collecting++;
						this.parseXMLStrings(entry, (_error, strings) => {
							workbook.sharedStrings = strings;
							checkStartParseSheet();
						});
						break;
					}
					case `${this.workfolder}/styles.xml`: {
						collecting++;
						this.parseXMLStyles(entry, (_error, formatstyles) => {
							workbook.styles = formatstyles;
							checkStartParseSheet();
						});
						break;
					}
					case `${this.workfolder}/workbook.xml`: {
						collecting++;
						this.parseXMLWorkbookSheets(entry, (_error, sheets) => {
							workbook.sheets = sheets;
							checkStartParseSheet();
						});
						break;
					}
					case `${this.workfolder}/_rels/workbook.xml.rels`: {
						collecting++;
						this.parseXMLWorkbookRelations(entry, (_error, relations) => {
							workbook.relations = relations;
							checkStartParseSheet();
						});
						break;
					}
					default: {
						entry.ignore();
					}
				}
			},
			error => {
				emit({ err: error });
				emit({});
			},
			() => {
				checkStartParseSheet();
			}
		);
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
