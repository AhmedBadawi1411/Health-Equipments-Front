import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { ProgressBar } from 'primeng/progressbar';
import { SectionHeader } from '../../components/section-header/section-header';
import { SelectWithLabel } from '../../components/select-with-label/select-with-label';
import { AuthService } from '../../services/auth-service';
import { HealthcareService, Facility } from '../../services/healthcare.service';
import {
  ImportService,
  ImportValidationReport,
  ImportRowResult,
  DepartmentMapping,
  ImportRequest,
} from '../../services/import-service';
import 'iconify-icon';

@Component({
  selector: 'app-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ButtonModule,
    TableModule,
    Tag,
    Dialog,
    Select,
    ProgressBar,
    SectionHeader,
    SelectWithLabel,
  ],
  providers: [MessageService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './import.html',
  styleUrl:'./import.css'
})
export class ImportComponent implements OnInit {

  // ── Step management ──────────────────────────────────────────────────────
  currentStep = signal<1 | 2 | 3>(1);

  // ── Facility selection ───────────────────────────────────────────────────
  facilities: Facility[] = [];
  selectedFacilityId: number | '' = '';
  selectedFacility: Facility | null = null;

  // ── File / parsing state ─────────────────────────────────────────────────
  isDragging = signal(false);
  isValidating = signal(false);
  isSubmitting = signal(false);
  parsedRows: any[] = [];
  validationReport = signal<ImportValidationReport | null>(null);

  // ── Active tab in validation report ─────────────────────────────────────
  activeTab = signal<'all' | 'invalid' | 'warnings'>('all');

  // ── Department mappings ─────────────────────────────────────────────────
  departmentMappings: DepartmentMapping[] = [];
  dbDepartments: { id: number; departmentName: string }[] = [];

  // ── Review (Admins & Reviewers) ─────────────────────────────────────────
  pendingRequests = signal<ImportRequest[]>([]);
  historyRequests = signal<ImportRequest[]>([]);
  showReviewDialog = signal(false);
  selectedReviewRequest = signal<ImportRequest | null>(null);
  reviewAction: 'approve' | 'reject' = 'approve';
  reviewerNotes = '';

  // ── Column definitions ─────────────────────────────────────────────────
  readonly EXCEL_HEADERS = [
    'م',
    'القسم',
    'النوع',
    'الاسم العلمي',
    'موديل الجهاز',
    'الرقم التسلسلي',
    'الشركة المصنعة',
    'بلد المنشأ',
    'تاريخ التصنيع',
    'الشركة الموردة',
    'تاريخ التركيب',
    'الحالة الفنية',
    'وحدة القياس',
    'الكمية المتاحة',
    'الحد الأدني',
  ];

  readonly HEADER_MAP: Record<string, string> = {
    'م': 'rowNumber',
    'القسم': 'excelDepartmentName',
    'النوع': 'itemType',
    'الاسم العلمي': 'scientificName',
    'موديل الجهاز': 'model',
    'الرقم التسلسلي': 'serialNumber',
    'الشركة المصنعة': 'manufacturer',
    'بلد المنشأ': 'countryOfOrigin',
    'تاريخ التصنيع': 'manufacturingDate',
    'الشركة الموردة': 'supplierCompany',
    'تاريخ التركيب': 'installationDate',
    'الحالة الفنية': 'operationalStatus',
    'وحدة القياس': 'unit',
    'الكمية المتاحة': 'quantity',
    'الحد الأدني': 'minimumStock',
  };

  readonly STATUS_MAP: Record<string, string> = {
    '1': 'Fully Functional',
    '2': 'Functional & Needs Supplies',
    '3': 'Out of Service & Needs Maintenance',
    '4': 'Functional but Inactive',
    '5': 'Scrapped',
  };

  readonly STATUS_SEVERITY_MAP: Record<string, 'success' | 'info' | 'danger' | 'warn' | 'secondary'> = {
    'Fully Functional': 'success',
    'Functional & Needs Supplies': 'info',
    'Out of Service & Needs Maintenance': 'danger',
    'Functional but Inactive': 'warn',
    'Scrapped': 'secondary',
  };

  readonly STATUS_ARABIC_MAP: Record<string, string> = {
    'Fully Functional': 'يعمل بكفاءة',
    'Functional & Needs Supplies': 'يعمل ويحتاج مستلزمات',
    'Out of Service & Needs Maintenance': 'خارج الخدمة ويحتاج صيانة',
    'Functional but Inactive': 'يعمل ولكنه غير نشط',
    'Scrapped': 'تالف',
  };

  constructor(
    public readonly authService: AuthService,
    private readonly healthcareService: HealthcareService,
    private readonly importService: ImportService,
    private readonly toast: MessageService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFacilities();
    if (this.isAdminOrReviewer) {
      this.loadPendingRequests();
    }
  }

  get isAdminOrReviewer(): boolean {
    const roleId = this.authService.user()?.roleId;
    return roleId === '1' || roleId === '6';
  }

  get isAdmin(): boolean {
    return this.authService.user()?.roleId === '1';
  }

  // ── Data loading ─────────────────────────────────────────────────────────
  loadFacilities() {
    this.healthcareService.getFacilities().subscribe({
      next: (res: any) => {
        this.facilities = res.data ?? [];
        // For non-admins, auto-select first allowed facility
        if (!this.isAdmin) {
          const userFacIds = this.authService.user()?.facilityIds ?? [];
          const first = this.facilities.find((f: Facility) => userFacIds.includes(f.id));
          if (first) {
            this.selectedFacilityId = first.id;
            this.onFacilityChanged();
          }
        }
        this.cdr.markForCheck();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل المرافق' }),
    });
  }

  onFacilityChanged() {
    if (!this.selectedFacilityId) return;
    const fac = this.facilities.find((f: Facility) => f.id === this.selectedFacilityId);
    this.selectedFacility = fac ?? null;
    this.loadDepartments();
    this.loadHistory();
    this.cdr.markForCheck();
  }

  loadDepartments() {
    if (!this.selectedFacilityId) return;
    this.healthcareService.getDepartments(Number(this.selectedFacilityId)).subscribe({
      next: (res: any) => {
        this.dbDepartments = res.data ?? [];
        this.cdr.markForCheck();
      },
    });
  }

  loadPendingRequests() {
    this.importService.getPendingRequests().subscribe({
      next: (res) => {
        this.pendingRequests.set(res.data);
        this.cdr.markForCheck();
      },
    });
  }

  loadHistory() {
    if (!this.selectedFacilityId) return;
    this.importService.getHistory(Number(this.selectedFacilityId)).subscribe({
      next: (res) => {
        this.historyRequests.set(res.data);
        this.cdr.markForCheck();
      },
    });
  }

  // ── File Drag & Drop ─────────────────────────────────────────────────────
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  processFile(file: File) {
    if (!this.selectedFacilityId) {
      this.toast.add({ severity: 'warn', summary: 'تحذير', detail: 'يرجى اختيار المرفق الصحي أولاً' });
      return;
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب أن يكون الملف بصيغة Excel (.xlsx أو .xls)' });
      return;
    }

    import('xlsx').then((XLSX) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (rawRows.length === 0) {
            this.toast.add({ severity: 'warn', summary: 'الملف فارغ', detail: 'لم يتم العثور على بيانات في الملف' });
            return;
          }

          // Map Arabic headers to English field names
          this.parsedRows = rawRows.map((row: any) => {
            const mapped: any = {};
            for (const [arabicKey, englishKey] of Object.entries(this.HEADER_MAP)) {
              const val = row[arabicKey];
              mapped[englishKey] = val !== undefined && val !== null ? val : '';
            }
            return mapped;
          });

          this.validateWithBackend();
        } catch {
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل قراءة الملف. تأكد من صحة التنسيق' });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  validateWithBackend() {
    if (!this.parsedRows.length) return;
    this.isValidating.set(true);
    this.importService.validateItems(Number(this.selectedFacilityId), this.parsedRows).subscribe({
      next: (res) => {
        this.validationReport.set(res.data);

        // Initialize department mappings from validation report
        this.departmentMappings = res.data.departments.map((dept) => ({
          excelDepartmentName: dept.excelDepartmentName,
          mappedDepartmentId: dept.matchedDepartmentId,
          createNew: false,
        }));

        this.isValidating.set(false);
        this.currentStep.set(1);
        this.cdr.markForCheck();
        this.toast.add({
          severity: 'success',
          summary: 'تم التحقق',
          detail: `تم فحص ${res.data.summary.totalRecords} سجل بنجاح`,
        });
      },
      error: () => {
        this.isValidating.set(false);
        this.cdr.markForCheck();
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل التحقق من ملف Excel' });
      },
    });
  }

  // ── Step navigation ──────────────────────────────────────────────────────
  goToStep2() {
    const report = this.validationReport();
    if (!report) return;
    if (report.summary.validRecords === 0) {
      this.toast.add({ severity: 'warn', summary: 'لا يوجد سجلات صالحة', detail: 'لا يوجد أي سجل صالح لإرساله' });
      return;
    }
    this.currentStep.set(2);
  }

  goBackToStep1() {
    this.currentStep.set(1);
  }

  goToStep3() {
    // Validate all department mappings are resolved
    const unresolved = this.departmentMappings.filter(
      (m) => !m.createNew && !m.mappedDepartmentId
    );
    if (unresolved.length > 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'أقسام غير مطابقة',
        detail: `يجب مطابقة ${unresolved.length} قسم أو اختيار إنشائه كقسم جديد`,
      });
      return;
    }
    this.currentStep.set(3);
  }

  goBackToStep2() {
    this.currentStep.set(2);
  }

  // ── Mapping ──────────────────────────────────────────────────────────────
  onCreateNewToggle(mapping: DepartmentMapping) {
    if (mapping.createNew) {
      mapping.mappedDepartmentId = null;
    }
  }

  onDeptSelected(mapping: DepartmentMapping) {
    if (mapping.mappedDepartmentId) {
      mapping.createNew = false;
    }
  }

  // ── Submit Import ────────────────────────────────────────────────────────
  submitImport() {
    const report = this.validationReport();
    if (!report) return;

    const validRows = report.rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      this.toast.add({ severity: 'warn', summary: 'لا يوجد سجلات', detail: 'لا توجد سجلات صالحة للإرسال' });
      return;
    }

    this.isSubmitting.set(true);
    this.importService
      .createImportRequest(Number(this.selectedFacilityId), validRows, this.departmentMappings)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.add({
            severity: 'success',
            summary: 'تم الإرسال',
            detail: 'تم إرسال طلب الاستيراد بنجاح وهو بانتظار مراجعة مسؤول النظام',
          });
          // Reset
          this.parsedRows = [];
          this.validationReport.set(null);
          this.departmentMappings = [];
          this.currentStep.set(1);
          this.loadHistory();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل إرسال طلب الاستيراد' });
        },
      });
  }

  // ── Review dialog ────────────────────────────────────────────────────────
  openReviewDialog(request: ImportRequest, action: 'approve' | 'reject') {
    this.importService.getById(request.id).subscribe({
      next: (res) => {
        this.selectedReviewRequest.set(res.data);
        this.reviewAction = action;
        this.reviewerNotes = '';
        this.showReviewDialog.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  submitReview() {
    const req = this.selectedReviewRequest();
    if (!req) return;
    this.importService.reviewRequest(req.id, this.reviewAction, this.reviewerNotes).subscribe({
      next: () => {
        this.showReviewDialog.set(false);
        this.selectedReviewRequest.set(null);
        this.toast.add({
          severity: 'success',
          summary: this.reviewAction === 'approve' ? 'تمت الموافقة' : 'تم الرفض',
          detail:
            this.reviewAction === 'approve'
              ? 'تمت الموافقة على طلب الاستيراد وتطبيقه بنجاح'
              : 'تم رفض طلب الاستيراد',
        });
        this.loadPendingRequests();
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في مراجعة الطلب' });
      },
    });
  }

  closeReviewDialog() {
    this.showReviewDialog.set(false);
    this.selectedReviewRequest.set(null);
  }

  // ── Validation report helpers ────────────────────────────────────────────
  get filteredRows(): ImportRowResult[] {
    const report = this.validationReport();
    if (!report) return [];
    const tab = this.activeTab();
    if (tab === 'invalid') return report.rows.filter((r) => !r.isValid);
    if (tab === 'warnings') return report.rows.filter((r) => r.warnings.length > 0);
    return report.rows;
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return this.STATUS_SEVERITY_MAP[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    return this.STATUS_ARABIC_MAP[status] ?? status;
  }

  itemTypeLabel(type: string): string {
    return type === 'supply' ? 'مستلزمات طبية' : 'معدات وأجهزة';
  }

  itemTypeSeverity(type: string): 'success' | 'info' {
    return type === 'supply' ? 'success' : 'info';
  }

  requestStatusSeverity(status: string): 'warn' | 'success' | 'danger' {
    if (status === 'PENDING') return 'warn';
    if (status === 'APPROVED') return 'success';
    return 'danger';
  }

  requestStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'بانتظار المراجعة',
      APPROVED: 'تمت الموافقة',
      REJECTED: 'مرفوض',
    };
    return map[status] ?? status;
  }

  deptMatchSeverity(mapping: DepartmentMapping): 'success' | 'warn' {
    return mapping.mappedDepartmentId || mapping.createNew ? 'success' : 'warn';
  }

  deptMatchLabel(mapping: DepartmentMapping): string {
    if (mapping.createNew) return 'سيتم إنشاؤه';
    if (mapping.mappedDepartmentId) {
      const dept = this.dbDepartments.find((d) => d.id === mapping.mappedDepartmentId);
      return dept ? dept.departmentName : 'تم التطابق';
    }
    return 'غير مطابق';
  }

  getDeptName(id: number | null): string {
    if (!id) return '—';
    const dept = this.dbDepartments.find((d) => d.id === id);
    return dept ? dept.departmentName : `#${id}`;
  }

  resetUpload() {
    this.parsedRows = [];
    this.validationReport.set(null);
    this.departmentMappings = [];
    this.currentStep.set(1);
    this.cdr.markForCheck();
  }
}
