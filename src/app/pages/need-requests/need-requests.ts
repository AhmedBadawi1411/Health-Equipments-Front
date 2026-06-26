import { Component, OnInit } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { Button, ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SectionHeader } from '../../components/section-header/section-header';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { NeedsService } from '../../services/needs.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-need-requests',
  imports: [
    TagModule,
    ButtonModule,
    TableModule,
    SectionHeader,
    CommonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './need-requests.html',
  styleUrl: './need-requests.css',
})
export class NeedRequests implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    protected readonly needsService: NeedsService,
    private readonly toast: MessageService
  ) {}

  ngOnInit() {
    this.needsService.loadNeedRequests();
    if (this.needsService.pendingLockMessage) {
      setTimeout(() => {
        this.toast.add({
          severity: 'error',
          summary: 'تنبيه',
          detail: 'غير مسموح بطلب الاحتياج: يجب إكمال عملية الحصر والموافقة عليها أولا، وأن تكون الجهة معتمدة.'
        });
      }, 100);
      this.needsService.pendingLockMessage = false;
    }
  }

  onAdd() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  editRequest(id: number) {
    this.router.navigate(['edit', id], { relativeTo: this.route });
  }

  deleteRequest(id: number) {
    if (confirm('هل أنت متأكد من رغبتك في حذف طلب الاحتياج هذا؟')) {
      this.needsService.deleteNeedRequest(id).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'تم بنجاح', detail: 'تم حذف طلب الاحتياج بنجاح' });
          this.needsService.loadNeedRequests(true);
        },
        error: (err) => {
          console.error('Failed to delete request:', err);
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حذف طلب الاحتياج' });
        }
      });
    }
  }
}
