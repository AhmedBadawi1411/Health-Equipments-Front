import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectTypes } from '../../enums/selectTypes.enum';
import { CommonModule } from '@angular/common';
import { CustomSelectItem } from '../../interfaces/SelecteItem.interfdace';

@Component({
  selector: 'app-select-btn',
  imports: [CommonModule],
  templateUrl: './select-btn.html',
  styleUrl: './select-btn.css',
})
export class SelectBtn {
  @Input() textContent: string = '';
  @Input() items: CustomSelectItem<SelectTypes>[] = [];
  @Input() selectedItem: SelectTypes = SelectTypes.ADD_NEW_ASSET;
  @Output() onSelect: EventEmitter<CustomSelectItem<SelectTypes>> = new EventEmitter<
    CustomSelectItem<SelectTypes>
  >();

  onItemSelected(selectedItem: CustomSelectItem<SelectTypes>) {
    this.selectedItem = selectedItem.value;
    this.onSelect.emit(selectedItem);
  }
}
