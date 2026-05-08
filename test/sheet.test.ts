import { Sheet } from '../src/sheet';
import { IXLSXExtractOptions } from '../src/types';
import os from 'node:os';

const baseOptions: IXLSXExtractOptions = {
	format: 'tsv',
	tsv_delimiter: '\t',
	tsv_endofline: '\n',
};

function makeSheet(): Sheet {
	const s = new Sheet();
	s.name = 'Sheet1';
	s.nr = '1';
	s.rid = 'rId1';
	s.id = 'id1';
	return s;
}

describe('Sheet', () => {
	describe('toArray()', () => {
		it('returns [name, rid, nr, id]', () => {
			expect(makeSheet().toArray()).toEqual(['Sheet1', 'rId1', '1', 'id1']);
		});

		it('includes undefined slots when properties are not set', () => {
			const s = new Sheet();
			expect(s.toArray()).toEqual([undefined, undefined, undefined, undefined]);
		});
	});

	describe('toJson()', () => {
		it('returns a JSON object with sheet properties', () => {
			const result = JSON.parse(makeSheet().toJson());
			expect(result).toEqual({ name: 'Sheet1', nr: '1', rid: 'rId1', id: 'id1' });
		});
	});

	describe('toTSV()', () => {
		it('joins array values with the delimiter and appends end-of-line', () => {
			expect(makeSheet().toTSV(baseOptions)).toBe('Sheet1\trId1\t1\tid1\n');
		});

		it('uses a custom delimiter', () => {
			const opts = { ...baseOptions, tsv_delimiter: ';' };
			expect(makeSheet().toTSV(opts)).toBe('Sheet1;rId1;1;id1\n');
		});

		it('falls back to os.EOL and tab delimiter when options are not set', () => {
			expect(makeSheet().toTSV({})).toBe('Sheet1\trId1\t1\tid1' + os.EOL);
		});
	});

	describe('getFormat()', () => {
		it('returns toJson() for json format', () => {
			const result = JSON.parse(makeSheet().getFormat({ ...baseOptions, format: 'json' }));
			expect(result.name).toBe('Sheet1');
		});

		it('returns toArray() for array format', () => {
			expect(makeSheet().getFormat({ ...baseOptions, format: 'array' })).toEqual(['Sheet1', 'rId1', '1', 'id1']);
		});

		it('returns the sheet itself for obj format', () => {
			const s = makeSheet();
			expect(s.getFormat({ ...baseOptions, format: 'obj' })).toBe(s);
		});

		it('returns toTSV() for tsv format (default)', () => {
			expect(makeSheet().getFormat(baseOptions)).toBe('Sheet1\trId1\t1\tid1\n');
		});
	});
});