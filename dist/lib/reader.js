"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var book_1 = require("./book");
var fs_1 = __importDefault(require("fs"));
var unzip2_1 = __importDefault(require("unzip2"));
var row_1 = require("./row");
var cell_1 = require("./cell");
var sheet_1 = require("./sheet");
var xml_1 = require("./xml");
var defaults_1 = require("./defaults");
var XLSXReader = (function () {
    function XLSXReader(filename, options) {
        this.options = {};
        this.filename = filename;
        this.options = defaults_1.applyDefaults(options);
        this.workfolder = this.options.workfolder || 'xl';
    }
    XLSXReader.prototype.createParser = function () {
        if (this.options.parser === 'expat') {
            return new xml_1.SaxExpat();
        }
        return new xml_1.SaxSax();
    };
    XLSXReader.prototype.parseXMLSheet = function (entry, workbook, emit, cb) {
        var _this = this;
        var addvalue = false;
        var addformular = false;
        var row;
        var rownum = 1;
        var cell;
        var sax = this.createParser()
            .onStartElement(function (name, attrs) {
            if (name === 'row') {
                if (_this.options.include_empty_rows) {
                    var rownr = parseInt(attrs.r || '', 10);
                    while (rownum < rownr) {
                        rownum++;
                        emit(new row_1.Row());
                    }
                    rownum = rownr + 1;
                }
                row = new row_1.Row();
            }
            else if (name === 'c') {
                cell = new cell_1.Cell();
                cell.typ = (attrs.t ? attrs.t : 'n');
                cell.fmt = attrs.s ? workbook.styles[attrs.s] : undefined;
                cell.address = attrs.r;
                cell.col = utils_1.getColumnFromDef(attrs.r || '');
                while (row.count() < cell.col) {
                    var empty = new cell_1.Cell();
                    empty.col = row.count();
                    row.push(empty);
                    emit(null, cell);
                }
                row.push(cell);
            }
            else if (name === 'v') {
                addvalue = true;
            }
            else if (name === 't') {
                addvalue = true;
            }
            else if (name === 'f') {
                addformular = true;
            }
        })
            .onEndElement(function (name) {
            if (name === 'row') {
                if (row) {
                    if (row.cells.length > 0 || _this.options.include_empty_rows) {
                        emit(row);
                    }
                }
            }
            else if (name === 'v') {
                addvalue = false;
            }
            else if (name === 't') {
                addvalue = false;
            }
            else if (name === 'f') {
                addformular = false;
            }
            else if (name === 'c') {
                addvalue = false;
                if (cell.col !== undefined && cell.col >= 0) {
                    if (cell.typ === 's') {
                        cell.val = workbook.sharedStrings[parseInt(cell.val, 10)];
                    }
                    cell.raw = cell.val;
                    if (!_this.options.raw_values) {
                        cell.convertValue(_this.options);
                    }
                    emit(null, cell);
                }
            }
        })
            .onText(function (txt) {
            if (addvalue) {
                cell.val = (cell.val ? cell.val : '') + txt;
            }
            if (addformular) {
                cell.formula = (cell.formula ? cell.formula : '') + txt;
            }
        })
            .onClose(cb);
        entry.pipe(sax.piper());
    };
    XLSXReader.prototype.parseXMLWorkbookSheets = function (entry, cb) {
        var sheets = [];
        var sax = this.createParser()
            .onStartElement(function (name, attrs) {
            if (name === 'sheet') {
                var sheet = new sheet_1.Sheet();
                sheet.rid = attrs['r:id'] || '';
                sheet.id = attrs.sheetid;
                sheet.nr = (sheets.length + 1).toString();
                sheet.name = attrs.name;
                sheets.push(sheet);
            }
        })
            .onClose(function (err) {
            cb(err, sheets);
        });
        entry.pipe(sax.piper());
    };
    XLSXReader.prototype.parseXMLWorkbookRelations = function (entry, cb) {
        var relations = [];
        var sax = this.createParser()
            .onStartElement(function (name, attrs) {
            if ((name === 'relationship') &&
                (typeof attrs.target === 'string') &&
                (attrs.target.toLowerCase().indexOf('worksheets/sheet') >= 0) &&
                attrs.id) {
                relations.push({ sheetid: attrs.id, filename: attrs.target });
            }
        })
            .onClose(function (err) {
            cb(err, relations);
        });
        entry.pipe(sax.piper());
    };
    XLSXReader.prototype.parseXMLStyles = function (entry, cb) {
        var formatstyles = {};
        var numFmts = {};
        var cellXfs = [];
        var cellXfs_collect = false;
        var sax = this.createParser()
            .onStartElement(function (name, attrs) {
            if (name === 'numfmt') {
                if (attrs.numfmtid && attrs.formatcode) {
                    numFmts[attrs.numfmtid] = attrs.formatcode;
                }
            }
            else if (name === 'cellxfs') {
                cellXfs_collect = true;
            }
            else if ((cellXfs_collect) && (name === 'xf')) {
                var fmtnr = parseInt(attrs.numfmtid || '', 10);
                cellXfs.push(fmtnr);
                var stylenr = (cellXfs.length - 1).toString();
                var fmt = numFmts[fmtnr] || utils_1.xlsx_fmts[fmtnr];
                formatstyles[stylenr] = {
                    fmt: fmt === null ? undefined : fmt,
                    fmtnr: fmtnr,
                    fmts: (fmt ? utils_1.splitCellFormats(fmt) : []),
                    def: attrs
                };
            }
        })
            .onEndElement(function (name) {
            if (name === 'cellxfs') {
                cellXfs_collect = false;
            }
        })
            .onClose(function (err) {
            cb(err, formatstyles);
        });
        entry.pipe(sax.piper());
    };
    XLSXReader.prototype.parseXMLStrings = function (entry, cb) {
        var strings = [];
        var collect_strings = false;
        var sl = [];
        var s = '';
        var sax = this.createParser()
            .onStartElement(function (name, attrs) {
            if (name === 'si') {
                sl = [];
            }
            if (name === 't') {
                collect_strings = true;
                s = '';
            }
        })
            .onEndElement(function (name) {
            if (name === 't') {
                sl.push(s);
                collect_strings = false;
            }
            if (name === 'si') {
                strings.push(sl.join(''));
            }
        })
            .onText(function (txt) {
            if (collect_strings) {
                s = s + txt.replace(/\r\n/g, '\n');
            }
        })
            .onClose(function (err) {
            cb(err, strings);
        });
        entry.pipe(sax.piper());
    };
    XLSXReader.prototype.getLookups = function (workbook) {
        var _this = this;
        var result = [];
        if (this.options.sheet_all) {
            workbook.sheets.forEach(function (s) {
                var rel = workbook.relations.find(function (r) { return r.sheetid === s.rid; });
                if (rel) {
                    result.push({ sheet: s, filename: _this.workfolder + '/' + rel.filename });
                }
            });
            return result;
        }
        var sheet;
        if (this.options.sheet_name) {
            sheet = workbook.getByName(this.options.sheet_name);
        }
        else if (this.options.sheet_rid) {
            sheet = workbook.getByRId(this.options.sheet_rid.toString());
        }
        else if (this.options.sheet_id) {
            var sheet_id = this.options.sheet_id.toString();
            sheet = workbook.getById(sheet_id);
        }
        else {
            var sheet_nr = this.options.sheet_nr || '1';
            sheet = workbook.getByNr(sheet_nr);
            if (!sheet) {
                result.push({ filename: this.workfolder + '/worksheets/sheet' + sheet_nr + '.xml' });
            }
        }
        if (sheet) {
            var sheetId_1 = sheet.rid;
            var rel = workbook.relations.find(function (r) { return r.sheetid === sheetId_1; });
            if (rel) {
                result.push({ sheet: sheet, filename: this.workfolder + '/' + rel.filename });
            }
        }
        return result;
    };
    XLSXReader.prototype.parseSheets = function (workbook, emit) {
        var _this = this;
        var running = 1;
        var finish = function () {
            if (running === 0) {
                emit({});
            }
        };
        var lookups = this.getLookups(workbook);
        fs_1.default.createReadStream(this.filename)
            .pipe(unzip2_1.default.Parse())
            .on('error', function (err) {
            emit({ err: err });
            emit({});
        })
            .on('entry', function (entry) {
            var lookup = lookups.find(function (l) { return l.filename === entry.path; });
            if (lookup) {
                running++;
                var row_count_1 = 1;
                var row_start_1 = _this.options.ignore_header || 0;
                if (lookup.sheet) {
                    emit({ sheet: lookup.sheet });
                }
                _this.parseXMLSheet(entry, workbook, function (row, cell) {
                    if (cell) {
                        if (row_count_1 > row_start_1) {
                            emit({ cell: cell });
                        }
                    }
                    else if (row) {
                        if (row_count_1 > row_start_1) {
                            emit({ row: row });
                        }
                        row_count_1++;
                    }
                }, function (err) {
                    if (err) {
                        emit({ err: err });
                    }
                    else {
                        running--;
                        finish();
                    }
                });
            }
            else {
                entry.autodrain();
            }
        })
            .on('close', function () {
            running--;
            finish();
        });
    };
    XLSXReader.prototype.parseWorkbook = function (emit) {
        var _this = this;
        var workbook = new book_1.Workbook();
        var collecting = 1;
        var checkStartParseSheet = function () {
            collecting--;
            if (collecting === 0) {
                _this.parseSheets(workbook, emit);
            }
        };
        fs_1.default.createReadStream(this.filename)
            .pipe(unzip2_1.default.Parse())
            .on('error', function (err) {
            emit({ err: err });
            emit({});
        })
            .on('entry', function (entry) {
            if (entry.path === _this.workfolder + '/sharedStrings.xml') {
                collecting++;
                _this.parseXMLStrings(entry, function (err, strings) {
                    workbook.sharedStrings = strings;
                    checkStartParseSheet();
                });
            }
            else if (entry.path === _this.workfolder + '/styles.xml') {
                collecting++;
                _this.parseXMLStyles(entry, function (err, formatstyles) {
                    workbook.styles = formatstyles;
                    checkStartParseSheet();
                });
            }
            else if (entry.path === _this.workfolder + '/workbook.xml') {
                collecting++;
                _this.parseXMLWorkbookSheets(entry, function (err, sheets) {
                    workbook.sheets = sheets;
                    checkStartParseSheet();
                });
            }
            else if (entry.path === _this.workfolder + '/_rels/workbook.xml.rels') {
                collecting++;
                _this.parseXMLWorkbookRelations(entry, function (err, relations) {
                    workbook.relations = relations;
                    checkStartParseSheet();
                });
            }
            else {
                entry.autodrain();
            }
        })
            .on('close', function () {
            checkStartParseSheet();
        });
    };
    XLSXReader.prototype.read = function (emit) {
        var _this = this;
        this.parseWorkbook(function (part) {
            if (part.err) {
                emit('error', part.err);
            }
            else if (part.cell) {
                emit('cell', part.cell.getFormat(_this.options));
            }
            else if (part.row) {
                emit('row', part.row.getFormat(_this.options));
            }
            else if (part.sheet) {
                emit('sheet', part.sheet.getFormat(_this.options));
            }
            else {
                emit('end');
            }
        });
    };
    return XLSXReader;
}());
exports.XLSXReader = XLSXReader;
//# sourceMappingURL=reader.js.map