import { Cell } from '../src/cell';
import { IXLSXExtractOptions } from '../src/types';

const baseOptions: IXLSXExtractOptions = {
	format: 'tsv',
	tsv_delimiter: '\t',
	tsv_endofline: '\n',
	convert_values: { ints: true, floats: true, dates: true, bools: true },
};

describe('Cell', () => {
	describe('toJson()', () => {
		it('serializes a number', () => {
			const cell = new Cell();
			cell.val = 42;
			expect(cell.toJson()).toBe('42');
		});

		it('serializes undefined', () => {
			const cell = new Cell();
			cell.val = undefined;
			expect(cell.toJson()).toBeUndefined();
		});

		it('serializes a string', () => {
			const cell = new Cell();
			cell.val = 'hello';
			expect(cell.toJson()).toBe('"hello"');
		});
	});

	describe('toTSV()', () => {
		it('returns empty string when val is undefined', () => {
			const cell = new Cell();
			cell.val = undefined;
			cell.raw = '';
			expect(cell.toTSV(baseOptions)).toBe('');
		});

		it('returns empty string when raw is undefined', () => {
			const cell = new Cell();
			cell.val = 'hello';
			// raw intentionally not set
			expect(cell.toTSV(baseOptions)).toBe('');
		});

		it('returns ISO string for Date values', () => {
			const cell = new Cell();
			const d = new Date('2024-01-15T00:00:00.000Z');
			cell.val = d;
			cell.raw = 'x';
			expect(cell.toTSV(baseOptions)).toBe(d.toISOString());
		});

		it('converts a number to string', () => {
			const cell = new Cell();
			cell.val = 3.14;
			cell.raw = 'x';
			expect(cell.toTSV(baseOptions)).toBe('3.14');
		});

		it('replaces decimal point with comma when tsv_float_comma is set', () => {
			const cell = new Cell();
			cell.val = 3.14;
			cell.raw = 'x';
			expect(cell.toTSV({ ...baseOptions, tsv_float_comma: true })).toBe('3,14');
		});

		it('returns a plain string value as-is', () => {
			const cell = new Cell();
			cell.val = 'hello';
			cell.raw = 'hello';
			expect(cell.toTSV(baseOptions)).toBe('hello');
		});
	});

	describe('getFormat()', () => {
		it('returns toJson() for json format', () => {
			const cell = new Cell();
			cell.val = 'test';
			expect(cell.getFormat({ ...baseOptions, format: 'json' })).toBe('"test"');
		});

		it('returns val directly for array format', () => {
			const cell = new Cell();
			cell.val = 99;
			expect(cell.getFormat({ ...baseOptions, format: 'array' })).toBe(99);
		});

		it('returns the cell itself for obj format', () => {
			const cell = new Cell();
			cell.val = 'x';
			expect(cell.getFormat({ ...baseOptions, format: 'obj' })).toBe(cell);
		});

		it('returns toTSV() for tsv format (default)', () => {
			const cell = new Cell();
			cell.val = 'hello';
			cell.raw = 'hello';
			expect(cell.getFormat(baseOptions)).toBe('hello');
		});
	});

	describe('getEffectiveNumFormat()', () => {
		it('returns undefined when fmt is not set', () => {
			expect(new Cell().getEffectiveNumFormat()).toBeUndefined();
		});

		it('returns undefined when fmts is empty', () => {
			const cell = new Cell();
			cell.fmt = { fmts: [] };
			expect(cell.getEffectiveNumFormat()).toBeUndefined();
		});

		it('returns fmts[0] when there is exactly one format', () => {
			const cell = new Cell();
			const fmt = { fmt: '0.00', fmt_type: 'f', digits: 2 };
			cell.fmt = { fmts: [fmt] };
			expect(cell.getEffectiveNumFormat()).toBe(fmt);
		});

		it('returns fmts[0] for a positive value with multiple formats', () => {
			const cell = new Cell();
			const fmts = [
				{ fmt: '0', fmt_type: 'i' },
				{ fmt: '-0', fmt_type: 'i' },
				{ fmt: '"zero"', fmt_type: 'x' },
			];
			cell.fmt = { fmts };
			cell.val = 5;
			expect(cell.getEffectiveNumFormat()).toBe(fmts[0]);
		});

		it('returns fmts[1] for a negative value with multiple formats', () => {
			const cell = new Cell();
			const fmts = [
				{ fmt: '0', fmt_type: 'i' },
				{ fmt: '-0', fmt_type: 'i' },
				{ fmt: '"zero"', fmt_type: 'x' },
			];
			cell.fmt = { fmts };
			cell.val = -3;
			expect(cell.getEffectiveNumFormat()).toBe(fmts[1]);
		});

		it('returns fmts[2] for zero when three formats are present', () => {
			const cell = new Cell();
			const fmts = [
				{ fmt: '0', fmt_type: 'i' },
				{ fmt: '-0', fmt_type: 'i' },
				{ fmt: '"zero"', fmt_type: 'x' },
			];
			cell.fmt = { fmts };
			cell.val = 0;
			expect(cell.getEffectiveNumFormat()).toBe(fmts[2]);
		});

		it('returns fmts[0] for zero when only two formats are present', () => {
			const cell = new Cell();
			const fmts = [
				{ fmt: '0', fmt_type: 'i' },
				{ fmt: '-0', fmt_type: 'i' },
			];
			cell.fmt = { fmts };
			cell.val = 0;
			expect(cell.getEffectiveNumFormat()).toBe(fmts[0]);
		});
	});

	describe('applyNumFormat()', () => {
		it('converts integer format', () => {
			const cell = new Cell();
			cell.val = 42; // val is already a number when called from convertValue
			cell.fmt = { fmts: [{ fmt: '0', fmt_type: 'i' }] };
			cell.applyNumFormat(baseOptions);
			expect(cell.val).toBe(42);
		});

		it('converts percentage with 0% format', () => {
			const cell = new Cell();
			cell.val = 0.8;
			cell.fmt = { fmt: '0%', fmts: [{ fmt: '0%', fmt_type: 'i' }] };
			cell.applyNumFormat(baseOptions);
			expect(cell.val).toBe(80);
		});

		it('converts percentage with "0\\ %" format', () => {
			const cell = new Cell();
			cell.val = 0.5;
			cell.fmt = { fmt: '0\\ %', fmts: [{ fmt: '0\\ %', fmt_type: 'i' }] };
			cell.applyNumFormat(baseOptions);
			expect(cell.val).toBe(50);
		});

		it('converts float format without rounding', () => {
			const cell = new Cell();
			cell.val = 3.14159;
			cell.fmt = { fmts: [{ fmt: '0.00', fmt_type: 'f', digits: 2 }] };
			cell.applyNumFormat(baseOptions);
			expect(cell.val).toBe(3.14159);
		});

		it('rounds float when round_floats is true', () => {
			const cell = new Cell();
			cell.val = 3.14159;
			cell.fmt = { fmts: [{ fmt: '0.00', fmt_type: 'f', digits: 2 }] };
			cell.applyNumFormat({ ...baseOptions, round_floats: true });
			expect(cell.val).toBe(3.14);
		});

		it('converts date format to a Date instance', () => {
			const cell = new Cell();
			cell.val = 1; // Excel day 1 = Jan 1, 1900
			cell.fmt = { fmts: [{ fmt: 'mm-dd-yy', fmt_type: 'd' }] };
			cell.applyNumFormat({ ...baseOptions, ignore_timezone: true });
			expect(cell.val).toBeInstanceOf(Date);
			expect((cell.val as Date).getFullYear()).toBe(1900);
		});

		it('skips conversion when convert_values is not set', () => {
			const cell = new Cell();
			cell.val = 42;
			cell.fmt = { fmts: [{ fmt: '0', fmt_type: 'i' }] };
			cell.applyNumFormat({ format: 'tsv' });
			expect(cell.val).toBe(42);
		});

		it('skips integer conversion when convert_values.ints is false', () => {
			const cell = new Cell();
			cell.val = 42;
			cell.fmt = { fmts: [{ fmt: '0', fmt_type: 'i' }] };
			cell.applyNumFormat({ ...baseOptions, convert_values: { ints: false, floats: true, dates: true, bools: true } });
			expect(cell.val).toBe(42);
		});
	});

	describe('convertValue()', () => {
		it('parses a numeric string to number for type "n"', () => {
			const cell = new Cell();
			cell.typ = 'n';
			cell.val = '3.14';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe(3.14);
		});

		it('unescapes XML entities for type "str"', () => {
			const cell = new Cell();
			cell.typ = 'str';
			cell.val = 'old';
			cell.raw = '&lt;hello&gt;';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe('<hello>');
		});

		it('leaves value unchanged for type "s" (shared string)', () => {
			const cell = new Cell();
			cell.typ = 's';
			cell.val = 'shared string';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe('shared string');
		});

		it('leaves value unchanged for type "inlineStr"', () => {
			const cell = new Cell();
			cell.typ = 'inlineStr';
			cell.val = 'inline';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe('inline');
		});

		it('converts "1" to true for type "b"', () => {
			const cell = new Cell();
			cell.typ = 'b';
			cell.val = '1';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe(true);
		});

		it('converts "TRUE" to true for type "b"', () => {
			const cell = new Cell();
			cell.typ = 'b';
			cell.val = 'TRUE';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe(true);
		});

		it('converts "0" to false for type "b"', () => {
			const cell = new Cell();
			cell.typ = 'b';
			cell.val = '0';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe(false);
		});

		it('converts "FALSE" to false for type "b"', () => {
			const cell = new Cell();
			cell.typ = 'b';
			cell.val = 'FALSE';
			cell.convertValue(baseOptions);
			expect(cell.val).toBe(false);
		});

		it('does not convert bool when convert_values.bools is false', () => {
			const cell = new Cell();
			cell.typ = 'b';
			cell.val = '1';
			cell.convertValue({ ...baseOptions, convert_values: { ints: true, floats: true, dates: true, bools: false } });
			expect(cell.val).toBe('1');
		});

		it('does not convert bool when convert_values is not set', () => {
			const cell = new Cell();
			cell.typ = 'b';
			cell.val = '1';
			cell.convertValue({ format: 'tsv' });
			expect(cell.val).toBe('1');
		});

		it('leaves undefined val unchanged for type "n"', () => {
			const cell = new Cell();
			cell.typ = 'n';
			cell.val = undefined;
			cell.convertValue(baseOptions);
			expect(cell.val).toBeUndefined();
		});
	});
});