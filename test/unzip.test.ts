import { YauzlUnzipEntry } from '../src/unzip';
import { PassThrough } from 'node:stream';

describe('YauzlUnzipEntry', () => {
	it('destroys the piper with the error when openReadStream fails', done => {
		const expectedError = new Error('stream open error');
		const mockZipFile = {
			openReadStream: (_entry: any, callback: (err: Error | null, stream?: any) => void) => {
				callback(expectedError);
			}
		};
		const entry = new YauzlUnzipEntry({} as any, mockZipFile as any);
		const piper = new PassThrough();
		piper.on('error', err => {
			expect(err).toBe(expectedError);
			done();
		});
		entry.pipe(piper);
	});
});
