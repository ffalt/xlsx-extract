import stream from 'node:stream';
import yauzl, { Entry } from 'yauzl';

export interface IUnzipEntry {
	path: string;

	pipe(piper: stream.Duplex): void;

	ignore(): void;
}

export interface IUnzip {
	read(filename: string, onEntry: (entry: IUnzipEntry) => void, onError: (error: Error) => void, onClose: () => void): void;
}

export class YauzlUnzipEntry implements IUnzipEntry {
	path: string;

	constructor(private entry: yauzl.Entry, private zipfile: yauzl.ZipFile) {
		this.path = entry.fileName;
	}

	public pipe(piper: stream.Duplex): void {
		this.zipfile.openReadStream(this.entry, (error, readStream) => {
			if (error) {
				throw error;
			}
			readStream.on('end', () => {
				this.zipfile.readEntry();
			});
			readStream.pipe(piper);
		});
	}

	public ignore(): void {
		this.zipfile.readEntry();
	}
}

export class YauzlUnzip implements IUnzip {
	public read(
		filename: string,
		onEntry: (entry: IUnzipEntry) => void,
		onError: (error: Error) => void,
		onClose: () => void
	): void {
		yauzl.open(filename, { lazyEntries: true, autoClose: true }, (error, zipFile) => {
			if (error) {
				onError(error);
				return;
			}
			zipFile.on('error', (error2: Error) => {
				onError(error2);
			});
			zipFile.on('entry', (entry: Entry) => {
				if (entry.fileName.endsWith('/')) {
					// Directory file names end with '/'.
					// Note that entries for directories themselves are optional.
					// An entry's fileName implicitly requires its parent directories to exist.
					zipFile.readEntry();
				} else {
					const wrapper = new YauzlUnzipEntry(entry, zipFile);
					onEntry(wrapper);
				}
			});
			zipFile.once('end', () => {
				onClose();
			});
			zipFile.readEntry();
		});
	}
}
