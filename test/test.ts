import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import {assert, should, expect, use} from 'chai';
import chaiExclude = require('chai-exclude');
import {describe, it} from 'mocha';
import {Sheet} from '../src/sheet';
import {XLSX} from '../src';
import {IXLSXExtractOptions} from '../src/types';
import {Cell} from '../src/cell';
import tmp from 'tmp';
import {escapeTSV, isValidDate} from '../src/utils';

use(chaiExclude);
const parsers: Array<string> = [
	'sax',
	'expat',
];

export function collectTestFiles(dirs: Array<string>, rootDir: string, testSingleFile?: string): Array<string> {
	const files: Array<string> = [];
	dirs.forEach(dir => {
		const files1 = fs.readdirSync(path.join(rootDir, dir));
		files1.forEach(f => {
			if (['.xlsx'].indexOf(path.extname(f).toLowerCase()) >= 0) {
				const stat = fs.lstatSync(path.join(rootDir, dir, f));
				if (!stat.isDirectory()
					&& (!testSingleFile || path.join(dir, f).indexOf(testSingleFile) >= 0)
				) {
					files.push(path.join(dir, f));
				}
			}
		});
	});
	return files;
}

const testfiles: Array<string> = collectTestFiles([
		'data',
		'data/sheetjs_test_files'
	], __dirname
	// , 'wtf_path'
);

interface IXLSXSpecCell {
	raw?: string;
	val?: any;
	typ?: any;
	fmt?: any;
	fmt_typ?: any;
}

interface IXLSXSpecSheet {
	nr: string;
	name: string;
	id: string;
	rid: string;
	rows: Array<Array<IXLSXSpecCell>>;
}

interface IXLSXSpec {
	description: string;
	workfolder?: string;
	sheets?: Array<IXLSXSpecSheet>;
	error?: boolean;
}

interface IXLSXDataSheet extends Sheet {
	rows: Array<{ cells: Array<Cell> }>;
}

interface IXLSXData {
	sheets: Array<IXLSXDataSheet>;
}

function convertToTsv(filename: string, options: IXLSXExtractOptions, cb: (err: Error | null, tsv?: string) => void) {
	const file = tmp.fileSync();
	fs.unlinkSync(file.name);
	let error: Error | null = null;
	new XLSX().convert(filename, file.name, options)
		.on('end', () => {
			const exists = fs.existsSync(file.name);
			assert.equal(exists, true, 'file not written');
			if (exists) {
				const tsv = fs.readFileSync(file.name).toString();
				file.removeCallback();
				cb(error, tsv);
			} else {
				cb(error);
			}

		})
		.on('error', err => {
			error = err;
		});
}

function readFile(filename: string, options: IXLSXExtractOptions, cb: (err: Error | null, xlsx?: IXLSXData) => void) {
	const xlsx: IXLSXData = {
		sheets: []
	};

	let error: Error | null = null;
	new XLSX().extract(filename, Object.assign({format: 'obj', include_empty_rows: true}, options))
		.on('sheet', sheet => {
			sheet.rows = [];
			xlsx.sheets.push(sheet);
		})
		.on('row', row => {
			if (xlsx.sheets.length > 0) {
				xlsx.sheets[xlsx.sheets.length - 1].rows.push(row);
			}
		})
		.on('end', () => {
			cb(error, xlsx);
		})
		.on('error', err => {
			error = err;
		});
}

function compareSheet(filename: string, specsheet: IXLSXSpecSheet, sheet?: IXLSXDataSheet) {
	should().exist(sheet);
	if (!sheet) {
		return;
	}
	expect(sheet).excluding(['rows']).to.deep.equal(specsheet, 'Sheets not equal');
	if (sheet.rows.length !== (specsheet.rows ? specsheet.rows.length : 0)) {
		console.log(sheet, specsheet);
	}
	assert.equal(sheet.rows.length, specsheet.rows ? specsheet.rows.length : 0, 'Invalid sheet row count');
	if (!specsheet.rows) {
		return;
	}
	specsheet.rows.forEach((specrow, index) => {
		const sheetrow = sheet.rows[index].cells.map((cell: Cell) => {
			const def: IXLSXSpecCell = {};
			const fmt = cell.getEffectiveNumFormat();
			if (fmt) {
				def.fmt = fmt.fmt;
				def.fmt_typ = fmt.fmt_type;
			}
			if (cell.typ) {
				def.typ = cell.typ;
			}
			if (cell.raw) {
				def.raw = cell.raw;
			}
			if (cell.raw && cell.val !== cell.raw) {
				def.val = cell.val;
				if (isValidDate(def.val)) {
					def.val = def.val.toISOString();
				}
			}
			return def;
		});
		expect(sheetrow).to.deep.equal(specrow, 'Row not equal');
	});
}

function toSpec(xlsx: IXLSXData, filename: string) {
	if (fs.existsSync(filename + '.spec.json')) {
		return;
	}
	const spec = {
		description: 'must be manually compared',
		sheets: xlsx.sheets.map(sheet => {
			return {
				'name': sheet.name,
				'nr': sheet.nr,
				'id': sheet.id,
				'rid': sheet.rid,
				'rows': sheet.rows.map(r => {
					return r.cells.map((cell: Cell) => {
						const def: IXLSXSpecCell = {};
						const fmt = cell.getEffectiveNumFormat();
						if (fmt) {
							def.fmt = fmt.fmt;
							def.fmt_typ = fmt.fmt_type;
						}
						if (cell.typ) {
							def.typ = cell.typ;
						}
						if (cell.raw) {
							def.raw = cell.raw;
						}
						if (cell.raw && cell.val !== cell.raw) {
							def.val = cell.val;
							if (util.types.isDate(def.val)) {
								if (isValidDate(cell.val)) {
									def.val = cell.val.toISOString();
								} else {
									def.val = cell.val.toString();
								}
							}
						}
						return def;
					});
				})
			};
		})
	};

	const compact = JSON.stringify(spec).replace(/\],\[/g, '],\n\t\t\t[')
		.replace(/"sheets":\[{/g, '\n\t"sheets": [\n\t{\n\t\t')
		.replace(/"rows":\[/g, '\n\t\t"rows": [\n\t\t\t')
		.replace(/}\]\]},/g, '}]\n\t\t]\n\t},\n\t')
		.replace(/{"name"/g, '{\n\t\t"name"')
		.replace(/\]\]}\]}/g, ']\n\t\t]\n\t}\n\t]\n}')
	;
	fs.writeFileSync(filename + '.spec.json', compact);
}

function compareSpec(filename: string, xlsx: IXLSXData, spec: IXLSXSpec) {
	const specsheets = (spec.sheets || []);
	assert.equal(xlsx.sheets.length, specsheets.length, 'Invalid sheet count');
	specsheets.forEach((specsheet) => {
		compareSheet(filename, specsheet, xlsx.sheets.find(s => s.nr === specsheet.nr));
	});
}

function compareSingleSpec(filename: string, xlsx: IXLSXData, specsheet: IXLSXSpecSheet) {
	assert.equal(xlsx.sheets.length, 1, 'Invalid sheet count, should be 1');
	compareSheet(filename, specsheet, xlsx.sheets[0]);
}

function defToTSV(specSheet: IXLSXSpecSheet, options: IXLSXExtractOptions) {
	return (specSheet.rows || []).map(row => {
		return row.map(cell => {
			if (cell.typ === 'b') {
				return cell.val ? 'true' : 'false';
			}
			return escapeTSV((cell.val || cell.raw || '').toString(), options);
		}).join(options.tsv_delimiter);
	}).join(options.tsv_endofline) + ((specSheet.rows || []).length > 0 ? options.tsv_endofline : '');
}

describe('xlsx', function() {
	this.timeout(10000);
	testfiles.forEach(testfile => {
		const sourcefile = path.join(__dirname, testfile);
		if (!fs.existsSync(sourcefile + '.spec.json')) {
			readFile(sourcefile, {sheet_all: true}, (err, xlsx) => {
				if (err || !xlsx) {
					return;
				}
				toSpec(xlsx, sourcefile);
			});
			return;
		}
		const spec: IXLSXSpec = JSON.parse(fs.readFileSync(sourcefile + '.spec.json').toString());
		const workfolder: string | undefined = spec.workfolder;
		if (spec.error) {
			describe(spec.description + ' - ' + testfile, () => {
				parsers.forEach(parser => {
					describe(parser, () => {
						it('should fail according to spec', done => {
							readFile(sourcefile, {sheet_all: true, parser, workfolder}, (err, xlsx) => {
								should().exist(err);
								done();
							});
						});
					});
				});
			});
		} else {
			describe(spec.description + ' - ' + testfile, () => {
				parsers.forEach(parser => {
					describe(parser, () => {
						it('should read and compare according to spec', done => {
							readFile(sourcefile, {sheet_all: true, parser, workfolder}, (err, xlsx) => {
								should().not.exist(err);
								should().exist(xlsx);
								if (!xlsx) {
									return done();
								}
								compareSpec(sourcefile, xlsx, spec);
								done();
							});
						});
						(spec.sheets || []).forEach(specSheet => {
							it('should read the sheet ' + specSheet.nr + ' by number: ' + specSheet.nr, done => {
								readFile(sourcefile, {sheet_nr: specSheet.nr, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									compareSingleSpec(sourcefile, xlsx, specSheet);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' by name: ' + specSheet.name, done => {
								readFile(sourcefile, {sheet_name: specSheet.name, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									compareSingleSpec(sourcefile, xlsx, specSheet);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' by id: ' + specSheet.id, done => {
								readFile(sourcefile, {sheet_id: specSheet.id, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									compareSingleSpec(sourcefile, xlsx, specSheet);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' by rid: ' + specSheet.rid, done => {
								readFile(sourcefile, {sheet_rid: specSheet.rid, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									compareSingleSpec(sourcefile, xlsx, specSheet);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' ignoring the first line', done => {
								readFile(sourcefile, {sheet_rid: specSheet.rid, ignore_header: 1, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									const specSheetLimited: IXLSXSpecSheet = {
										nr: specSheet.nr,
										name: specSheet.name,
										id: specSheet.id,
										rid: specSheet.rid,
										rows: specSheet.rows ? specSheet.rows.slice(1) : []
									};
									compareSingleSpec(sourcefile, xlsx, specSheetLimited);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' ignoring the two lines', done => {
								readFile(sourcefile, {sheet_rid: specSheet.rid, ignore_header: 2, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									const specSheetLimited: IXLSXSpecSheet = {
										nr: specSheet.nr,
										name: specSheet.name,
										id: specSheet.id,
										rid: specSheet.rid,
										rows: specSheet.rows ? specSheet.rows.slice(2) : []
									};
									compareSingleSpec(sourcefile, xlsx, specSheetLimited);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' with empty rows filtered', done => {
								readFile(sourcefile, {sheet_rid: specSheet.rid, include_empty_rows: false, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									const specSheetLimited: IXLSXSpecSheet = {
										nr: specSheet.nr,
										name: specSheet.name,
										id: specSheet.id,
										rid: specSheet.rid,
										rows: specSheet.rows ? specSheet.rows.filter(r => r.length > 0) : []
									};
									compareSingleSpec(sourcefile, xlsx, specSheetLimited);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' ignoring the first line and empty rows filtered', done => {
								readFile(sourcefile, {sheet_rid: specSheet.rid, ignore_header: 1, include_empty_rows: false, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									const specSheetLimited: IXLSXSpecSheet = {
										nr: specSheet.nr,
										name: specSheet.name,
										id: specSheet.id,
										rid: specSheet.rid,
										rows: specSheet.rows ? specSheet.rows.filter(r => r.length > 0).slice(1) : []
									};
									compareSingleSpec(sourcefile, xlsx, specSheetLimited);
									done();
								});
							});
							it('should read the sheet ' + specSheet.nr + ' ignoring the first two lines and empty rows filtered', done => {
								readFile(sourcefile, {sheet_rid: specSheet.rid, ignore_header: 2, include_empty_rows: false, parser, workfolder}, (err, xlsx) => {
									should().not.exist(err);
									should().exist(xlsx);
									if (!xlsx) {
										return done();
									}
									const specSheetLimited: IXLSXSpecSheet = {
										nr: specSheet.nr,
										name: specSheet.name,
										id: specSheet.id,
										rid: specSheet.rid,
										rows: specSheet.rows ? specSheet.rows.filter(r => r.length > 0).slice(2) : []
									};
									compareSingleSpec(sourcefile, xlsx, specSheetLimited);
									done();
								});
							});
							it('should convert to tsv', done => {
								const options: IXLSXExtractOptions = {
									sheet_rid: specSheet.rid, include_empty_rows: true,
									tsv_delimiter: '\t', tsv_endofline: '\n', tsv_float_comma: false,
									parser, workfolder
								};
								convertToTsv(sourcefile, options, (err, tsv) => {
									should().not.exist(err);
									should().exist(tsv);
									assert.equal(tsv, defToTSV(specSheet, options), 'Invalid tsv');
									done();
								});
							});

						});
					});
				});
			});
		}
	});
});
