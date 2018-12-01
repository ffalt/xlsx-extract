import { ICellFormat } from './cell';
import { IXLSXExtractOptions } from './types';
export declare function xlsx_date(value: number, date1904: boolean): Date;
export declare const xlsx_fmts: {
    [id: number]: string | null;
};
export declare function numAlpha(i: number): string;
export declare function alphaNum(name: string): number;
export declare function containsOnlyChars(value: string, chars: string): boolean;
export declare function splitCellFormats(s: string): Array<ICellFormat>;
export declare function getColumnFromDef(colDef: string): number;
export declare function isValidDate(d: any): boolean;
export declare function escapeTSV(val: string, options: IXLSXExtractOptions): string;
export declare function unescapexml(text: string): string;
