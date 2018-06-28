import {IXLSXExtractOptions} from '../types';

export class Sheet {
	id?: string;
	rid?: string;
	name?: string;

	getFormat(options: IXLSXExtractOptions): any {
		switch (options.format) {
			case 'json':
				return this.toJson();
			case 'array':
				return this.toArray();
			case 'obj':
				return this;
			//case 'tsv':
			default:
				return this.toTSV(options);
		}
	}

	toTSV(options: IXLSXExtractOptions): string {
		return this.toArray().join(options.tsv_delimiter || '\t') + options.tsv_endofline;
	}

	toJson(): string {
		return JSON.stringify({
			name: this.name,
			nr: this.id
		});
	}

	toArray(): Array<string | undefined> {
		return [this.name, this.rid, this.id];
	}
}
