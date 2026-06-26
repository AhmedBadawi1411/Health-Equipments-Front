import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'department',
})
export class DepartmentPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
