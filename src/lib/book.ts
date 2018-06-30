import {Sheet} from './sheet';
import {ICellFormatStyles} from './cell';

export class Workbook {
	sheets: Array<Sheet> = [];
	sharedStrings: Array<string> = [];
	styles: ICellFormatStyles = {};
	relations: Array<{ sheetid: string, filename: string }> = [];

	getById(id: string): Sheet | undefined {
		return this.sheets.find(sheet => sheet.rid === id);
	}

	getByNr(nr: string): Sheet | undefined {
		return this.sheets.find((sheet) => {
			return !!sheet.nr && sheet.nr.toString() === nr.toString();
		});
	}

	getByName(name: string): Sheet | undefined {
		return this.sheets.find(sheet => sheet.name === name);
	}
}
