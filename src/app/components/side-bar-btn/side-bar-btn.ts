import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output } from '@angular/core';
import 'iconify-icon';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-side-bar-btn',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './side-bar-btn.html',
  styleUrl: './side-bar-btn.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SideBarBtn {
  @Input() textContent: string = '';
  @Input() iconUrl: string = '';
  @Input() isActive: boolean = false;
  @Input() route:string = "";
  @Input() disabled:boolean =false;

  @Output() onClick: EventEmitter<any> = new EventEmitter<any>();

  onClicked() {
    this.onClick.emit();
  }
}
