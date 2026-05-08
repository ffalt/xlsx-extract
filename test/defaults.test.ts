import os from 'os';
import { applyDefaults } from '../src/defaults';

describe('applyDefaults', () => {
	it('provides all defaults when no options are supplied', () => {
		const opts = applyDefaults(undefined);
		expect(opts.sheet_nr).toBe('1');
		expect(opts.ignore_header).toBe(0);
		expect(opts.date1904).toBe(false);
		expect(opts.include_empty_rows).toBe(false);
		expect(opts.tsv_float_comma).toBe(false);
		expect(opts.tsv_delimiter).toBe('\t');
		expect(opts.tsv_endofline).toBe(os.EOL);
		expect(opts.parser).toBe('sax');
		expect(opts.format).toBe('array');
		expect(opts.workfolder).toBe('xl');
		expect(opts.raw_values).toBe(false);
		expect(opts.round_floats).toBe(true);
		expect(opts.convert_values).toEqual({ ints: true, floats: true, dates: true, bools: true });
	});

	it('overrides defaults with provided options', () => {
		const opts = applyDefaults({ format: 'json', tsv_delimiter: ';' });
		expect(opts.format).toBe('json');
		expect(opts.tsv_delimiter).toBe(';');
		expect(opts.sheet_nr).toBe('1');
	});

	it('keeps unconflicting defaults when partial options are provided', () => {
		const opts = applyDefaults({ sheet_nr: '3' });
		expect(opts.sheet_nr).toBe('3');
		expect(opts.parser).toBe('sax');
		expect(opts.workfolder).toBe('xl');
	});

	it('replaces convert_values entirely when provided', () => {
		const cv = { ints: false, floats: true, dates: false, bools: true };
		const opts = applyDefaults({ convert_values: cv });
		expect(opts.convert_values).toEqual(cv);
	});
});