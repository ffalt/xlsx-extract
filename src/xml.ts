import stream from 'node:stream';
import sax from 'sax';

function lowerFudge(obj: Record<string, string>): Record<string, string> {
	const result: Record<string, string> = {};
	for (const key of Object.keys(obj)) {
		result[key.toLowerCase()] = obj[key];
	}
	return result;
}

export interface ISaxParser {
	onStartElement(notify: (name: string, attributes: Record<string, string | undefined>) => void): ISaxParser;

	onEndElement(notify: (name: string) => void): ISaxParser;

	onText(notify: (txt: string) => void): ISaxParser;

	onClose(notify: (error?: Error) => void): ISaxParser;

	piper(): stream.Duplex;
}

export class SaxSax implements ISaxParser {
	parser = sax.createStream(false, { lowercase: true });

	onStartElement(notify: (name: string, attributes: Record<string, string | undefined>) => void): ISaxParser {
		this.parser.on('opentag', node => {
			notify(node.name.toLowerCase(), lowerFudge(node.attributes as Record<string, string>));
		});
		return this;
	}

	onEndElement(notify: (name: string) => void): ISaxParser {
		this.parser.on('closetag', name => {
			notify(name.toLowerCase());
		});
		return this;
	}

	onText(notify: (txt: string) => void): ISaxParser {
		this.parser.on('text', notify);
		return this;
	}

	onClose(notify: (error?: Error) => void): ISaxParser {
		let reported = false;
		this.parser.on('error', (error: Error) => {
			if (!reported) {
				reported = true;
				notify(error);
			}
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
