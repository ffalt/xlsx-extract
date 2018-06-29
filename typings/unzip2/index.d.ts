// Type definitions for unzip2
// Project: https://github.com/glebdmitriew/node-unzip-2
// Definitions by: ffalt <https://github.com/ffalt>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import * as stream from 'stream';

declare namespace unzip2 {

	interface ZipEntry {
		path: string;
		pipe: (stream: stream.Duplex) => void;
		autodrain: () => void;
	}

	interface Client {
		Parse: () => stream.Duplex;
	}

}

declare var unzip2: unzip2.Client;
export = unzip2;
