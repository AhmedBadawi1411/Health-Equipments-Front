import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-select-with-label',
  imports: [Select, CommonModule, FormsModule],
  templateUrl: './select-with-label.html',
  styleUrl: './select-with-label.css',
})
export class SelectWithLabel {
  @Input() optionsList: any[] = [];
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() optionLabel: string = 'name';
  @Input() optionValue: string | undefined = undefined;

  @Input() selectedItem: any = null;
  @Output() selectedItemChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onItemSelectedEvent: EventEmitter<any> = new EventEmitter<any>();

  onItemSelected(value: any) {
    this.selectedItemChange.emit(value);
    this.onItemSelectedEvent.emit(value);
  }
}
