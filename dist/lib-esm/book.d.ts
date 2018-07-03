import { Sheet } from './sheet';
import { ICellFormatStyles } from './cell';
export declare class Workbook {
    sheets: Array<Sheet>;
    sharedStrings: Array<string>;
    styles: ICellFormatStyles;
    relations: Array<{
        sheetid: string;
        filename: string;
    }>;
    getByRId(id: string): Sheet | undefined;
    getById(id: string): Sheet | undefined;
    getByNr(nr: string): Sheet | undefined;
    getByName(name: string): Sheet | undefined;
}
