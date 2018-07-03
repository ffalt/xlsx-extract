import { IXLSXExtractOptions } from './types';
export declare class XLSXReader {
    filename: string;
    options: IXLSXExtractOptions;
    workfolder: string;
    constructor(filename: string, options?: IXLSXExtractOptions);
    private createParser;
    private parseXMLSheet;
    private parseXMLWorkbookSheets;
    private parseXMLWorkbookRelations;
    private parseXMLStyles;
    private parseXMLStrings;
    private getLookups;
    private parseSheets;
    private parseWorkbook;
    read(emit: (what: string, data?: any) => void): void;
}
