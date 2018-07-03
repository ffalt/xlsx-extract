"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var Cell = (function () {
    function Cell() {
    }
    Cell.prototype.getFormat = function (options) {
        switch (options.format) {
            case 'json':
                return this.toJson();
            case 'array':
                return this.val;
            case 'obj':
                return this;
            default:
                return this.toTSV(options);
        }
    };
    Cell.prototype.toTSV = function (options) {
        var val;
        if (this.val === null || this.val === undefined || this.raw === undefined) {
            val = '';
        }
        else if (utils_1.isValidDate(this.val)) {
            val = this.val.toISOString();
        }
        else {
            val = this.val.toString();
        }
        if (options.tsv_float_comma && (typeof this.val === 'number')) {
            val = val.replace('.', ',');
        }
        return utils_1.escapeTSV(val, options);
    };
    Cell.prototype.toJson = function () {
        return JSON.stringify(this.val);
    };
    Cell.prototype.getEffectiveNumFormat = function () {
        if ((!this.fmt) || (this.fmt.fmts.length === 0)) {
            return null;
        }
        if (this.fmt.fmts.length === 1) {
            return this.fmt.fmts[0];
        }
        if (isNaN(this.val)) {
            return this.fmt.fmts[3];
        }
        if (this.val < 0) {
            return this.fmt.fmts[1];
        }
        if (this.val > 0) {
            return this.fmt.fmts[0];
        }
        return this.fmt.fmts[(this.fmt.fmts.length > 2) ? 2 : 0];
    };
    Cell.prototype.applyNumFormat = function (options) {
        var format = this.getEffectiveNumFormat();
        if (format && options.convert_values) {
            switch (format.fmt_type) {
                case 'd':
                    if (options.convert_values.dates) {
                        this.val = utils_1.xlsx_date(this.val, !!options.date1904);
                    }
                    break;
                case 'i':
                    if (options.convert_values.ints) {
                        var i = null;
                        if (this.fmt && (this.fmt.fmt === '0\\ %' || this.fmt.fmt === '0%')) {
                            i = Math.round(parseFloat(this.val) * 100);
                        }
                        else {
                            i = parseInt(this.val, 10);
                        }
                        if (!isNaN(i)) {
                            this.val = i;
                        }
                    }
                    break;
                case 'f':
                    if ((format.digits !== undefined) && (format.digits > 0) && options.convert_values.floats) {
                        if (options.round_floats && !isNaN(this.val)) {
                            this.val = this.val.toFixed(format.digits);
                        }
                        var v = parseFloat(this.val);
                        if (!isNaN(v)) {
                            this.val = v;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    };
    Cell.prototype.convertValue = function (options) {
        if (this.val !== null) {
            switch (this.typ) {
                case 'n':
                    var v = parseFloat(this.val);
                    if (!isNaN(v)) {
                        this.val = v;
                    }
                    if ((this.fmt) && (options.convert_values)) {
                        this.applyNumFormat(options);
                    }
                    break;
                case 'str':
                    if (this.raw) {
                        this.val = utils_1.unescapexml(this.raw);
                    }
                    break;
                case 's':
                case 'inlineStr':
                    break;
                case 'b':
                    if (options.convert_values && options.convert_values.bools) {
                        if (['0', 'FALSE', 'false'].indexOf(this.val) >= 0) {
                            this.val = false;
                        }
                        else if (['1', 'TRUE', 'true'].indexOf(this.val) >= 0) {
                            this.val = true;
                        }
                    }
                    break;
                default:
            }
        }
    };
    return Cell;
}());
exports.Cell = Cell;
//# sourceMappingURL=cell.js.map