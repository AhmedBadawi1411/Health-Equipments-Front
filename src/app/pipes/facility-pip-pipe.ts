import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'facilityPip',
})
export class FacilityPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): unknown {
    return null;
  }

}
