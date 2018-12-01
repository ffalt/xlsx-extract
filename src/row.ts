import {Cell} from './cell';
import {IXLSXExtractOptions} from './types';

export class Row {
	cells: Array<Cell> = [];

	getFormat(options: IXLSXExtractOptions) {
		switch (options.format) {
			case 'json':
				return this.toJson();
			case 'array':
				return this.toArray();
			case 'obj':
				return this;
			// case 'tsv':
			default:
				return this.toTSV(options);
		}
	}

	toTSV(options: IXLSXExtractOptions): string {
		return this.cells.map(cell => cell.toTSV(options)).join(options.tsv_delimiter || '\t') + options.tsv_endofline;
	}

	toJson(): string {
		return JSON.stringify(this.toArray());
	}

	toArray(): Array<string | number | undefined> {
		return this.cells.map(cell => cell.val);
	}

	push(cell: Cell) {
		this.cells.push(cell);
	}

	count(): number {
		return this.cells.length;
	}

	isEmpty(): boolean {
		return (this.cells.length === 0) || (this.cells.filter(function(cell) {
			return (cell.val !== null);
		}).length === 0);
	}
}
