import path from 'node:path';
import fs from 'node:fs';
import tmp from 'tmp';
import { XLSX } from '../src';

const testXlsx = path.join(__dirname, 'fixtures', 'test.xlsx');
const fakeXlsx = path.join(__dirname, 'fixtures', 'fake.xlsx');

describe('XLSX.convert()', () => {
	it('writes TSV output to a file', done => {
		const file = tmp.fileSync({ postfix: '.tsv' });
		new XLSX()
			.convert(testXlsx, file.name, { format: 'tsv', tsv_endofline: '\n' })
			.on('end', () => {
				const content = fs.readFileSync(file.name, 'utf-8');
				expect(content.length).toBeGreaterThan(0);
				file.removeCallback();
				done();
			})
			.on('error', done);
	});

	it('auto-detects JSON format from .json extension and wraps output in brackets', done => {
		const file = tmp.fileSync({ postfix: '.json' });
		const rows: string[] = [];
		new XLSX()
			.convert(testXlsx, file.name)
			.on('row', r => rows.push(r as string))
			.on('end', () => {
				const content = fs.readFileSync(file.name, 'utf-8').trim();
				expect(content.startsWith('[')).toBe(true);
				expect(content.endsWith(']')).toBe(true);
				expect(rows.length).toBeGreaterThan(1);
				file.removeCallback();
				done();
			})
			.on('error', done);
	});

	it('emits error event when the XLSX file is invalid', done => {
		const file = tmp.fileSync({ postfix: '.tsv' });
		const errors: Error[] = [];
		new XLSX()
			.convert(fakeXlsx, file.name, { format: 'tsv' })
			.on('error', err => errors.push(err))
			.on('end', () => {
				expect(errors.length).toBeGreaterThan(0);
				file.removeCallback();
				done();
			});
	});
});
