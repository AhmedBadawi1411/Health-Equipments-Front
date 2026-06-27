import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moduleName',
})
export class ModuleNamePipe implements PipeTransform {
  private readonly modulesMap = {
    user: 'المستخدمين',
    facility: 'الجهات',
    department: 'الأقسام',
    equipment: 'المعدات',
    asset: 'الأصول',
    maintenance: 'الصيانة',
    inventory: 'عمليات الحصر',
    request: 'طلبات الاحتياج',
    supplier: 'الموردين',
    dashboard: 'لوحة المعلومات',
    region: 'البلديات',
    role: 'الأدوار',
    gis: 'البيانات المكانية',
  };

  transform(value: string, ...args: unknown[]): string {
    return this.modulesMap[value as keyof typeof this.modulesMap] ?? '';
  }
}
