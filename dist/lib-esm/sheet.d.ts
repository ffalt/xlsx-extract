import { IXLSXExtractOptions } from './types';
export declare class Sheet {
    nr?: string;
    id?: string;
    rid?: string;
    name?: string;
    getFormat(options: IXLSXExtractOptions): any;
    toTSV(options: IXLSXExtractOptions): string;
    toJson(): string;
    toArray(): Array<string | undefined>;
}
