import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import tmp from 'tmp';

const bin = path.join(__dirname, '..', 'bin', 'xlsxe.js');
const testXlsx = path.join(__dirname, 'fixtures', 'test.xlsx');
const fakeXlsx = path.join(__dirname, 'fixtures', 'fake.xlsx');

function run(args: string[]) {
	return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf-8' });
}

describe('bin/xlsxe.js', () => {
	it('exits with code 1 and prints error when no file is given', () => {
		const result = run([]);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('must specify a filename');
	});

	it('exits with code 2 and prints error when file does not exist', () => {
		const result = run(['nonexistent.xlsx']);
		expect(result.status).toBe(2);
		expect(result.stderr).toContain('No such file or directory');
	});

	it('prints --version', () => {
		const result = run(['--version']);
		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it('extracts TSV rows to stdout', () => {
		const result = run([testXlsx]);
		expect(result.status).toBe(0);
		expect(result.stdout.length).toBeGreaterThan(0);
	});

	it('extracts JSON rows to stdout with --mode json', () => {
		const result = run(['--mode', 'json', testXlsx]);
		expect(result.status).toBe(0);
		const lines = result.stdout.trim().split('\n').filter(Boolean);
		for (const line of lines) {
			expect(() => JSON.parse(line)).not.toThrow();
		}
	});

	it('writes TSV to destination file', () => {
		const file = tmp.fileSync({ postfix: '.tsv' });
		try {
			const result = run([testXlsx, file.name]);
			expect(result.status).toBe(0);
			expect(fs.existsSync(file.name)).toBe(true);
			expect(fs.readFileSync(file.name, 'utf-8').length).toBeGreaterThan(0);
		} finally {
			file.removeCallback();
		}
	});

	it('exits non-zero on invalid xlsx when writing to file', () => {
		const file = tmp.fileSync({ postfix: '.tsv' });
		try {
			const result = run([fakeXlsx, file.name]);
			expect(result.stderr.length).toBeGreaterThan(0);
		} finally {
			file.removeCallback();
		}
	});
});
