var fs = require('fs'),
	expat = require('node-expat'),
	path = require('path'),
	unzip = require('unzip'),
	util = require('util'),
	events = require('events');

/*

 */

var consts = {
	/*
	 xlsx build in nr formats
	 */
	fmts: {
		0: null,//General
		1: '0',
		2: '0.00',
		3: '#,##0',
		4: '#,##0.00',

		9: '0%',
		10: '0.00%',
		11: '0.00E+00',
		12: '# ?/?',
		13: '# ??/??',
		14: 'mm-dd-yy',
		15: 'd-mmm-yy',
		16: 'd-mmm',
		17: 'mmm-yy',
		18: 'h:mm AM/PM',
		19: 'h:mm:ss AM/PM',
		20: 'h:mm',
		21: 'h:mm:ss',
		22: 'm/d/yy h:mm',

		37: '#,##0 ;(#,##0)',
		38: '#,##0 ;[Red](#,##0)',
		39: '#,##0.00;(#,##0.00)',
		40: '#,##0.00;[Red](#,##0.00)',

		45: 'mm:ss',
		46: '[h]:mm:ss',
		47: 'mmss.0',
		48: '##0.0E+0',
		49: '@'
	},
	/*
	 xlsx build in nr formats types
	 */
	fmts_types: {
		1: 'i',
		2: 'f',
		3: 'i',
		4: 'f',
		9: 'i',
		10: 'f',
		11: 'f',
		14: 'd',
		15: 'd',
		16: 'd',
		17: 'd',
		18: 'd',
		19: 'd',
		20: 'd',
		21: 'd',
		22: 'd',
		37: 'i',
		38: 'i',
		39: 'f',
		40: 'f',
		45: 'd',
		46: 'd',
		47: 'd',
		48: 'f'
	},
	alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
};

var _utils = {
	/*
	 converts a raw xlsx-date to js date
	 */
	xlsx_date: function (v, date1904) {
		var date = Math.floor(v),
			time = Math.round(86400 * (v - date)),
			d;
		if (date1904) date += 1462;
		// Open XML stores dates as the number of days from 1 Jan 1900. Well, skipping the incorrect 29 Feb 1900 as a valid day.
		if (date === 60) {
			d = new Date(1900, 1, 29);
		} else {
			if (date > 60) --date;
			/* 1 = Jan 1 1900 */
			d = new Date(1900, 0, 1, 0, 0, 0);
			d.setDate(d.getDate() + date - 1);
		}
		var S = time % 60;
		time = Math.floor(time / 60);
		var M = time % 60;
		time = Math.floor(time / 60);
		var H = time;
		return new Date(d.getFullYear(), d.getMonth() + 1, d.getDay(), H, M, S);
	},

	/*
	 converts a column index to chars e.g. 1 -> A
	 */
	numAlpha: function (i) {
		var t = Math.floor(i / 26) - 1;
		return (t > -1 ? this.numAlpha(t) : '') + consts.alphabet.charAt(i % 26);
	},

	/*
	 converts a chars to column index e.g. A -> 1
	 */
	alphaNum: function (name) {
		var result = 0;
		var multiplier = 1;
		for (var i = name.length - 1; i >= 0; i--) {
			var value = ((name[i].charCodeAt(0) - "A".charCodeAt(0)) + 1);
			result = result + value * multiplier;
			multiplier = multiplier * 26;
		}
		return (result - 1);
	}
};

String.prototype.reverse = function () {
	return this.split("").reverse().join("");
};

/*

 */

function XLSXReader(filename, options) {
	this.filename = filename;
	this.options = {
		sheetnr: '1',
		ignore_header: 0,
		date1904: false,
		raw_values: false,
		include_trailing_empty_rows: false,
		include_empty_rows: false,
		tsv_float_comma: false
	};
	util._extend(this.options, options);
}

XLSXReader.prototype.parseXMLSheet = function (entry, formatstyles, strings, cb) {
	var caller = this;
	/*
	 A1 -> 0
	 A2 -> 0
	 B2 -> 1
	 */
	var getColumnFromDef = function (coldef) {
		var cc = '';
		for (var i = 0; i < coldef.length; i++) {
			if (isNaN(coldef[i])) {
				cc += coldef[i];
			} else
				break;
		}
		return _utils.alphaNum(cc);
	};
	/*
	 if it's a string from the string table, take it
	 */
	var resolveValue = function (cell) {
		cell.t = (cell.t ? cell.t : "n");
		if (cell.t === 's') {
			cell.v = strings[parseInt(cell.v)];
		}
	};
	/*
	 parses a format string depending on the value
	 */
	var getEffectiveNumFormat = function (format, cell) {
		if (format.fmt) {
			var f = format.fmt.reverse().split(/;(?!\\)/).reverse().map(function (x) {
				return String(x).reverse();
			});
			if ((f) || (f.length > 1)) {
				if (typeof cell.v !== "number")
					f = f[3];
				else
					f = cell.v > 0 ? f[0] : cell.v < 0 ? f[1] : f[2];
				if (f)
					return f;
			}
		}
		return format.fmt;
	};
	/*
	 checks if the number format is for dates
	 */
	var isDateNumFormat = function (nr, fmt) {
		if (consts.fmts_types[nr] == 'd')
			return true;
		if ((fmt) && (nr > 50)) {
			if (fmt.length == 0)
				return false;
			for (var i = 0; i < fmt.length; i++) {
				if ('tTmMdyhHseAP/$-+\\()\':!^&~{}<>= '.indexOf(fmt[i]) < 0) {
					return false;
				}
			}
			return true;
		}
		return false;
	};
	/*
	 checks if the number format is for floats
	 */
	var isFloatNumFormat = function (nr, fmt) {
		if (consts.fmts_types[nr] == 'f')
			return true;
		if ((fmt) && (nr > 50)) {
			if ((fmt.length == 0) || (fmt.indexOf('.') < 0))
				return false;
			for (var i = 0; i < fmt.length; i++) {
				if ('#0.,E+%'.indexOf(fmt[i]) < 0) {
					return false;
				}
			}
			return true;
		}
		return false;
	};
	/*
	 checks if the number format is for ints
	 */
	var isIntNumFormat = function (nr, fmt) {
		if (consts.fmts_types[nr] == 'i')
			return true;
		if ((fmt) && (nr > 50)) {
			if ((fmt.length == 0) || (fmt.indexOf('.') >= 0))
				return false;
			for (var i = 0; i < fmt.length; i++) {
				if ('#,0%'.indexOf(fmt[i]) < 0) {
					return false;
				}
			}
			return true;
		}
		return false;
	};
	/*
	 rounds a float according to the number format
	 */
	var formatFloat = function (fmt, cell) {
		var format = fmt.split('.')[1];
		if (format && (format.length > 0)) {
			var f = 0;
			while ((f < format.length) && (format[f] == '0')) f++;

			if (f > 0) {
				var v = parseFloat(cell.v.toFixed(f));
				if (!isNaN(v))
					cell.v = v;
			}
		}
	};
	/*
	 converts cell value according to the cell type & number format
	 */
	var convertValue = function (cell) {
		if (cell.v)
			switch (cell.t) {
				case 'n':
					cell.v = parseFloat(cell.v);
					if (cell.s) {
						var fmt = formatstyles[cell.s];
						var usefmt = getEffectiveNumFormat(fmt, cell);
						if (isDateNumFormat(fmt.nr, usefmt)) {
							cell.v = _utils.xlsx_date(cell.v, caller.options.date1904);
						} else if (isFloatNumFormat(fmt.nr, usefmt)) {
							formatFloat(usefmt, cell);
						} else if (isIntNumFormat(fmt.nr, usefmt)) {
							var v = parseInt(cell);
							if (!isNaN(v))
								cell.v = v;
						}
					}
					break;
				case 's':
					break; // string, do nothing
				case 'str':
				case 'inlineStr':
					cell.v = utf8read(cell.v);
					break; // string inlines
				case 'b':
					if (['0', 'FALSE', "false"].indexOf(cell.v) >= 0)
						cell.v = false;
					else if (['1', 'TRUE', "true"].indexOf(cell.v) >= 0)
						cell.v = true;
					else
						console.log("Unknown boolean:", cell.v);
					break;
				default:
					console.log("Unknown cell type:", cell.t);
			}
	};
	var parser = expat.createParser();
	var addvalue = false;
	var row;
	var rownum = 1;
	var cell = {v: null, t: null, c: -1, s: null};
	parser.on('startElement', function (name, attrs) {
		if (name == 'row') {
			if (caller.options.include_empty_rows) {
				var rownr = parseInt(attrs.r, 10);
				//TODO: if rows are not sorted, we are screwed - track and warn user if so
				//reading them first and sort is not wanted, since rows are streamed
				while (rownum < rownr) {
					rownum++;
					cb(null, []);
				}
				rownum = rownr + 1;
			}
			row = [];
		} else if (name == 'c') {
			cell.v = null;
			cell.t = attrs.t;
			cell.s = attrs.s;
			cell.c = getColumnFromDef(attrs.r);
			while (row.length <= cell.c) {
				row.push('');
			}
		} else if (name == 'v') {
			addvalue = true;
//		} else {
//			console.log(rownum, 'unknown',name);
		}
	});
	parser.on('endElement', function (name) {
		if (name == 'row') {
			if (row)
				cb(null, row);
			row = [];
		} else if (name == 'v') {
			addvalue = false;
		} else if (name == 'c') {
			addvalue = false;
			resolveValue(cell);
			if (!caller.options.raw_values) {
				convertValue(cell);
			}
			if (cell.c >= 0) {
				cb(null, null, cell);
				row[cell.c] = cell.v;
			}
			cell.c = -1;
		}
	});
	parser.on('text', function (text) {
		if (addvalue) {
			cell.v = (cell.v ? cell.v : '') + text;
		}
	});
	parser.on('error', function (err) {
		cb(err);
	});
	entry.pipe(parser);
};

XLSXReader.prototype.parseXMLStyles = function (entry, formatstyles) {
	var parser = expat.createParser();
	var numFmts = {};
	var cellXfs = [];
	var cellXfs_collect = false;
	parser.on('startElement', function (name, attrs) {
		if (name == 'numFmt') {
			numFmts[attrs.numFmtId] = attrs.formatCode;
		} else if (name == 'cellXfs') {
			cellXfs_collect = true;
		} else if ((cellXfs_collect) && (name == 'xf')) {
			cellXfs.push(parseInt(attrs.numFmtId, 10));
			var stylenr = (cellXfs.length - 1).toString();
			formatstyles[stylenr] = {fmt: numFmts[cellXfs[stylenr]] || consts.fmts[cellXfs[stylenr]], nr: cellXfs[stylenr]};
		}
	});
	parser.on('endElement', function (name) {
		if (name == 'cellXfs') {
			cellXfs_collect = false;
		}
	});
	parser.on('text', function (text) {
	});
	parser.on('error', function (err) {
		console.error(err);
	});
	entry.pipe(parser);
};

XLSXReader.prototype.parseXMLStrings = function (entry, strings) {
	var parser = expat.createParser();
	var strings_collect = false;
	var s = "";
	parser.on('startElement', function (name, attrs) {
		if (name == 't') {
			strings_collect = true;
			s = "";
		}
	});
	parser.on('endElement', function (name) {
		if (name == 't') {
			strings.push(s);
			strings_collect = false;
		}
	});
	parser.on('text', function (text) {
		if (strings_collect) {
			s = s + text;
		}
	});
	parser.on('error', function (err) {
		console.error(err);
	});
	entry.pipe(parser);
};

XLSXReader.prototype.parseXML = function (cb) {

	var rowHasValues = function (row) {
		for (var i = 0; i < row.length; i++) {
			if (row[i] !== null)
				return true;
		}
		return false;
	};

	var strings = [];
	var formatstyles = {};
	var postponed;
	var caller = this;

	fs.createReadStream(this.filename)
		.pipe(unzip.Parse())
		.on('entry',function (entry) {
			if (entry.path == "xl/sharedStrings.xml") {
				caller.parseXMLStrings(entry, strings);
			} else if (entry.path == "xl/styles.xml") {
				caller.parseXMLStyles(entry, formatstyles);
			} else if (entry.path == "xl/worksheets/sheet" + caller.options.sheetnr + ".xml") {
				postponed = entry;
			} else {
				entry.autodrain();
			}
			if (strings && formatstyles && postponed) {
				var empty_rows_check = [];
				var count = 1;
				caller.parseXMLSheet(postponed, formatstyles, strings, function (err, row, cell) {
					if (err) {
						cb(err);
					} else if (cell) {
						cb(null, null, cell);
					} else if (row) {
						if (count > caller.options.ignore_header) {
							empty_rows_check.push(row);
							if ((caller.options.include_trailing_empty_rows) || rowHasValues(row)) {
								empty_rows_check.forEach(function (crow) {
									cb(null, crow);
								});
								empty_rows_check = [];
							}
						}
						count++;
					}
				});
			}
		}).on('close', function () {
			cb();
		});
};

XLSXReader.prototype.read = function (cb) {
	var caller = this;
	var tsvify = function (row) {
		return row.map(function (v) {
			if (v == null)
				return '';
			if (util.isDate(v))
				return v.toISOString();
			if (caller.options.tsv_float_comma && (typeof v == 'number'))
				return v.toString().replace('.', ',');
			return v;
		}).join('\t') + '\n';
	};

	this.parseXML(function (err, row, cell) {
		if (err) {
			cb(err);
		} else if (cell) {
			cb(null, null, cell);
		} else if (row) {
			if (caller.options.format == 'json') {
				row = JSON.stringify(row);
			} else if (caller.options.format == 'tsv') {
				row = tsvify(row);
			}
			cb(null, row);
		} else {
			cb();
		}
	});
};

/*

 */

function XLSX() {
	events.EventEmitter.call(this);
}
util.inherits(XLSX, events.EventEmitter);
XLSX.utils = _utils;

XLSX.prototype.extract = function (filename, options) {
	var caller = this;
	var reader = new XLSXReader(filename, options);
	reader.read(function (err, row, cell) {
		if (err) {
			caller.emit('error', err);
		} else if (row) {
			caller.emit('row', row);
		} else if (cell) {
			caller.emit('cell', cell);
		} else {
			caller.emit('end');
		}
	});
	return this;
};

XLSX.prototype.convert = function (filename, destfile, options) {
	options = options || {};

	if (!options.format) {
		if ((path.extname(destfile).toLowerCase() == '.json'))
			options.format = 'json'
		else
			options.format = 'tsv';
	}
	if (options.format !== 'json')
		options.format = 'tsv';

	var caller = this;
	var start = true;
	var isJSON = options.format !== 'tsv';
	try {
		var writable = fs.createWriteStream(destfile);
		if (isJSON)
			writable.write('[');
	} catch (e) {
		caller.emit('error', e);
		caller.emit('end');
		return;
	}
	writable.on('close', function () {
		caller.emit('end');
	});
	var reader = new XLSXReader(filename, options);
	reader.read(function (err, row, cell) {
		if (err) {
			caller.emit('error', err);
		} else if (row) {
			if (isJSON) {
				if (start) {
					start = false;
					writable.write('\n');
				} else
					writable.write(',\n');
			}
			caller.emit('row', row);
			writable.write(row);
		} else if (cell) {
			caller.emit('cell', cell);
		} else {
			if (isJSON)
				writable.write('\n]');
			writable.end();
		}
	});
	return this;
};


/*

 */

exports.XLSX = XLSX;
