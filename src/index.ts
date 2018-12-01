import {IXLSXExtractOptions} from './types';
import * as events from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';
import {XLSXReader} from './reader';

export class XLSX extends events.EventEmitter {

	constructor() {
		super();
		util.inherits(XLSX, events.EventEmitter);
		events.EventEmitter.call(this);
	}

	extract(filename: string, options?: IXLSXExtractOptions): XLSX {
		const reader = new XLSXReader(filename, options);
		reader.read((what: string, data: any) => {
			this.emit(what, data);
		});
		return this;
	}

	convert(filename: string, destfile: string, options: IXLSXExtractOptions): XLSX {
		options = options || {};

		if ((!options.format) && ((path.extname(destfile).toLowerCase() === '.json'))) {
			options.format = 'json';
		}
		if (options.format !== 'json') {
			options.format = 'tsv';
		}

		let start = true;
		const isJSON = options.format !== 'tsv';
		let writeable: fs.WriteStream;
		try {
			writeable = fs.createWriteStream(destfile);
			if (isJSON) {
				writeable.write('[');
			}
		} catch (e) {
			this.emit('error', e);
			this.emit('end');
			return this;
		}
		writeable.on('close', () => {
			this.emit('end');
		});
		const reader = new XLSXReader(filename, options);
		reader.read((what, data) => {
			switch (what) {
				case 'error':
					this.emit('error', data);
					break;
				case 'cell':
					this.emit('cell', data);
					break;
				case 'row':
					if (isJSON) {
						if (start) {
							start = false;
							writeable.write(options.tsv_endofline);
						} else {
							writeable.write(',' + options.tsv_endofline);
						}
					}
					this.emit('row', data);
					writeable.write(data);
					break;
				case 'end':
					if (isJSON) {
						writeable.write(options.tsv_endofline + ']');
					}
					writeable.end();
					break;
			}
		});
		return this;
	}

}
