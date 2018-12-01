"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function xlsx_date(value, date1904) {
    var date = Math.floor(value), time = Math.round(86400 * (value - date)), d;
    if (date1904) {
        date += 1462;
    }
    if (date === 60) {
        d = new Date(1900, 1, 29);
    }
    else {
        if (date > 60) {
            --date;
        }
        d = new Date(1900, 0, 1, 0, 0, 0);
        d.setDate(d.getDate() + date - 1);
    }
    d.setSeconds(time % 60);
    time = Math.floor(time / 60);
    d.setMinutes(time % 60);
    time = Math.floor(time / 60);
    d.setHours(time - d.getTimezoneOffset() / 60);
    return d;
}
exports.xlsx_date = xlsx_date;
exports.xlsx_fmts = {
    0: null,
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
};
var Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function numAlpha(i) {
    var t = Math.floor(i / 26) - 1;
    return (t > -1 ? numAlpha(t) : '') + Alphabet.charAt(i % 26);
}
exports.numAlpha = numAlpha;
function alphaNum(name) {
    var result = 0;
    var multiplier = 1;
    for (var i = name.length - 1; i >= 0; i--) {
        var value = ((name[i].charCodeAt(0) - 'A'.charCodeAt(0)) + 1);
        result = result + value * multiplier;
        multiplier = multiplier * 26;
    }
    return (result - 1);
}
exports.alphaNum = alphaNum;
function containsOnlyChars(value, chars) {
    for (var i = 0; i < value.length; i++) {
        if (chars.indexOf(value[i]) < 0) {
            return false;
        }
    }
    return (value.length > 0);
}
exports.containsOnlyChars = containsOnlyChars;
function splitCellFormats(s) {
    var fmts = s.split(/(?!\\);/);
    var nr = 0;
    var last = { t: 'x' };
    var result = [];
    for (var i = 0; i < fmts.length; i++) {
        var ff = parseFmtType(fmts[i]);
        ff = (ff.t === 'l' ? last : ff);
        last = ff;
        result.push({ fmt: fmts[i], fmt_type: ff.t, digits: ff.f });
        nr++;
    }
    return result;
}
exports.splitCellFormats = splitCellFormats;
function parseFmtType(fmt) {
    var s = fmt;
    var b = '';
    while (s.length > 0) {
        var c = s[0];
        s = s.slice(1);
        if ((c === '_') || (c === '\\') || (c === '*')) {
            s = s.slice(1);
        }
        else if (c === '[') {
            s = s.slice(s.indexOf(']') + 1);
        }
        else if (c === '"') {
            s = s.slice(s.indexOf('"') + 1);
        }
        else if ((c === '(') || (c === ')')) {
        }
        else {
            b += c;
        }
    }
    b = b.replace(/#/g, '0').replace(/%/g, '');
    var sp = b.split(',');
    b = sp[sp.length - 1];
    if (b === '' || (b.trim().indexOf(' ') < 0) && !isNaN(parseInt(b, 10))) {
        if (b.indexOf('.') >= 0) {
            var di = sp[sp.length - 1].split('.')[1].trim().length;
            if (b.indexOf('E+') >= 0) {
                di += 14;
            }
            return { t: 'f', f: di };
        }
        else {
            return { t: 'i' };
        }
    }
    else if (b === '@') {
        return { t: 's' };
    }
    if (b === '??') {
        return { t: 'l' };
    }
    sp = b.split(' ');
    if ((sp.length > 1) && (containsOnlyChars(sp[sp.length - 1], '?/'))) {
        var digits = sp[sp.length - 1].split('/')[0].trim().length + 1;
        return { t: 'f', f: digits };
    }
    if (containsOnlyChars(b, 'tmdyhseAPTMH:/-.0 ')) {
        return { t: 'd' };
    }
    return { t: 'x' };
}
function getColumnFromDef(colDef) {
    var cc = '';
    for (var i = 0; i < colDef.length; i++) {
        if (isNaN(parseInt(colDef[i], 10))) {
            cc += colDef[i];
        }
        else {
            break;
        }
    }
    return alphaNum(cc);
}
exports.getColumnFromDef = getColumnFromDef;
function isValidDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
}
exports.isValidDate = isValidDate;
function escapeTSV(val, options) {
    var delimiter = options.tsv_delimiter || '\t';
    if (val && val.indexOf('"') > -1 || val.indexOf('\n') > -1 || val.indexOf('\r') > -1 || val.indexOf(delimiter) > -1) {
        val = '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
}
exports.escapeTSV = escapeTSV;
function unescapexml(text) {
    var encregex = /&(?:quot|apos|gt|lt|amp|#x?([\da-fA-F]+));/g;
    var coderegex = /_x([\da-fA-F]{4})_/g;
    var encodings = {
        '&quot;': '"',
        '&apos;': '\'',
        '&gt;': '>',
        '&lt;': '<',
        '&amp;': '&'
    };
    var s = text + '';
    var i = s.indexOf('<![CDATA[');
    if (i === -1) {
        return s.replace(encregex, function ($$, $1) {
            return encodings[$$] || String.fromCharCode(parseInt($1, $$.indexOf('x') > -1 ? 16 : 10)) || $$;
        }).replace(coderegex, function (m, c) {
            return String.fromCharCode(parseInt(c, 16));
        });
    }
    var j = s.indexOf(']]>');
    return unescapexml(s.slice(0, i)) + s.slice(i + 9, j) + unescapexml(s.slice(j + 3));
}
exports.unescapexml = unescapexml;
//# sourceMappingURL=utils.js.map