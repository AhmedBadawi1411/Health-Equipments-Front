import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Subscription } from 'rxjs';
import { DashboardService, IDashboardMetrics, IRecentActivity } from '../../services/dashboard';
import { FacilitiesSerive } from '../../services/facilities';

@Component({
  selector: 'app-home',
  imports: [NgxEchartsDirective, CommonModule, FormsModule, Select],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  selectedRegionId: number | undefined = undefined;
  selectedFacilityId: number | undefined = undefined;
  private liveSubscription: Subscription | null = null;

  today = new Date().toLocaleDateString('ar-LY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
      title: 'طلبات الاحتياج',
      value: '0',
      trend: '-8.3%',
      trendUp: false,
      trendText: 'من الشهر السابق',
      icon: 'pi-file-edit',
      colorClass: 'kpi-amber',
    },
    {
      title: 'حملات الجرد',
      value: '0',
      trend: '+14.2%',
      trendUp: true,
      trendText: 'من الشهر السابق',
      icon: 'pi-clipboard',
      colorClass: 'kpi-purple',
    },
  ];

  recentActivities: IRecentActivity[] = [];

  constructor(
    private readonly router: Router,
    private readonly dashboardService: DashboardService,
    private readonly facilitiesService: FacilitiesSerive,
    private readonly cdr:ChangeDetectorRef
  ) {}

  get regions() {
    return this.facilitiesService.regions();
  }

  get filteredFacilities() {
    const all = this.facilitiesService.facilities();
    if (this.selectedRegionId) {
      return all.filter((f) => f.regionID === this.selectedRegionId || (f as any).RegionID === this.selectedRegionId);
    }
    return all;
  }

  ngOnInit() {
    this.facilitiesService.loadRegions();
    this.facilitiesService.loadFacilities(true);
    this.subscribeToLiveUpdates();
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.liveSubscription) {
      this.liveSubscription.unsubscribe();
    }
  }

  onRegionChange(regionId: number | undefined) {
    this.selectedRegionId = regionId;
    if (regionId && this.selectedFacilityId) {
      const facility = this.facilitiesService.facilities().find((f) => f.facilityID === this.selectedFacilityId);
      if (facility && facility.regionID !== regionId && (facility as any).RegionID !== regionId) {
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

    this.liveSubscription = this.dashboardService
      .getLiveUpdates(this.selectedRegionId, this.selectedFacilityId)
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
        value: metrics.kpis.totalFacilities.toLocaleString(),
      },
      {
        ...this.kpiCards[1],
        value: metrics.kpis.totalAssets.toLocaleString(),
      },
      {
        ...this.kpiCards[2],
        value: metrics.kpis.needRequests.toLocaleString(),
      },
      {
        ...this.kpiCards[3],
        value: metrics.kpis.inventoryCampaigns.toLocaleString(),
      },
    ];

    // 2. Update Bar Chart
    const barLabels = metrics.barChartData.map((d) => d.label);
    const barValues = metrics.barChartData.map((d) => d.value);
    this.assetsBarChart = {
      ...this.assetsBarChart,
      xAxis: {
        ...this.assetsBarChart.xAxis as any,
        data: barLabels,
      },
      series: [
        {
          ...(this.assetsBarChart.series as any)[0],
          data: barValues,
        },
      ],
    };

    // 3. Update Donut Chart
    const donutData = metrics.inventoryDistribution.map((d) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: d.color },
    }));
    this.inventoryDonutChart = {
      ...this.inventoryDonutChart,
      series: [
        {
          ...(this.inventoryDonutChart.series as any)[0],
          data: donutData,
        },
      ],
    };

    // 4. Update Line Chart
    const lineLabels = metrics.monthlyNeedRequests.map((d) => d.month);
    const lineValues = metrics.monthlyNeedRequests.map((d) => d.count);
    this.requestsLineChart = {
      ...this.requestsLineChart,
      xAxis: {
        ...this.requestsLineChart.xAxis as any,
        data: lineLabels,
      },
      series: [
        {
          ...(this.requestsLineChart.series as any)[0],
          data: lineValues,
        },
      ],
    };

    // 5. Update Gauge Chart
    this.gaugeChart = {
      ...this.gaugeChart,
      series: [
        {
          ...(this.gaugeChart.series as any)[0],
          data: [{ value: metrics.overallAssetAvailability, name: 'معدل التوفر' }],
        },
      ],
    };

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
            x: 0, y: 0, x2: 0, y2: 1,
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

  // --- Donut Chart: Inventory Status ---
  inventoryDonutChart: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { fontFamily: 'Alexandria' },
    },
    series: [
      {
        name: 'حالة الجرد',
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
        name: 'طلبات الاحتياج',
        type: 'line',
        smooth: true,
        data: [],
        lineStyle: { color: '#1975D2', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
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
        title: { show: true, offsetCenter: [0, '75%'], fontSize: 14, fontFamily: 'Alexandria', color: '#64748b' },
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
