import { escapeTSV, isValidDate, unescapeXML, xlsx_date } from './utils';
import { IXLSXExtractOptions } from './types';

export interface ICellFormat {
	fmt: string;
	fmt_type: string;
	digits?: number;
}

export interface ICellFormatStyle {
	fmt?: string;
	fmtnr?: number;
	fmts: ICellFormat[];
	def?: Record<string, string | undefined>;
}

export type ICellFormatStyles = Record<string, ICellFormatStyle>;

export class Cell {
	val: any;
	col?: number;
	address?: string;
	typ?: string;
	fmt?: ICellFormatStyle;
	formula?: string;
	raw?: string;

	getFormat(options: IXLSXExtractOptions): any {
		switch (options.format) {
			case 'json': {
				return this.toJson();
			}
			case 'array': {
				return this.val;
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

	toTSV(options: IXLSXExtractOptions): string | undefined {
		let value: string;
		if (this.val === null || this.val === undefined || this.raw === undefined) {
			value = '';
		} else if (isValidDate(this.val)) {
			value = (this.val as Date).toISOString();
		} else {
			value = this.val.toString();
		}
		if (options.tsv_float_comma && (typeof this.val === 'number')) {
			value = value.replace('.', ',');
		}
		return escapeTSV(value, options);
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
				case 'd': {
					if (options.convert_values.dates) {
						this.val = xlsx_date(Number(this.val), !!options.date1904, !!options.ignore_timezone);
					}
					break;
				}
				case 'i': {
					if (options.convert_values.ints) {
						const numberValue = this.fmt && (this.fmt.fmt === String.raw`0\ %` || this.fmt.fmt === '0%') ?
							Math.round(parseFloat(this.val as string) * 100) :
							parseInt(this.val as string, 10);
						if (!isNaN(numberValue)) {
							this.val = numberValue;
						}
					}
					break;
				}
				case 'f': {
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
				}
				default: {
					// nop
					break;
				}
			}
		}
	}

	convertValue(options: IXLSXExtractOptions) {
		if (this.val !== null) {
			switch (this.typ) {
				case 'n': {
					const v = parseFloat(this.val);
					if (!isNaN(v)) {
						this.val = v;
					}
					if ((this.fmt) && (options.convert_values)) {
						this.applyNumFormat(options);
					}
					break;
				}
				case 'str': {
					if (this.raw) {
						this.val = unescapeXML(this.raw);
					}
					break;
				}
				case 's':
				case 'inlineStr': {
					break;
				} // string, do nothing
				case 'b': {
					if (options.convert_values?.bools) {
						if (['0', 'FALSE', 'false'].includes(this.val as string)) {
							this.val = false;
						} else if (['1', 'TRUE', 'true'].includes(this.val as string)) {
							this.val = true;
						}
					}
					break;
				}
				// case 'e':
				// debug('Error cell type: Value will be invalid ("#REF!", "#NAME?", "#VALUE!" or similar).');
				// break;
				// default:
				// debug('Unknown cell type: "%s"', this.typ);
			}
		}
	}
}
