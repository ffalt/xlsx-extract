import { Cell } from './cell';
import { IXLSXExtractOptions } from './types';
import os from 'node:os';

export class Row {
	cells: Cell[] = [];

	getFormat(options: IXLSXExtractOptions) {
		switch (options.format) {
			case 'json': {
				return this.toJson();
			}
			case 'array': {
				return this.toArray();
			}
			case 'obj': {
				return this;
			}
			// case 'tsv':
			default: {
				return this.toTSV(options);
			}
		}
	}

	toTSV(options: IXLSXExtractOptions): string {
		return this.cells.map(cell => cell.toTSV(options)).join(options.tsv_delimiter ?? '\t') + (options.tsv_endofline ?? os.EOL);
	}

	toJson(): string {
		return JSON.stringify(this.toArray());
	}

	toArray(): (string | number | Date | undefined)[] {
		return this.cells.map(cell => cell.val);
	}

	push(cell: Cell) {
		this.cells.push(cell);
	}

	count(): number {
		return this.cells.length;
	}

	isEmpty(): boolean {
		return (this.cells.length === 0) || (this.cells.filter(cell => (cell.val !== undefined)).length === 0);
	}
}
