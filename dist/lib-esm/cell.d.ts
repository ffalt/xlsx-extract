import { IXLSXExtractOptions } from './types';
export interface ICellFormat {
    fmt: string;
    fmt_type: string;
    digits?: number;
}
export interface ICellFormatStyle {
    fmt?: string;
    fmtnr?: number;
    fmts: Array<ICellFormat>;
    def?: {
        [key: string]: string | undefined;
    };
}
export interface ICellFormatStyles {
    [id: string]: ICellFormatStyle;
}
export declare class Cell {
    val: any;
    col?: number;
    address?: string;
    typ?: string;
    fmt?: ICellFormatStyle;
    formula?: string;
    raw?: string;
    getFormat(options: IXLSXExtractOptions): any;
    toTSV(options: IXLSXExtractOptions): string | undefined;
    toJson(): string;
    getEffectiveNumFormat(): ICellFormat | null;
    applyNumFormat(options: IXLSXExtractOptions): void;
    convertValue(options: IXLSXExtractOptions): void;
}
