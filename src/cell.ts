import {escapeTSV, isValidDate, unescapexml, xlsx_date} from './utils';
import {IXLSXExtractOptions} from './types';

export interface ICellFormat {
	fmt: string;
	fmt_type: string;
	digits?: number;
}

export interface ICellFormatStyle {
	fmt?: string;
	fmtnr?: number;
	fmts: Array<ICellFormat>;
	def?: { [key: string]: string | undefined };
}

export interface ICellFormatStyles {
	[id: string]: ICellFormatStyle;
}

export class Cell {
	val: any;
	col?: number;
	address?: string;
	typ?: string;
	fmt?: ICellFormatStyle;
	formula?: string;
	raw?: string;

	getFormat(options: IXLSXExtractOptions) {
		switch (options.format) {
			case 'json':
				return this.toJson();
			case 'array':
				return this.val;
			case 'obj':
				return this;
			// case 'tsv':
			default:
				return this.toTSV(options);
		}
	}

	toTSV(options: IXLSXExtractOptions): string | undefined {
		let val: string;
		if (this.val === null || this.val === undefined || this.raw === undefined) {
			val = '';
		} else if (isValidDate(this.val)) {
			val = this.val.toISOString();
		} else {
			val = this.val.toString();
		}
		if (options.tsv_float_comma && (typeof this.val === 'number')) {
			val = val.replace('.', ',');
		}
		return escapeTSV(val, options);
	}

	toJson() {
		return JSON.stringify(this.val);
	}

	getEffectiveNumFormat(): ICellFormat | null {
		if ((!this.fmt) || (this.fmt.fmts.length === 0)) {
			return null;
		}
		if (this.fmt.fmts.length === 1) {
			return this.fmt.fmts[0];
		}
		if (isNaN(this.val)) {
			return this.fmt.fmts[3];
		}
		if (this.val < 0) {
			return this.fmt.fmts[1];
		}
		if (this.val > 0) {
			return this.fmt.fmts[0];
		}
		return this.fmt.fmts[(this.fmt.fmts.length > 2) ? 2 : 0];
	}

	applyNumFormat(options: IXLSXExtractOptions) {
		const format = this.getEffectiveNumFormat();
		if (format && options.convert_values) {
			switch (format.fmt_type) {
				case 'd':
					if (options.convert_values.dates) {
						this.val = xlsx_date(this.val, !!options.date1904);
					}
					break;
				case 'i':
					if (options.convert_values.ints) {
						let i = null;
						if (this.fmt && (this.fmt.fmt === '0\\ %' || this.fmt.fmt === '0%')) {
							i = Math.round(parseFloat(this.val) * 100);
						} else {
							i = parseInt(this.val, 10);
						}
						if (!isNaN(i)) {
							this.val = i;
						}
					}
					break;
				case 'f':
					if ((format.digits !== undefined) && (format.digits > 0) && options.convert_values.floats) {
						if (options.round_floats && !isNaN(this.val)) {
							this.val = this.val.toFixed(format.digits);
						}
						const v = parseFloat(this.val);
						if (!isNaN(v)) {
							this.val = v;
						}
					}
					break;
				default:
					// nop
					break;
			}
		}
	}

	convertValue(options: IXLSXExtractOptions) {
		if (this.val !== null) {
			switch (this.typ) {
				case 'n':
					const v = parseFloat(this.val);
					if (!isNaN(v)) {
						this.val = v;
					}
					if ((this.fmt) && (options.convert_values)) {
						this.applyNumFormat(options);
					}
					break;
				case 'str':
					if (this.raw) {
						this.val = unescapexml(this.raw);
					}
					break;
				case 's':
				case 'inlineStr':
					break; // string, do nothing
				case 'b':
					if (options.convert_values && options.convert_values.bools) {
						if (['0', 'FALSE', 'false'].indexOf(this.val) >= 0) {
							this.val = false;
						} else if (['1', 'TRUE', 'true'].indexOf(this.val) >= 0) {
							this.val = true;
						}
					}
					break;
				// case 'e':
				// debug('Error cell type: Value will be invalid ("#REF!", "#NAME?", "#VALUE!" or similar).');
				// break;
				default:
				// debug('Unknown cell type: "%s"', this.typ);
			}
		}
	}
}
