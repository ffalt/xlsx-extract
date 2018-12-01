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
import * as events from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { XLSXReader } from './reader';
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
        var reader = new XLSXReader(filename, options);
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
        var reader = new XLSXReader(filename, options);
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
export { XLSX };
//# sourceMappingURL=index.js.map