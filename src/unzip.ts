import stream from 'stream';
import yauzl from 'yauzl';
/*
import unzip from 'unzip2';
*/
export interface IUnzipEntry {
	path: string;

	pipe(piper: stream.Duplex): void;

	ignore(): void;
}

export interface IUnzip {
	read(filename: string, onEntry: (entry: IUnzipEntry) => void, onError: (err: Error) => void, onClose: () => void): void;
}
/*
export class Unzip2UnzipEntry implements IUnzipEntry {
	path: string;

	constructor(private entry: unzip.ZipEntry) {
		this.path = entry.path;
	}

	public pipe(piper: stream.Duplex): void {
		this.entry.pipe(piper);
	}

	public ignore(): void {
		this.entry.autodrain();
	}
}
export class Unzip2Unzip implements IUnzip {

	public read(filename: string, onEntry: (entry: IUnzipEntry) => void, onError: (err: Error) => void, onClose: () => void): void {
		fs.createReadStream(filename)
			.pipe(unzip.Parse())
			.on('error', (err: Error) => {
				onError(err);
			})
			.on('entry', (entry: unzip.ZipEntry) => {
				const wrapper = new Unzip2UnzipEntry(entry);
				onEntry(wrapper);
			})
			.on('close', () => {
				onClose();
			});
	}

}
*/
export class YauzlUnzipEntry implements IUnzipEntry {
	path: string;

	constructor(private entry: yauzl.Entry, private zipfile: yauzl.ZipFile) {
		this.path = entry.fileName;
	}

	public pipe(piper: stream.Duplex): void {
		this.zipfile.openReadStream(this.entry, (err, readStream) => {
			if (err) {
				throw err;
			}
			if (!readStream) {
				throw new Error('No data for zip file entry');
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

	public read(filename: string, onEntry: (entry: IUnzipEntry) => void, onError: (err: Error) => void, onClose: () => void): void {
		yauzl.open(filename, {lazyEntries: true, autoClose: true}, (err, zipfile) => {
			if (err) {
				return onError(err);
			}
			if (!zipfile) {
				return onError(new Error('No zip data found in file'));
			}
			zipfile.on('error', (err2) => {
				onError(err2);
			});
			zipfile.on('entry', (entry) => {
				if (/\/$/.test(entry.fileName)) {
					// Directory file names end with '/'.
					// Note that entries for directories themselves are optional.
					// An entry's fileName implicitly requires its parent directories to exist.
					zipfile.readEntry();
				} else {
					const wrapper = new YauzlUnzipEntry(entry, zipfile);
					onEntry(wrapper);
				}
			});
			zipfile.once('end', () => {
				onClose();
			});
			zipfile.readEntry();
		});
	}

}

