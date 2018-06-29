// Type definitions for node-expat
// Project: https://github.com/astro/node-expat
// Definitions by: ffalt <https://github.com/ffalt>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module "node-expat" {
	import * as stream from "stream";
	export function createParser(): stream.Duplex;
}
