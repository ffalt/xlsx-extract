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
	alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
};


/*

 */

var _utils = {
	/*
	 converts a raw xlsx-date to js date
	 */
	xlsx_date: function (value, date1904) {
		var date = Math.floor(value),
			time = Math.round(86400 * (value - date)),
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
		d.setSeconds(time % 60);
		time = Math.floor(time / 60);
		d.setMinutes(time % 60);
		time = Math.floor(time / 60);
		d.setHours(time);
		return d;
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
	},

	splitFormats: function (s) {
		// http://office.microsoft.com/en-gb/excel-help/create-or-delete-a-custom-number-format-HP005199500.aspx?redir=0
		//    _-* #,##0\ _€_-;\-* #,##0\ _€_-;_-* "-"??\ _€_-;_-@_-
		//    positiv value ; negativ value ; zero; string

		var fmts = s.split(/(?!\\);/);
		var nr = 0;
		var lastff = {t: 'x'};
		var result = [];
		for (var i = 0; i < fmts.length; i++) {
			var ff = this.parseFmtType(fmts[i]);
			ff = (ff.t == 'l' ? lastff : ff);
			lastff = ff;
			var format = {fmt: fmts[i], fmt_type: ff.t};
			if (ff.f)
				format.digits = ff.f;
			result.push(format);
			nr++;
		}
		return result;
	},

	parseFmtType: function (fmt) {
		var containsOnlyChars = function (value, chars) {
			for (var i = 0; i < value.length; i++) {
				if (chars.indexOf(value[i]) < 0) {
					return false;
				}
			}
			return (value.length > 0);
		};
		//messy hack for extracting some infos from the number format (type and float-digits}
		var s = fmt;
		var b = '';
		while (s.length > 0) {
			var c = s[0];
			s = s.slice(1);
			if ((c == '_') || (c == '\\') || (c == '*'))
				s = s.slice(1);
			else if (c == '[')
				s = s.slice(s.indexOf(']') + 1);
			else if (c == '"')
				s = s.slice(s.indexOf('"') + 1);
			else if ((c == '(')
				|| (c == ')')
				) {

			} else
				b += c;
		}
		b = b.replace(/#/g, '0');
		b = b.replace(/%/g, '');
		// deal with thousands separator 12000 -> 12 -> formatCode	"#,"
		var sp = b.split(',');
		b = sp[sp.length - 1];
		if (!isNaN(b)) {
			if (b.indexOf('.') >= 0) {
				var di = sp[sp.length - 1].split('.')[1].trim().length;
				if (b.indexOf('E+') >= 0)
					di += 14;
				return {t: 'f', f: di};
			} else
				return {t: 'i'};
		} else if (b == '@')
			return {t: 's'};
		//"-"??    zero value
		if (b == '??')
			return {t: 'l'}; // last fmt should by used
		sp = b.split(' ');
		if (sp.length > 1) {
			//test # ??/??
			if (containsOnlyChars(sp[sp.length - 1], '?/')) {
				// '# ?/?', '# ??/??',
				var digits = sp[sp.length - 1].split('/')[0].trim().length + 1;
				return {t: 'f', f: digits};
			}
		}
		//date format?
		if (containsOnlyChars(b, 'tmdyhseAPTMH:/-.0 ')) {
			return {t: 'd'};
		}
		console.log('bef:', fmt, 'aft:', b);
		console.log('unknown', b);
		return {t: 'x'};
	}

};

/*

 */

function Cell() {
	this.val = null;
	this.typ = null;
	this.col = -1;
	this.fmt = null;
	this.raw = null;
}
Cell.prototype.getFormat = function (options) {
	switch (options.format) {
		case 'json':
			return this.toJson();
		case 'array':
			return this.val;
		case 'obj':
			return this;
		case 'tsv':
		default:
			return this.toTSV(options.tsv_float_comma);
	}
};
Cell.prototype.toTSV = function (tsv_float_comma) {
	if (this.val == null)
		return '';
	if (util.isDate(this.val))
		return this.val.toISOString();
	if (tsv_float_comma && (typeof this.val == 'number'))
		return this.val.toString().replace('.', ',');
	return this.val.toString();
};
Cell.prototype.toJson = function () {
	return JSON.stringify(this.val);
};
Cell.prototype.getEffectiveNumFormat = function () {
	if ((!this.fmt) || (this.fmt.fmts.length == 0))
		return null;
	if (this.fmt.fmts.length == 1)
		return this.fmt.fmts[0];
	if (isNaN(this.val))
		return this.fmt.fmts[3];
	if (this.val < 0)
		return this.fmt.fmts[1];
	if (this.val > 0)
		return this.fmt.fmts[0];
	return this.fmt.fmts[(this.fmt.fmts.length > 2) ? 2 : 0];

};
Cell.prototype.applyNumFormat = function (options) {
	var usefmt = this.getEffectiveNumFormat();
	if (usefmt) {
		switch (usefmt.fmt_type) {
			case 'd':
				if (options.convert_values.dates)
					this.val = _utils.xlsx_date(this.val, options.date1904);
				break;
			case 'i':
				if (options.convert_values.ints) {
					var i = parseInt(this.val);
					if (!isNaN(i))
						this.val = i;
				}
				break;
			case 'f':
				if ((usefmt.digits > 0) && options.convert_values.floats) {
					var v = parseFloat(this.val.toFixed(usefmt.digits));
					if (!isNaN(v))
						this.val = v;
				}
				break;
			default:
				//nop
				break;
		}
	}
};
Cell.prototype.convertValue = function (options) {
	if (this.val != null)
		switch (this.typ) {
			case 'n':
				var v = parseFloat(this.val);
				if (!isNaN(v))
					this.val = v;
				if ((this.fmt) && (options.convert_values))
					this.applyNumFormat(options);
				break;
			case 's':
			case 'str':
			case 'inlineStr':
				break; // string, do nothing
			case 'b':
				if (this.options.convert_values && this.options.convert_values.bools) {
					if (['0', 'FALSE', "false"].indexOf(this.val) >= 0)
						this.val = false;
					else if (['1', 'TRUE', "true"].indexOf(this.val) >= 0)
						this.val = true;
					else
						console.log("Unknown boolean:", this.val);
				}
				break;
			default:
				console.log("Unknown cell type:", this.typ);
		}
};

/*

 */

function Row() {
	this.cells = [];
}
Row.prototype.getFormat = function (options) {
	switch (options.format) {
		case 'json':
			return this.toJson();
		case 'array':
			return this.toArray();
		case 'obj':
			return this;
		case 'tsv':
		default:
			return this.toTSV(options.tsv_float_comma);
	}
};
Row.prototype.toTSV = function (tsv_float_comma) {
	return this.cells.map(function (cell) {
		return cell.toTSV(tsv_float_comma);
	}).join('\t') + '\n';
};
Row.prototype.toJson = function () {
	return JSON.stringify(this.toArray());
};
Row.prototype.toArray = function () {
	return this.cells.map(function (cell) {
		return cell.val;
	});
};
Row.prototype.push = function (cell) {
	this.cells.push(cell);
};
Row.prototype.count = function () {
	return this.cells.length;
};
Row.prototype.isEmpty = function () {
	return (this.cells.length == 0) ||
		(this.cells.filter(function (cell) {
			return (cell.val != null);
		}).length == 0);
};

/*

 */

function XLSXReader(filename, options) {
	this.filename = filename;
	this.options = {
		sheet_nr: '1',
		ignore_header: 0,
		date1904: false,
		include_empty_rows: false,
		tsv_float_comma: false,
		format: 'array',
		raw_values: false,
		convert_values: {
			ints: true,
			floats: true,
			dates: true,
			bools: true
		}
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
	 converts cell value according to the cell type & number format
	 */
	var parser = expat.createParser();
	var addvalue = false;
	var row;
	var rownum = 1;
	var cell;
	parser.on('startElement', function (name, attrs) {
		if (name == 'row') {
			if (caller.options.include_empty_rows) {
				var rownr = parseInt(attrs.r, 10);
				//TODO: if rows are not sorted, we are screwed - track and warn user if so
				//reading them first and sort is not wanted, since rows are streamed
				while (rownum < rownr) {
					rownum++;
					cb(null, new Row());
				}
				rownum = rownr + 1;
			}
			row = new Row();
		} else if (name == 'c') {
			cell = new Cell();
			cell.typ = (attrs.t ? attrs.t : "n");
			cell.fmt = attrs.s ? formatstyles[attrs.s] : null;
			cell.col = getColumnFromDef(attrs.r);
			//TODO: if cols are not sorted, we are screwed - track and warn user if so
			while (row.count() < cell.col) {
				var empty = new Cell();
				empty.col = row.count();
				row.push(empty);
				cb(null, null, cell);
			}
			row.push(cell);
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
		} else if (name == 'v') {
			addvalue = false;
		} else if (name == 'c') {
			addvalue = false;
			if (cell.col >= 0) {
				if (cell.typ === 's') {
					cell.val = strings[parseInt(cell.val)];
				}
				cell.raw = cell.val;
				if (!caller.options.raw_values) {
					cell.convertValue(caller.options);
				}
				cb(null, null, cell);
			}
		}
	});
	parser.on('text', function (text) {
		if (addvalue) {
			cell.val = (cell.val ? cell.val : '') + text;
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
			var fmtnr = parseInt(attrs.numFmtId);
			cellXfs.push(fmtnr);
			var stylenr = (cellXfs.length - 1).toString();
			var fmt = numFmts[fmtnr] || consts.fmts[fmtnr];
			formatstyles[stylenr] = {
				fmt: fmt,
				fmtnr: fmtnr,
				fmts: (fmt ? _utils.splitFormats(fmt) : [])
			};
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
	var strings = [];
	var formatstyles = {};
	var caller = this;

	function parseSheet() {
		fs.createReadStream(caller.filename)
			.pipe(unzip.Parse())
			.on('entry',function (entry) {
				if (entry.path == "xl/worksheets/sheet" + caller.options.sheet_nr + ".xml") {
//					console.log('getting XLSX sheet');
					var count = 1;
					caller.parseXMLSheet(entry, formatstyles, strings, function (err, row, cell) {
						if (err) {
							cb(err);
						} else if (cell) {
							if (count > caller.options.ignore_header) {
								cb(null, null, cell);
							}
						} else if (row) {
							if (count > caller.options.ignore_header) {
								cb(null, row);
							}
							count++;
						}
					});
				} else {
					entry.autodrain();
				}
			}).on('close', function () {
				cb();
			});
	}

	//first get styles & strings
	fs.createReadStream(this.filename)
		.pipe(unzip.Parse())
		.on('entry',function (entry) {
			if (entry.path == "xl/sharedStrings.xml") {
//				console.log('getting XLSX strings');
				caller.parseXMLStrings(entry, strings);
			} else if (entry.path == "xl/styles.xml") {
//				console.log('getting XLSX styles');
				caller.parseXMLStyles(entry, formatstyles);
			} else {
				entry.autodrain();
			}
		}).on('close', function () {
			//now get sheet
			parseSheet();
		});
};
XLSXReader.prototype.read = function (cb) {
	var caller = this;
	this.parseXML(function (err, row, cell) {
		if (err) {
			cb('error', err);
		} else if (cell) {
			cb('cell', cell.getFormat(caller.options));
		} else if (row) {
//			if ((caller.options.include_empty_rows) || (!row.isEmpty()))
				cb('row', row.getFormat(caller.options));
		} else {
			cb('end');
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
XLSX.consts = consts;
XLSX.prototype.extract = function (filename, options) {
	var caller = this;
	var reader = new XLSXReader(filename, options);
	reader.read(function (what, data) {
		caller.emit(what, data);
	});
	return this;
};
XLSX.prototype.convert = function (filename, destfile, options) {
	options = options || {};

	if (!options.format) {
		if ((path.extname(destfile).toLowerCase() == '.json'))
			options.format = 'json'
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
	reader.read(function (what, data) {
		switch (what) {
			case 'error':
				caller.emit('error', data);
				break;
			case 'cell':
				caller.emit('cell', data);
				break;
			case 'row':
				if (isJSON) {
					if (start) {
						start = false;
						writable.write('\n');
					} else
						writable.write(',\n');
				}
				caller.emit('row', data);
				writable.write(data);
				break;
			case 'end':
				if (isJSON)
					writable.write('\n]');
				writable.end();
				break;
		}
	});
	return this;
};

/*

 */

exports.XLSX = XLSX;
