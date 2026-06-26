import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moduleName',
})
export class ModuleNamePipe implements PipeTransform {
  private readonly modulesMap = {
    ASSETS: 'الأصول',
    FACILITIES: 'الجهات',
    INVENTORY: 'عمليات الحصر',
    USERS: 'المستخدمين',
  };

  transform(value: string, ...args: unknown[]): string {
    return this.modulesMap[value as keyof typeof this.modulesMap] ?? '';
  }
}
