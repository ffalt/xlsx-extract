/// <reference types="node" />
import { IXLSXExtractOptions } from './types';
import * as events from 'events';
export declare class XLSX extends events.EventEmitter {
    constructor();
    extract(filename: string, options?: IXLSXExtractOptions): XLSX;
    convert(filename: string, destfile: string, options: IXLSXExtractOptions): XLSX;
}
