var Row = (function () {
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
            default:
                return this.toTSV(options);
        }
    };
    Row.prototype.toTSV = function (options) {
        return this.cells.map(function (cell) { return cell.toTSV(options); }).join(options.tsv_delimiter || '\t') + options.tsv_endofline;
    };
    Row.prototype.toJson = function () {
        return JSON.stringify(this.toArray());
    };
    Row.prototype.toArray = function () {
        return this.cells.map(function (cell) { return cell.val; });
    };
    Row.prototype.push = function (cell) {
        this.cells.push(cell);
    };
    Row.prototype.count = function () {
        return this.cells.length;
    };
    Row.prototype.isEmpty = function () {
        return (this.cells.length === 0) || (this.cells.filter(function (cell) {
            return (cell.val !== null);
        }).length === 0);
    };
    return Row;
}());
export { Row };
//# sourceMappingURL=row.js.map