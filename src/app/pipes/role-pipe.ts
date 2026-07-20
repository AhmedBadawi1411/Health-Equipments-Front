import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'role',
})
export class RolePipe implements PipeTransform {
  private readonly rolesMap:any = {
    1:"مسؤول نظام",
    2:"مورد",
    3:"مهندس صيانة",
    4:"مسؤول مرفق",
    5:"محلل بيانات",
    6:"مدقق بيانات",
  }
  transform(value: any, ...args: unknown[]): unknown {
    return this.rolesMap[value];
  }

}
