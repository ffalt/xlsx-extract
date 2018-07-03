var Sheet = (function () {
    function Sheet() {
    }
    Sheet.prototype.getFormat = function (options) {
        switch (options.format) {
            case 'json':
                return this.toJson();
            case 'array':
                return this.toArray();
            case 'obj':
                return this;
            default:
                return this.toTSV(options);
        }
    };
    Sheet.prototype.toTSV = function (options) {
        return this.toArray().join(options.tsv_delimiter || '\t') + options.tsv_endofline;
    };
    Sheet.prototype.toJson = function () {
        return JSON.stringify({
            name: this.name,
            nr: this.nr,
            rid: this.rid,
            id: this.id
        });
    };
    Sheet.prototype.toArray = function () {
        return [this.name, this.rid, this.nr, this.id];
    };
    return Sheet;
}());
export { Sheet };
//# sourceMappingURL=sheet.js.map