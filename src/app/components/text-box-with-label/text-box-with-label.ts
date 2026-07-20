import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-box-with-label',
  imports: [IconField, InputIcon, InputTextModule, FormsModule],
  templateUrl: './text-box-with-label.html',
  styleUrl: './text-box-with-label.css',
})
export class TextBoxWithLabel {
  @Input() label: string = 'البحث';
  @Input() icon: string = 'pi pi-search';
  @Input() placeholder: string = "" ;

  @Input() value: string = '';
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() onTextChange: EventEmitter<string> = new EventEmitter<string>();

  onTextChanged(inputText: string) {
    this.value = inputText;
    this.valueChange.emit(inputText);
    this.onTextChange.emit(inputText);
  }
}
