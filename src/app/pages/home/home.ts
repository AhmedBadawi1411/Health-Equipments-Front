import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DashboardService, IDashboardMetrics, IRecentActivity } from '../../services/dashboard';
import { AuthService } from '../../services/auth-service';
import { HealthcareService, Facility } from '../../services/healthcare.service';

const OPERATIONAL_STATUS_ARABIC: Record<string, string> = {
  'Fully Functional': 'يعمل بكفاءة',
  'Out of Service & Needs Maintenance': 'خارج الخدمة ويحتاج صيانة',
  'Functional & Needs Supplies': 'يعمل ويحتاج مستلزمات',
  'Functional but Inactive': 'يعمل ولكنه غير نشط',
  'Scrapped': 'تالف',
  'Unspecified': 'غير محدد',
};

const INVENTORY_STATUS_ARABIC: Record<string, string> = {
  'APPROVED': 'تمت الموافقة',
  'PENDING_APPROVAL': 'بانتظار الاستلام',
  'REJECTED': 'تم الرفض',
  'NOT_STARTED': 'لم تبدأ بعد',
};

@Component({
  selector: 'app-home',
  imports: [NgxEchartsDirective, CommonModule, FormsModule, Select],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  selectedRegionId: string | undefined = undefined;
  selectedFacilityId: number | undefined = undefined;
  statusCoverageNote: string = '';
  private liveSubscription: Subscription | null = null;

  today = new Date().toLocaleDateString('ar-LY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  kpiCards = [
    {
      title: 'إجمالي الجهات',
      value: '0',
      trend: '+12.5%',
      trendUp: true,
      trendText: 'من الشهر السابق',
      icon: 'pi-building',
      colorClass: 'kpi-blue',
    },
    {
      title: 'إجمالي الأصول',
      value: '0',
      trend: '+4.2%',
      trendUp: true,
      trendText: 'من الشهر السابق',
      icon: 'pi-desktop',
      colorClass: 'kpi-green',
    },
    {
      title: 'طلبات احتياج الأجهزة',
      value: '0',
      trend: '0%',
      trendUp: true,
      trendText: 'من الشهر السابق',
      icon: 'pi-file-edit',
      colorClass: 'kpi-amber',
    },
    {
      title: 'طلبات احتياج المستلزمات',
      value: '0',
      trend: '0%',
      trendUp: true,
      trendText: 'من الشهر السابق',
      icon: 'pi-shopping-bag',
      colorClass: 'kpi-orange',
    },
    {
      title: 'حملات الحصر',
      value: '0',
      trend: '+14.2%',
      trendUp: true,
      trendText: 'من الشهر السابق',
      icon: 'pi-clipboard',
      colorClass: 'kpi-purple',
    },
  ];

  recentActivities: IRecentActivity[] = [];
  simpleFacilities: Facility[] = [];

  constructor(
    private readonly router: Router,
    private readonly dashboardService: DashboardService,
    private readonly healthcareService: HealthcareService,
    private readonly cdr: ChangeDetectorRef,
    public readonly authService: AuthService,
  ) {}

  get regions() {
    const uniqueRegions = Array.from(
      new Set(this.simpleFacilities.map((f) => f.region).filter(Boolean)),
    );
    return uniqueRegions.map((r) => ({ regionName: r, regionID: r }));
  }

  get filteredFacilities() {
    if (this.selectedRegionId) {
      return this.simpleFacilities.filter((f) => f.region === this.selectedRegionId);
    }
    return this.simpleFacilities;
  }

  get showFilters(): boolean {
    const user = this.authService.user();
    if (!user) return false;
    if (user.roleId === '1') return true; // Admins always see filters
    return !!(user.facilities && user.facilities.length > 1);
  }

  ngOnInit() {
    this.healthcareService.getFacilities().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const user = this.authService.user();
          const roleName = (user?.role?.name || '').toLowerCase();
          const isAdmin =
            user?.roleId === '1' ||
            roleName === 'admin' ||
            roleName === 'مدير النظام' ||
            roleName === 'مدير' ||
            roleName.includes('admin') ||
            user?.email === 'admin@admin.com' ||
            user?.email === 'admin@healthcare.com';

          if (isAdmin) {
            this.simpleFacilities = res.data;
          } else {
            const allowedIds = (user?.facilities || []).map((f: any) => f.id);
            this.simpleFacilities = res.data.filter((f: any) => allowedIds.includes(f.id));
          }

          // Auto-scope non-admin single-facility users
          if (!isAdmin && user?.facilities && user.facilities.length === 1) {
            this.selectedFacilityId = user.facilities[0].id;
          }

          // Always load dashboard for all authenticated users
          this.subscribeToLiveUpdates();
          this.cdr.detectChanges();
        }
      },
    });
  }

  ngOnDestroy() {
    if (this.liveSubscription) {
      this.liveSubscription.unsubscribe();
    }
  }

  onRegionChange(regionId: string | undefined) {
    this.selectedRegionId = regionId;
    if (regionId && this.selectedFacilityId) {
      const facility = this.simpleFacilities.find((f) => f.id === this.selectedFacilityId);
      if (facility && facility.region !== regionId) {
        this.selectedFacilityId = undefined;
      }
    }
    this.subscribeToLiveUpdates();
  }

  onFacilityChange(facilityId: number | undefined) {
    this.selectedFacilityId = facilityId;
    this.subscribeToLiveUpdates();
  }

  subscribeToLiveUpdates() {
    if (this.liveSubscription) {
      this.liveSubscription.unsubscribe();
      this.liveSubscription = null;
    }

    // For non-admin users with single facility, auto-scope the dashboard
    const user = this.authService.user();
    const roleName = (user?.role?.name || '').toLowerCase();
    const isAdmin =
      user?.roleId === '1' ||
      roleName === 'admin' ||
      roleName === 'مدير النظام' ||
      roleName === 'مدير' ||
      roleName.includes('admin') ||
      user?.email === 'admin@admin.com' ||
      user?.email === 'admin@healthcare.com';
    const facilityId =
      this.selectedFacilityId ??
      (!isAdmin && user?.facilities?.length === 1 ? user.facilities[0].id : undefined);

    this.liveSubscription = this.dashboardService
      .getLiveUpdates(this.selectedRegionId, facilityId)
      .subscribe({
        next: (metrics) => {
          this.updateDashboardMetrics(metrics);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error in dashboard live updates subscription:', err);
        },
      });
  }

  updateDashboardMetrics(metrics: IDashboardMetrics) {
    // 1. Update KPIs
    this.kpiCards = [
      {
        ...this.kpiCards[0],
        value: metrics.kpis.totalFacilities.value.toLocaleString(),
        trend: metrics.kpis.totalFacilities.trend,
        trendUp: metrics.kpis.totalFacilities.trendUp,
      },
      {
        ...this.kpiCards[1],
        value: metrics.kpis.totalAssets.value.toLocaleString(),
        trend: metrics.kpis.totalAssets.trend,
        trendUp: metrics.kpis.totalAssets.trendUp,
      },
      {
        ...this.kpiCards[2],
        value: (metrics.kpis.equipmentNeedRequests?.value ?? 0).toLocaleString(),
        trend: metrics.kpis.equipmentNeedRequests?.trend ?? '0%',
        trendUp: metrics.kpis.equipmentNeedRequests?.trendUp ?? true,
      },
      {
        ...this.kpiCards[3],
        value: (metrics.kpis.consumablesNeedRequests?.value ?? 0).toLocaleString(),
        trend: metrics.kpis.consumablesNeedRequests?.trend ?? '0%',
        trendUp: metrics.kpis.consumablesNeedRequests?.trendUp ?? true,
      },
      {
        ...this.kpiCards[4],
        value: metrics.kpis.inventoryCampaigns.value.toLocaleString(),
        trend: metrics.kpis.inventoryCampaigns.trend,
        trendUp: metrics.kpis.inventoryCampaigns.trendUp,
      },
    ];

    // 2. Update Bar Chart
    const barLabels = (metrics.barChartData || []).map((d) => d.label);
    const barValues = (metrics.barChartData || []).map((d) => d.value);
    this.assetsBarChart = {
      ...this.assetsBarChart,
      xAxis: {
        ...(this.assetsBarChart.xAxis as any),
        data: barLabels,
      },
      series: [
        {
          ...(this.assetsBarChart.series as any)[0],
          data: barValues,
        },
      ],
    };

    // 3. Update Asset Operational Status Donut Chart
    const donutData = (metrics.inventoryDistribution || []).map((d) => ({
      name: OPERATIONAL_STATUS_ARABIC[d.name] || d.name,
      value: d.value,
      itemStyle: { color: d.color },
    }));
    this.assetStatusDonutChart = {
      ...this.assetStatusDonutChart,
      series: [
        {
          ...(this.assetStatusDonutChart.series as any)[0],
          data: donutData,
        },
      ],
    };

    // 3b. Update Facility Inventory Status Donut Chart
    const facilityDonutData = (metrics.inventoryStatusDistribution || []).map((d) => ({
      name: INVENTORY_STATUS_ARABIC[d.name] || d.name,
      value: d.value,
      itemStyle: { color: d.color },
    }));
    this.facilityInventoryStatusDonutChart = {
      ...this.facilityInventoryStatusDonutChart,
      series: [
        {
          ...(this.facilityInventoryStatusDonutChart.series as any)[0],
          data: facilityDonutData,
        },
      ],
    };

    // 4. Update Line Chart
    const lineLabels = (metrics.monthlyNeedRequests || []).map((d) => d.month);
    const eqLineValues = (metrics.monthlyNeedRequests || []).map((d) => d.equipmentCount ?? 0);
    const conLineValues = (metrics.monthlyNeedRequests || []).map((d) => d.consumablesCount ?? 0);
    this.requestsLineChart = {
      ...this.requestsLineChart,
      xAxis: {
        ...(this.requestsLineChart.xAxis as any),
        data: lineLabels,
      },
      series: [
        {
          ...(this.requestsLineChart.series as any)[0],
          data: eqLineValues,
        },
        {
          ...(this.requestsLineChart.series as any)[1],
          data: conLineValues,
        },
      ],
    };

    // 5. Update Gauge Chart
    this.gaugeChart = {
      ...this.gaugeChart,
      series: [
        {
          ...(this.gaugeChart.series as any)[0],
          data: [{ value: metrics.overallAssetAvailability ?? 0, name: 'معدل التوفر' }],
        },
      ],
    };

    const pct = metrics.statusCoveragePercentage ?? 0;
    const withStatus = metrics.equipmentWithStatusCount ?? 0;
    const totalEq = metrics.totalEquipmentCount ?? 0;
    if (totalEq > 0) {
      this.statusCoverageNote = `ملاحظة: النسبة المحسوبة مبنية على ${pct}% من الأجهزة المسجلة (${withStatus} من أصل ${totalEq} جهاز تم تحديد حالتها الفنية)`;
    } else {
      this.statusCoverageNote = '';
    }

    // 6. Update Recent Activities
    this.recentActivities = metrics.recentActivities || [];
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  // --- Bar Chart: Assets by Facility ---
  assetsBarChart: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: { rotate: 20, fontFamily: 'Alexandria' },
    },
    yAxis: { type: 'value', name: 'عدد الأصول' },
    series: [
      {
        name: 'الأصول',
        type: 'bar',
        barMaxWidth: 68,
        data: [],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#2C5EAD' },
              { offset: 1, color: '#1591DC' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  // --- Donut Chart: Asset Operational Status ---
  assetStatusDonutChart: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },

    legend: {
      orient: 'horizontal',
      right: 10,
      top: 'bottom',
      type: 'scroll',
      textStyle: { fontFamily: 'Alexandria' },
    },
    series: [
      {
        name: 'الحالة التشغيلية',
        type: 'pie',
        radius: ['35%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [],
      },
    ],
  };

  // --- Donut Chart: Facility Inventory Status ---
  facilityInventoryStatusDonutChart: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },

    legend: {
      orient: 'horizontal',
      right: 10,
      top: 'bottom',
      type: 'scroll',
      textStyle: { fontFamily: 'Alexandria' },
    },
    series: [
      {
        name: 'حالة الحصر',
        type: 'pie',
        radius: ['35%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [],
      },
    ],
  };

  // --- Line Chart: Monthly Need Requests ---
  requestsLineChart: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['احتياج الأجهزة', 'احتياج المستلزمات'],
      textStyle: { fontFamily: 'Alexandria' },
      right: 'center',
      top: 10,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLabel: { rotate: 30, fontFamily: 'Alexandria' },
    },
    yAxis: { type: 'value', name: 'الطلبات' },
    series: [
      {
        name: 'احتياج الأجهزة',
        type: 'line',
        smooth: true,
        data: [],
        lineStyle: { color: '#1975D2', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(25, 117, 210, 0.3)' },
              { offset: 1, color: 'rgba(25, 117, 210, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#1975D2' },
      },
      {
        name: 'احتياج المستلزمات',
        type: 'line',
        smooth: true,
        data: [],
        lineStyle: { color: '#F97316', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#F97316' },
      },
    ],
  };

  // --- Gauge Chart: Overall Asset Availability ---
  gaugeChart: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 5,
        progress: { show: true, roundCap: true, width: 18 },
        pointer: { show: true, length: '55%', width: 6 },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 18, color: [[1, '#e2e8f0']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { distance: 30, color: '#64748b', fontFamily: 'Alexandria', fontSize: 12 },
        anchor: { show: true, showAbove: true, size: 14, itemStyle: { color: '#1975D2' } },
        title: {
          show: true,
          offsetCenter: [0, '75%'],
          fontSize: 14,
          fontFamily: 'Alexandria',
          color: '#64748b',
        },
        detail: {
          valueAnimation: true,
          fontSize: 32,
          fontWeight: 'bold',
          formatter: '{value}%',
          color: '#1975D2',
          offsetCenter: [0, '40%'],
          fontFamily: 'Alexandria',
        },
        data: [],
        itemStyle: { color: '#1975D2' },
      },
    ],
  };
}
