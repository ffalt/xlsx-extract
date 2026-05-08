import { Row } from '../src/row';
import { Cell } from '../src/cell';
import { IXLSXExtractOptions } from '../src/types';
import os from 'node:os';

const baseOptions: IXLSXExtractOptions = {
	format: 'tsv',
	tsv_delimiter: '\t',
	tsv_endofline: '\n',
};

function makeCell(val: any): Cell {
	const cell = new Cell();
	cell.val = val;
	cell.raw = (val !== undefined) ? String(val) : undefined;
	return cell;
}

describe('Row', () => {
	describe('push() and count()', () => {
		it('starts with zero cells', () => {
			expect(new Row().count()).toBe(0);
		});

		it('increments count after each push', () => {
			const row = new Row();
			row.push(makeCell('a'));
			row.push(makeCell('b'));
			expect(row.count()).toBe(2);
		});
	});

	describe('isEmpty()', () => {
		it('returns true for a row with no cells', () => {
			expect(new Row().isEmpty()).toBe(true);
		});

		it('returns true when all cell values are undefined', () => {
			const row = new Row();
			row.push(makeCell(undefined));
			row.push(makeCell(undefined));
			expect(row.isEmpty()).toBe(true);
		});

		it('returns false when at least one cell has a non-undefined value', () => {
			const row = new Row();
			row.push(makeCell(undefined));
			row.push(makeCell('data'));
			expect(row.isEmpty()).toBe(false);
		});

		it('returns false for a zero value (not null)', () => {
			const row = new Row();
			row.push(makeCell(0));
			expect(row.isEmpty()).toBe(false);
		});
	});

	describe('toArray()', () => {
		it('returns an array of cell values', () => {
			const row = new Row();
			row.push(makeCell('a'));
			row.push(makeCell(42));
			expect(row.toArray()).toEqual(['a', 42]);
		});

		it('returns empty array for an empty row', () => {
			expect(new Row().toArray()).toEqual([]);
		});
	});

	describe('toJson()', () => {
		it('returns a JSON array of cell values', () => {
			const row = new Row();
			row.push(makeCell('hello'));
			row.push(makeCell(1));
			expect(row.toJson()).toBe('["hello",1]');
		});

		it('returns an empty JSON array for an empty row', () => {
			expect(new Row().toJson()).toBe('[]');
		});
	});

	describe('toTSV()', () => {
		it('joins cell values with the delimiter and appends end-of-line', () => {
			const row = new Row();
			row.push(makeCell('a'));
			row.push(makeCell('b'));
			expect(row.toTSV(baseOptions)).toBe('a\tb\n');
		});

		it('uses a custom delimiter', () => {
			const row = new Row();
			row.push(makeCell('x'));
			row.push(makeCell('y'));
			const opts = { ...baseOptions, tsv_delimiter: ';' };
			expect(row.toTSV(opts)).toBe('x;y\n');
		});

		it('returns only end-of-line for an empty row', () => {
			expect(new Row().toTSV(baseOptions)).toBe('\n');
		});

		it('falls back to os.EOL and tab delimiter when options are not set', () => {
			const row = new Row();
			row.push(makeCell('a'));
			row.push(makeCell('b'));
			expect(row.toTSV({})).toBe('a\tb' + os.EOL);
		});
	});

	describe('getFormat()', () => {
		it('returns toJson() for json format', () => {
			const row = new Row();
			row.push(makeCell('a'));
			expect(row.getFormat({ ...baseOptions, format: 'json' })).toBe('["a"]');
		});

		it('returns toArray() for array format', () => {
			const row = new Row();
			row.push(makeCell('a'));
			expect(row.getFormat({ ...baseOptions, format: 'array' })).toEqual(['a']);
		});

		it('returns the row itself for obj format', () => {
			const row = new Row();
			expect(row.getFormat({ ...baseOptions, format: 'obj' })).toBe(row);
		});

		it('returns toTSV() for tsv format (default)', () => {
			const row = new Row();
			row.push(makeCell('a'));
			expect(row.getFormat(baseOptions)).toBe('a\n');
		});
	});
});