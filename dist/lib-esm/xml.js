import sax from 'sax';
var expat;
function lowerFudge(obj) {
    var result = {};
    Object.keys(obj).forEach(function (key) {
        result[key.toLowerCase()] = obj[key];
    });
    return result;
}
var SaxSax = (function () {
    function SaxSax() {
        this.parser = sax.createStream(false, { lowercase: true });
    }
    SaxSax.prototype.onStartElement = function (notify) {
        this.parser.on('opentag', function (node) {
            notify(node.name.toLowerCase(), lowerFudge(node.attributes));
        });
        return this;
    };
    SaxSax.prototype.onEndElement = function (notify) {
        this.parser.on('closetag', function (name) {
            notify(name.toLowerCase());
        });
        return this;
    };
    SaxSax.prototype.onText = function (notify) {
        this.parser.on('text', notify);
        return this;
    };
    SaxSax.prototype.onClose = function (notify) {
        var _this = this;
        var reported = false;
        this.parser.on('error', function (err) {
            if (!reported) {
                reported = true;
                notify(err);
            }
            _this.parser.error = null;
            _this.parser.resume();
        });
        this.parser.on('end', function () {
            if (!reported) {
                notify();
            }
        });
        return this;
    };
    SaxSax.prototype.piper = function () {
        return this.parser;
    };
    return SaxSax;
}());
export { SaxSax };
var SaxExpat = (function () {
    function SaxExpat() {
        if (!expat) {
            try {
                expat = require('node-expat');
            }
            catch (e) {
                throw new Error('To use {parser:"expat"} you need to install it manually with "npm install node-expat"');
            }
        }
        this.parser = expat.createParser();
    }
    SaxExpat.prototype.onStartElement = function (notify) {
        this.parser.on('startElement', function (name, attributes) {
            notify(name.toLowerCase(), lowerFudge(attributes));
        });
        return this;
    };
    SaxExpat.prototype.onEndElement = function (notify) {
        this.parser.on('endElement', function (name) {
            notify(name.toLowerCase());
        });
        return this;
    };
    SaxExpat.prototype.onText = function (notify) {
        this.parser.on('text', notify);
        return this;
    };
    SaxExpat.prototype.onClose = function (notify) {
        var reported = false;
        this.parser.on('error', function (err) {
            reported = true;
            notify(err);
        });
        this.parser.on('close', function () {
            if (!reported) {
                notify();
            }
        });
        return this;
    };
    SaxExpat.prototype.piper = function () {
        return this.parser;
    };
    return SaxExpat;
}());
export { SaxExpat };
//# sourceMappingURL=xml.js.map