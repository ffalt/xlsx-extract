import { Cell } from './cell';
import { IXLSXExtractOptions } from './types';
export declare class Row {
    cells: Array<Cell>;
    getFormat(options: IXLSXExtractOptions): string | this | (string | number | undefined)[];
    toTSV(options: IXLSXExtractOptions): string;
    toJson(): string;
    toArray(): Array<string | number | undefined>;
    push(cell: Cell): void;
    count(): number;
    isEmpty(): boolean;
}
