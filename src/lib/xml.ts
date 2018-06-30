import * as stream from 'stream';
import * as expat from 'node-expat';
import sax from 'sax';

function lowerFudge(obj: any): any {
	const result: any = {};
	Object.keys(obj).forEach(key => {
		result[key.toLowerCase()] = obj[key];
	});
	return result;
}

export interface ISaxParser {
	onStartElement(notify: (name: string, attributes: { [key: string]: string | undefined }) => void): ISaxParser;

	onEndElement(notify: (name: string) => void): ISaxParser;

	onText(notify: (txt: string) => void): ISaxParser;

	onClose(notify: (err?: Error) => void): ISaxParser;

	piper(): stream.Duplex;
}

export class SaxSax implements ISaxParser {
	parser = sax.createStream(false, {lowercase: true});

	constructor() {

	}

	onStartElement(notify: (name: string, attributes: { [key: string]: string | undefined }) => void): ISaxParser {
		this.parser.on('opentag', (node: any) => {
			notify(node.name.toLowerCase(), lowerFudge(node.attributes));
		});
		return this;
	}

	onEndElement(notify: (name: string) => void): ISaxParser {
		this.parser.on('closetag', (name) => {
			notify(name.toLowerCase());
		});
		return this;
	}

	onText(notify: (txt: string) => void): ISaxParser {
		this.parser.on('text', notify);
		return this;
	}

	onClose(notify: (err?: Error) => void): ISaxParser {
		let reported = false;
		this.parser.on('error', (err: Error) => {
			if (!reported) {
				reported = true;
				notify(err);
			}
			(<any>this.parser).error = null;
			this.parser.resume();
		});
		this.parser.on('end', () => {
			if (!reported) {
				notify();
			}
		});
		return this;
	}

	piper(): stream.Duplex {
		return this.parser;
	}
}

export class SaxExpat implements ISaxParser {
	parser = expat.createParser();

	constructor() {

	}

	onStartElement(notify: (name: string, attributes: { [key: string]: string | undefined }) => void): ISaxParser {
		this.parser.on('startElement', (name: string, attributes: any) => {
			notify(name.toLowerCase(), lowerFudge(attributes));
		});
		return this;
	}

	onEndElement(notify: (name: string) => void): ISaxParser {
		this.parser.on('endElement', (name: string) => {
			notify(name.toLowerCase());
		});
		return this;
	}

	onText(notify: (txt: string) => void): ISaxParser {
		this.parser.on('text', notify);
		return this;
	}

	onClose(notify: (err?: Error) => void): ISaxParser {
		let reported = false;
		this.parser.on('error', (err: Error) => {
			reported = true;
			notify(err);
		});
		this.parser.on('close', () => {
			if (!reported) {
				notify();
			}
		});
		return this;
	}

	piper(): stream.Duplex {
		return this.parser;
	}
}
