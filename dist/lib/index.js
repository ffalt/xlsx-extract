"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var events = __importStar(require("events"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var util = __importStar(require("util"));
var reader_1 = require("./reader");
var XLSX = (function (_super) {
    __extends(XLSX, _super);
    function XLSX() {
        var _this = _super.call(this) || this;
        util.inherits(XLSX, events.EventEmitter);
        events.EventEmitter.call(_this);
        return _this;
    }
    XLSX.prototype.extract = function (filename, options) {
        var _this = this;
        var reader = new reader_1.XLSXReader(filename, options);
        reader.read(function (what, data) {
            _this.emit(what, data);
        });
        return this;
    };
    XLSX.prototype.convert = function (filename, destfile, options) {
        var _this = this;
        options = options || {};
        if ((!options.format) && ((path.extname(destfile).toLowerCase() === '.json'))) {
            options.format = 'json';
        }
        if (options.format !== 'json') {
            options.format = 'tsv';
        }
        var start = true;
        var isJSON = options.format !== 'tsv';
        var writeable;
        try {
            writeable = fs.createWriteStream(destfile);
            if (isJSON) {
                writeable.write('[');
            }
        }
        catch (e) {
            this.emit('error', e);
            this.emit('end');
            return this;
        }
        writeable.on('close', function () {
            _this.emit('end');
        });
        var reader = new reader_1.XLSXReader(filename, options);
        reader.read(function (what, data) {
            switch (what) {
                case 'error':
                    _this.emit('error', data);
                    break;
                case 'cell':
                    _this.emit('cell', data);
                    break;
                case 'row':
                    if (isJSON) {
                        if (start) {
                            start = false;
                            writeable.write(options.tsv_endofline);
                        }
                        else {
                            writeable.write(',' + options.tsv_endofline);
                        }
                    }
                    _this.emit('row', data);
                    writeable.write(data);
                    break;
                case 'end':
                    if (isJSON) {
                        writeable.write(options.tsv_endofline + ']');
                    }
                    writeable.end();
                    break;
            }
        });
        return this;
    };
    return XLSX;
}(events.EventEmitter));
exports.XLSX = XLSX;
//# sourceMappingURL=index.js.map