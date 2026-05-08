import events from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { IXLSXExtractOptions } from './types.js';
import { XLSXReader } from './reader.js';

export class XLSX extends events.EventEmitter {
	extract(filename: string, options?: IXLSXExtractOptions): this {
		const reader = new XLSXReader(filename, options);
		reader.read((what: string, data: any) => {
			this.emit(what, data);
		});
		return this;
	}

	convert(filename: string, destinationFile: string, options?: IXLSXExtractOptions): this {
		options = options ?? {};

		if ((!options.format) && ((path.extname(destinationFile).toLowerCase() === '.json'))) {
			options.format = 'json';
		}
		if (options.format !== 'json') {
			options.format = 'tsv';
		}

		let start = true;
		const isJSON = options.format !== 'tsv';
		let writeable: fs.WriteStream;
		try {
			writeable = fs.createWriteStream(destinationFile);
			if (isJSON) {
				writeable.write('[');
			}
		} catch (error) {
			this.emit('error', error);
			this.emit('end');
			return this;
		}
		writeable.on('close', () => {
			this.emit('end');
		});
		const reader = new XLSXReader(filename, options);
		const tsv_endofline = options.tsv_endofline ?? os.EOL;
		reader.read((what, data) => {
			switch (what) {
				case 'error': {
					this.emit('error', data);
					break;
				}
				case 'cell': {
					this.emit('cell', data);
					break;
				}
				case 'row': {
					if (isJSON) {
						if (start) {
							start = false;
							writeable.write(tsv_endofline);
						} else {
							writeable.write(',' + tsv_endofline);
						}
					}
					this.emit('row', data);
					writeable.write(data);
					break;
				}
				case 'end': {
					if (isJSON) {
						writeable.write(tsv_endofline + ']');
					}
					writeable.end();
					break;
				}
			}
		});
		return this;
	}
}
