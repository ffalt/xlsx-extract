const expat = require('node-expat');

export class Sax {
	parser = expat.createParser();

	constructor() {

	}

	onStartElement(notify: (name: string, attributes: { [key: string]: string | undefined }) => void): Sax {
		this.parser.on('startElement', notify);
		return this;
	}

	onEndElement(notify: (name: string) => void): Sax {
		this.parser.on('endElement', notify);
		return this;
	}

	onText(notify: (txt: string) => void): Sax {
		this.parser.on('text', notify);
		return this;
	}

	onClose(notify: (err?: Error) => void): Sax {
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

	piper() {
		return this.parser;
	}
}
