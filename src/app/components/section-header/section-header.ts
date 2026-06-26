import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Icons } from '../../environment';
import { BreadCrump } from '../bread-crump/bread-crump';

@Component({
  selector: 'app-section-header',
  imports: [CommonModule, ButtonModule],
  templateUrl: './section-header.html',
  styleUrl: './section-header.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SectionHeader {
  @Input() sectionTitle:string="إدارة الأصول";
  @Input() actionLabel:string="إضافة أصل جديد";
  @Input() actionIcon:string="pi pi-plus";
  @Input() showAddButton:boolean=true;

  @Output() onAddClickedEvent: EventEmitter<any> = new EventEmitter<any>();

  protected Icons = Icons;

  onAddClicked() {
    this.onAddClickedEvent.emit();
  }
}
