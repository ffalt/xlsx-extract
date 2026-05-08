import { Workbook } from '../src/book';
import { Sheet } from '../src/sheet';

function makeSheet(opts: { nr?: string; id?: string; rid?: string; name?: string }): Sheet {
	const s = new Sheet();
	s.nr = opts.nr;
	s.id = opts.id;
	s.rid = opts.rid;
	s.name = opts.name;
	return s;
}

describe('Workbook', () => {
	let book: Workbook;

	beforeEach(() => {
		book = new Workbook();
		book.sheets = [
			makeSheet({ nr: '1', id: '1', rid: 'rId1', name: 'First' }),
			makeSheet({ nr: '2', id: '2', rid: 'rId2', name: 'Second' }),
		];
	});

	describe('getByRId()', () => {
		it('finds a sheet by rid', () => {
			expect(book.getByRId('rId1')?.name).toBe('First');
			expect(book.getByRId('rId2')?.name).toBe('Second');
		});

		it('returns undefined for an unknown rid', () => {
			expect(book.getByRId('rId99')).toBeUndefined();
		});
	});

	describe('getById()', () => {
		it('finds a sheet by id', () => {
			expect(book.getById('1')?.name).toBe('First');
			expect(book.getById('2')?.name).toBe('Second');
		});

		it('returns undefined for an unknown id', () => {
			expect(book.getById('99')).toBeUndefined();
		});
	});

	describe('getByNr()', () => {
		it('finds a sheet by number', () => {
			expect(book.getByNr('1')?.name).toBe('First');
			expect(book.getByNr('2')?.name).toBe('Second');
		});

		it('returns undefined for an unknown number', () => {
			expect(book.getByNr('99')).toBeUndefined();
		});
	});

	describe('getByName()', () => {
		it('finds a sheet by name', () => {
			expect(book.getByName('First')?.nr).toBe('1');
			expect(book.getByName('Second')?.nr).toBe('2');
		});

		it('returns undefined for an unknown name', () => {
			expect(book.getByName('NotExist')).toBeUndefined();
		});

		it('is case-sensitive', () => {
			expect(book.getByName('first')).toBeUndefined();
		});
	});

	it('starts with empty collections', () => {
		const empty = new Workbook();
		expect(empty.sheets).toHaveLength(0);
		expect(empty.sharedStrings).toHaveLength(0);
		expect(empty.relations).toHaveLength(0);
	});
});