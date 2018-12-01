var Workbook = (function () {
    function Workbook() {
        this.sheets = [];
        this.sharedStrings = [];
        this.styles = {};
        this.relations = [];
    }
    Workbook.prototype.getByRId = function (id) {
        return this.sheets.find(function (sheet) { return sheet.rid === id; });
    };
    Workbook.prototype.getById = function (id) {
        return this.sheets.find(function (sheet) { return sheet.id === id; });
    };
    Workbook.prototype.getByNr = function (nr) {
        return this.sheets.find(function (sheet) {
            return !!sheet.nr && sheet.nr.toString() === nr.toString();
        });
    };
    Workbook.prototype.getByName = function (name) {
        return this.sheets.find(function (sheet) { return sheet.name === name; });
    };
    return Workbook;
}());
export { Workbook };
//# sourceMappingURL=book.js.map