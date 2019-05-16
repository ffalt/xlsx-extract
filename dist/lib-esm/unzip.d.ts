/// <reference types="node" />
import stream from 'stream';
import yauzl from 'yauzl';
export interface IUnzipEntry {
    path: string;
    pipe(piper: stream.Duplex): void;
    ignore(): void;
}
export interface IUnzip {
    read(filename: string, onEntry: (entry: IUnzipEntry) => void, onError: (err: Error) => void, onClose: () => void): void;
}
export declare class YauzlUnzipEntry implements IUnzipEntry {
    private entry;
    private zipfile;
    path: string;
    constructor(entry: yauzl.Entry, zipfile: yauzl.ZipFile);
    pipe(piper: stream.Duplex): void;
    ignore(): void;
}
export declare class YauzlUnzip implements IUnzip {
    read(filename: string, onEntry: (entry: IUnzipEntry) => void, onError: (err: Error) => void, onClose: () => void): void;
}
