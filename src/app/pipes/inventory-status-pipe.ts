import { Pipe, PipeTransform } from '@angular/core';
import { INVENTORY_STATUS, InventoryStatusKey } from '../shared/constants/constants';

@Pipe({
  name: 'InventoryStatus',
})
export class InventoryStatusPipe implements PipeTransform {
  transform(value: InventoryStatusKey) {
    return INVENTORY_STATUS[value];
  }
}
