import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor() {}

  /**
   * Exports an array of JSON objects to an Excel (.xlsx) file.
   * @param data The array of objects to export.
   * @param fileName The name of the exported file (without extension).
   * @param headersMap Map of original keys to desired column headers (e.g. { id: 'رقم السجل', 'facility.facilityName': 'المرفق الصحي' }).
   * @param sheetName Name of the worksheet inside the workbook.
   */
  exportToExcel(
    data: any[],
    fileName: string,
    headersMap?: { [key: string]: string },
    sheetName: string = 'البيانات'
  ): void {
    // Process and flatten data
    const processedData = data.map((item, index) => {
      const flattened = this.flattenObject(item);
      
      // If a headers map is provided, map keys and order them
      if (headersMap) {
        const mappedItem: any = {};
        
        // Always add a serial/counter column first
        mappedItem['ت'] = index + 1;

        for (const [key, label] of Object.entries(headersMap)) {
          // Key can be nested or normal
          mappedItem[label] = flattened[key] !== undefined && flattened[key] !== null ? flattened[key] : '-';
        }
        return mappedItem;
      }
      
      return flattened;
    });

    // Dynamic import of xlsx and file-saver
    Promise.all([
      import('xlsx'),
      import('file-saver')
    ]).then(([xlsx, fileSaver]) => {
      const worksheet = xlsx.utils.json_to_sheet(processedData);
      
      // Right-to-Left (RTL) layout for Arabic language support
      worksheet['!dir'] = 'rtl';

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
      fileSaver.saveAs(blob, `${fileName}_${new Date().getTime()}.xlsx`);
    }).catch(err => {
      console.error('Failed to export to Excel: libraries failed to load.', err);
    });
  }

  /**
   * Helper to flatten a nested object.
   * e.g., { facility: { name: 'Hospital' } } becomes { 'facility.name': 'Hospital' }
   */
  private flattenObject(ob: any): any {
    const toReturn: any = {};

    for (const i in ob) {
      if (!ob.hasOwnProperty(i)) continue;

      if (typeof ob[i] === 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
        const flatObject = this.flattenObject(ob[i]);
        for (const x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[i + '.' + x] = flatObject[x];
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
    return toReturn;
  }
}
