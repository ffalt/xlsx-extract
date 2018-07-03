/// <reference types="node" />
import stream from 'stream';
import sax from 'sax';
export interface ISaxParser {
    onStartElement(notify: (name: string, attributes: {
        [key: string]: string | undefined;
    }) => void): ISaxParser;
    onEndElement(notify: (name: string) => void): ISaxParser;
    onText(notify: (txt: string) => void): ISaxParser;
    onClose(notify: (err?: Error) => void): ISaxParser;
    piper(): stream.Duplex;
}
export declare class SaxSax implements ISaxParser {
    parser: sax.SAXStream;
    constructor();
    onStartElement(notify: (name: string, attributes: {
        [key: string]: string | undefined;
    }) => void): ISaxParser;
    onEndElement(notify: (name: string) => void): ISaxParser;
    onText(notify: (txt: string) => void): ISaxParser;
    onClose(notify: (err?: Error) => void): ISaxParser;
    piper(): stream.Duplex;
}
export declare class SaxExpat implements ISaxParser {
    parser: any;
    constructor();
    onStartElement(notify: (name: string, attributes: {
        [key: string]: string | undefined;
    }) => void): ISaxParser;
    onEndElement(notify: (name: string) => void): ISaxParser;
    onText(notify: (txt: string) => void): ISaxParser;
    onClose(notify: (err?: Error) => void): ISaxParser;
    piper(): stream.Duplex;
}
