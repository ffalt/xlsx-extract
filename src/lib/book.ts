import {Sheet} from './sheet';
import {ICellFormatStyles} from './cell';

export class Workbook {
	sheets: Array<Sheet> = [];
	sharedStrings: Array<string> = [];
	styles: ICellFormatStyles = {};
	relations: Array<{ sheetid: string, filename: string }> = [];

	getById(id: string): Sheet | undefined {
		return this.sheets.find(sheet => sheet.rid === 'rId' + id);
	}

	getByNr(nr: string): Sheet | undefined {
		return this.sheets.find((sheet) => {
			return !!sheet.id && parseInt(sheet.id, 10) === parseInt(nr, 10);
		});
	}

	getByName(name: string): Sheet | undefined {
		return this.sheets.find(sheet => sheet.name === name);
	}

	validate(rid: string): Sheet {
		let sheet = this.sheets.find(sheet => sheet.rid === rid);
		if (!sheet) {
			sheet = new Sheet();
			sheet.rid = rid;
			this.sheets.push(sheet);
		}
		return sheet;
	}
}
