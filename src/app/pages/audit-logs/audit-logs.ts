import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthcareService } from '../../services/healthcare.service';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Tag,
    InputTextModule,
    Select,
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
})
export class AuditLogsComponent implements OnInit {
  logs: any[] = [];
  filterSearch = '';
  filterStatus: string | null = null;
  loading = false;

  statusOptions = [
    { name: 'عمليات ناجحة', value: 'success' },
    { name: 'عمليات فاشلة (أخطاء)', value: 'fail' },
  ];

  constructor(
    private readonly healthcareService: HealthcareService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.healthcareService.getAuditLogs().subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success && res.data) {
          this.logs = res.data;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredLogs(): any[] {
    let list = this.logs;
    const search = this.filterSearch.trim().toLowerCase();
    if (search) {
      list = list.filter(l =>
        (l.userName && l.userName.toLowerCase().includes(search)) ||
        (l.userEmail && l.userEmail.toLowerCase().includes(search)) ||
        (l.action && l.action.toLowerCase().includes(search)) ||
        (l.endpoint && l.endpoint.toLowerCase().includes(search)) ||
        (l.method && l.method.toLowerCase().includes(search))
      );
    }
    if (this.filterStatus) {
      if (this.filterStatus === 'success') {
        list = list.filter(l => l.success);
      } else {
        list = list.filter(l => !l.success);
      }
    }
    return list;
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterStatus = null;
    this.cdr.detectChanges();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('ar-LY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
