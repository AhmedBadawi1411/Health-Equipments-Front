import { AfterViewInit, Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { HealthcareService, Facility, Inventory } from '../../services/healthcare.service';
import { HttpClient } from '@angular/common/http';

// ─────────────────────────────────────────────
// Leaflet plugins (imported as side effects)
// npm install leaflet.heat leaflet.markercluster
// ─────────────────────────────────────────────

type ColorMode = 'status' | 'type' | 'region';

// ──────────────── colour constants ───────────────────────────────────────────
const STATUS_COLORS: Record<string, { color: string; label: string; border: string }> = {
  NOT_STARTED: { color: '#ef4444', label: 'لم يبدأ بعد', border: '#dc2626' },
  PENDING_APPROVAL: { color: '#f59e0b', label: 'بانتظار الاستلام', border: '#d97706' },
  APPROVED: { color: '#10b981', label: 'تمت الموافقة', border: '#059669' },
};

const TYPE_COLORS: Record<string, { color: string; border: string }> = {
  'مشفي': { color: '#e11d48', border: '#be123c' },
  'Hospital': { color: '#e11d48', border: '#be123c' },
  'مركز صحي / عيادة مجمعة': { color: '#0891b2', border: '#0e7490' },
  'Health Center': { color: '#0891b2', border: '#0e7490' },
  'مكتب خدمات صحية': { color: '#7c3aed', border: '#6d28d9' },
  'Clinic': { color: '#7c3aed', border: '#6d28d9' },
  'Dispensary': { color: '#ea580c', border: '#c2410c' },
};

const REGION_PALETTE = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#ca8a04',
  '#0f766e',
  '#9333ea',
];

// ──────────────── Leaflet.heat / MarkerCluster type stubs ─────────────────────
// (Real types live in @types/leaflet.heat and @types/leaflet.markercluster)
interface LeafletHeat {
  addTo(map: L.Map): void;
  removeFrom(map: L.Map): void;
  remove(): void;
}

@Component({
  selector: 'app-spatial-analysis',
  imports: [CommonModule, FormsModule, Select],
  templateUrl: './spatial-analysis.html',
  styleUrl: './spatial-analysis.css',
})
export class SpatialAnalysis implements OnInit, AfterViewInit, OnDestroy {
  // ─── map state ─────────────────────────────────────────────────────────────
  private map!: L.Map;
  private markerLayers: L.LayerGroup = L.layerGroup();
  private heatLayer: any = null;
  private clusterGroup: any = null;
  private bufferLayers: L.LayerGroup = L.layerGroup();
  private gapLayers: L.LayerGroup = L.layerGroup();
  private nearestLayers: L.LayerGroup = L.layerGroup();
  private centroidLayer: L.LayerGroup = L.layerGroup();

  private regionColorMap = new Map<string, string>();

  // ─── ui state ──────────────────────────────────────────────────────────────
  colorMode = signal<ColorMode>('status');

  selectedRegionFilter: string | null = null;
  selectedTypeFilter: string | null = null;
  selectedStatusFilter: string | null = null;

  // analytics toggles
  showHeatmap = false;
  showClusters = false;
  showBuffers = false;
  showGaps = false;
  showNearest = false;
  showCentroid = false;

  heatmapRadius = 35;
  heatmapBlur = 25;

  bufferRadiusKm = 10;

  // sidebar panels
  activePanel: 'filters' | 'analytics' | 'legend' = 'filters';

  // ─── dropdown data ─────────────────────────────────────────────────────────
  colorModeOptions = [
    { label: 'حسب حالة الحصر', value: 'status' },
    { label: 'حسب نوع المرفق', value: 'type' },
    { label: 'حسب المنطقة', value: 'region' },
  ];

  statusOptions = [
    { label: 'الكل', value: null },
    { label: 'لم يبدأ بعد', value: 'NOT_STARTED' },
    { label: 'بانتظار الاستلام', value: 'PENDING_APPROVAL' },
    { label: 'تمت الموافقة', value: 'APPROVED' },
  ];

  facilities = signal<Facility[]>([]);
  simpleInventories = signal<Inventory[]>([]);

  constructor(
    public readonly healthcareService: HealthcareService,
    private readonly http: HttpClient,
  ) {}

  // ─── lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.healthcareService.getFacilities().subscribe(res => {
      if (res.success && res.data) {
        this.facilities.set(res.data);
      }
    });
    this.healthcareService.getInventory().subscribe(res => {
      if (res.success && res.data) {
        this.simpleInventories.set(res.data);
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    // 1. Expose L on window FIRST
    (window as any)['L'] = L;
    // 2. NOW load plugins — they will find window.L and attach themselves
    await import('leaflet.heat');
    await import('leaflet.markercluster');
    // 3. Init map after plugins are registered
    this.initMap();
    const iv = setInterval(() => {
      if (this.facilities().length > 0) {
        this.renderMarkers();
        clearInterval(iv);
      }
    }, 300);
    setTimeout(() => clearInterval(iv), 8000);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  // ─── map init ──────────────────────────────────────────────────────────────
  private initMap(): void {
    this.map = L.map('map', {
      center: [28.5, 16.5],
      zoom: 7,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer(
      'https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}.jpg?key=Vn2msMKcNgIrOkz1Tspd',
      { maxZoom: 19, attribution: '© MapTiler © OpenStreetMap' },
    ).addTo(this.map);

    this.markerLayers.addTo(this.map);
    this.bufferLayers.addTo(this.map);
    this.gapLayers.addTo(this.map);
    this.nearestLayers.addTo(this.map);
    this.centroidLayer.addTo(this.map);
  }

  // ─── colour helpers ────────────────────────────────────────────────────────
  private getFacilityColor(f: Facility): { color: string; border: string } {
    const mode = this.colorMode();
    if (mode === 'status') {
      const s = STATUS_COLORS[f.inventoryStatus];
      return s ?? { color: '#6b7280', border: '#4b5563' };
    }
    if (mode === 'type') {
      return TYPE_COLORS[f.facilityLevel] ?? { color: '#6b7280', border: '#4b5563' };
    }
    if (!this.regionColorMap.has(f.region)) {
      const idx = this.regionColorMap.size % REGION_PALETTE.length;
      this.regionColorMap.set(f.region, REGION_PALETTE[idx]);
    }
    const c = this.regionColorMap.get(f.region)!;
    return { color: c, border: c };
  }

  private createMarkerIcon(color: string, border: string, count: number): L.DivIcon {
    const size = count > 50 ? 38 : count > 20 ? 32 : 26;
    return L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;
        background:${color};border:3px solid ${border};
        border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5);
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:${size > 30 ? 11 : 9}px;color:#fff;cursor:pointer;
      ">${count > 0 ? count : ''}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // ─── filtered facilities ───────────────────────────────────────────────────
  private getFilteredFacilities(): Facility[] {
    let list = this.facilities().filter((f) => f.lat && f.lng);
    if (this.selectedRegionFilter)
      list = list.filter((f) => f.region === this.selectedRegionFilter);
    if (this.selectedTypeFilter)
      list = list.filter((f) => f.facilityLevel === this.selectedTypeFilter);
    if (this.selectedStatusFilter)
      list = list.filter((f) => f.inventoryStatus === this.selectedStatusFilter);
    return list;
  }

  private assetCountMap(): Map<number, number> {
    const m = new Map<number, number>();
    for (const inv of this.simpleInventories()) {
      const fid = inv.facilityId;
      const count = inv.items?.length ?? 0;
      m.set(fid, (m.get(fid) ?? 0) + count);
    }
    return m;
  }

  // ─── basic markers ─────────────────────────────────────────────────────────
  renderMarkers(): void {
    if (!this.map) return;
    this.markerLayers.clearLayers();
    const facilities = this.getFilteredFacilities();
    const assetCounts = this.assetCountMap();

    for (const f of facilities) {
      const { color, border } = this.getFacilityColor(f);
      const assetCount = assetCounts.get(f.id) ?? 0;
      const icon = this.createMarkerIcon(color, border, assetCount);
      const regionName = f.region || '-';
      const statusInfo = STATUS_COLORS[f.inventoryStatus];

      const popup = `
        <div style="rtl! font-family:'Cairo',sans-serif;direction:rtl;min-width:220px;padding:4px;">
          <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:6px;">${f.facilityName}</div>
          <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;color:#475569;">
            <div><b>النوع:</b> ${f.facilityLevel}</div>
            <div><b>المنطقة:</b> ${regionName}</div>
            <div><b>العنوان:</b> ${f.director || '-'}</div>
            <div><b>السعة السريرية:</b> ${f.bedCapacity} سرير</div>
            <div><b>الأصول الطبية:</b> ${assetCount} جهاز</div>
            <div style="margin-top:4px;">
              <span style="background:${statusInfo?.color ?? '#6b7280'};color:#fff;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">
                ${statusInfo?.label ?? f.inventoryStatus}
              </span>
            </div>
          </div>
        </div>`;

      L.marker([f.lat!, f.lng!], { icon })
        .bindPopup(popup, { maxWidth: 280 })
        .addTo(this.markerLayers);
    }

    // re-render active analytics
    if (this.showHeatmap) this.toggleHeatmap(true);
    if (this.showClusters) this.toggleClusters(true);
    if (this.showBuffers) this.renderBuffers();
    if (this.showGaps) this.renderGapAnalysis();
    if (this.showNearest) this.renderNearestLinks();
    if (this.showCentroid) this.renderCentroid();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. HEATMAP  — leaflet.heat
  //    npm install leaflet.heat  /  import 'leaflet.heat';
  // ════════════════════════════════════════════════════════════════════════════
  toggleHeatmap(on: boolean): void {
    this.showHeatmap = on;
    if (this.heatLayer) {
      this.heatLayer.remove();
      this.heatLayer = null;
    }
    if (!on) return;

    const facilities = this.getFilteredFacilities();
    const assetCounts = this.assetCountMap();
    const maxAssets = Math.max(...facilities.map((f) => assetCounts.get(f.id) ?? 0), 1);

    const points = facilities.map(
      (f) =>
        [
          f.lat!,
          f.lng!,
          (assetCounts.get(f.id) ?? 0) / maxAssets, // normalised intensity 0-1
        ] as [number, number, number],
    );

    const hasAssets = points.some((p) => p[2] > 0);
    const heatPoints = hasAssets
      ? points
      : points.map((p) => [p[0], p[1], 1] as [number, number, number]);

    // تم ربط الخصائص هنا بالمتغيرات الديناميكية 👈
    this.heatLayer = (window as any)['L']
      .heatLayer(heatPoints, {
        radius: this.heatmapRadius,
        blur: this.heatmapBlur,
        minOpacity: 0.6,
        max: 1.0,
        gradient: {
          0.2: '#1a237e',
          0.4: '#0288d1',
          0.6: '#26a69a',
          0.8: '#f9a825',
          1.0: '#c62828',
        },
      })
      .addTo(this.map);
  }

  onHeatmapParamChange(): void {
    if (this.showHeatmap) {
      this.toggleHeatmap(true);
    }
  }
  
  // ════════════════════════════════════════════════════════════════════════════
  // 2. MARKER CLUSTERING  — leaflet.markercluster
  //    npm install leaflet.markercluster  /  import 'leaflet.markercluster';
  // ════════════════════════════════════════════════════════════════════════════
  toggleClusters(on: boolean): void {
    this.showClusters = on;
    if (this.clusterGroup) {
      this.map.removeLayer(this.clusterGroup);
      this.clusterGroup = null;
      // Restore individual markers
      if (!this.map.hasLayer(this.markerLayers)) {
        this.markerLayers.addTo(this.map);
      }
    }
    if (!on) return;

    const facilities = this.getFilteredFacilities();
    const assetCounts = this.assetCountMap();

    this.clusterGroup = (window as any)['L'].markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      // Custom cluster icon showing total assets + facility count
      iconCreateFunction: (cluster: any) => {
        const markers = cluster.getAllChildMarkers();
        const totalAssets = markers.reduce((sum: number, m: any) => {
          const fid = m.options['_fid'] as number | undefined;
          return sum + (fid ? (assetCounts.get(fid) ?? 0) : 0);
        }, 0);
        const count = markers.length;
        const size = count > 20 ? 54 : count > 10 ? 46 : 38;
        return L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:rgba(37,99,235,.88);
            border:3px solid #1d4ed8;
            border-radius:50%;
            box-shadow:0 0 0 4px rgba(37,99,235,.25);
            display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            color:#fff;cursor:pointer;
          ">
            <span style="font-size:${size > 46 ? 13 : 11}px;font-weight:700;line-height:1">${count}</span>
            <span style="font-size:9px;opacity:.85">${totalAssets} جهاز</span>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    for (const f of facilities) {
      const { color, border } = this.getFacilityColor(f);
      const assetCount = assetCounts.get(f.id) ?? 0;
      const icon = this.createMarkerIcon(color, border, assetCount);
      const marker = L.marker([f.lat!, f.lng!], { icon, _fid: f.id } as any);
      marker.bindPopup(f.facilityName);
      this.clusterGroup.addLayer(marker);
    }

    this.map.addLayer(this.clusterGroup);
    // Hide individual markers — cluster replaces them
    this.map.removeLayer(this.markerLayers);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. SERVICE BUFFERS  — turf.circle
  //    Draws radius circles around each facility showing theoretical coverage.
  // ════════════════════════════════════════════════════════════════════════════
  renderBuffers(): void {
    this.bufferLayers.clearLayers();
    if (!this.showBuffers) return;

    const facilities = this.getFilteredFacilities();
    const assetCounts = this.assetCountMap();

    for (const f of facilities) {
      const assetCount = assetCounts.get(f.id) ?? 0;
      const radius = this.bufferRadiusKm;
      const { color } = this.getFacilityColor(f);

      const circle = turf.circle([f.lng!, f.lat!], radius, {
        steps: 64,
        units: 'kilometers',
      });

      // Opacity scales with asset density (more assets → more opaque zone)
      const opacity = Math.min(0.08 + (assetCount / 100) * 0.22, 0.4);

      L.geoJSON(circle, {
        style: {
          color,
          weight: 2.5,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: opacity,
          dashArray: '4 4',
        },
      })
        .bindTooltip(
          `<div style="font-family:'Cairo',sans-serif;direction:rtl;font-size:12px;">
          <b>${f.facilityName}</b><br>
          نطاق الخدمة: ${radius} كم<br>
          الأصول: ${assetCount} جهاز
        </div>`,
          { sticky: true },
        )
        .addTo(this.bufferLayers);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. GAP ANALYSIS  — turf.voronoi
  //    Builds Voronoi polygons coloured by inventory status to reveal
  //    geographic "responsibility zones" and under-served areas.
  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // 4. GAP ANALYSIS  — turf.voronoi (WITH CLIPPING & AREA CALCULATION)
  // ════════════════════════════════════════════════════════════════════════════
  renderGapAnalysis(): void {
    this.gapLayers.clearLayers();
    if (!this.showGaps) return;

    const facilities = this.getFilteredFacilities();
    if (facilities.length < 3) return; // Voronoi needs ≥3 points

    this.http.get('data/geoBoundaries-LBY-ADM0_simplified.geojson').subscribe({
      next: (libyaGeoJSON: any) => {
        const libyaPolygon = libyaGeoJSON.features ? libyaGeoJSON.features[0] : libyaGeoJSON;
        if (!libyaPolygon) return;

        const points = turf.featureCollection(
          facilities.map((f) =>
            turf.point([f.lng!, f.lat!], {
              status: f.inventoryStatus,
              name: f.facilityName,
              fid: f.id,
            }),
          ),
        );

        const bbox = turf.bbox(libyaPolygon);

        const voronoi = turf.voronoi(points, { bbox: bbox });
        if (!voronoi) return;

        voronoi.features.forEach((poly, i) => {
          const props = facilities[i];
          if (!props) return;

          const statusInfo = STATUS_COLORS[props.inventoryStatus];
          const color = statusInfo?.color ?? '#6b7280';

          const clippedCell = turf.intersect(turf.featureCollection([poly, libyaPolygon]));

          if (clippedCell) {
            const areaInSquareMeters = turf.area(clippedCell);

            const areaInSquareKm = areaInSquareMeters / 1000000;

            L.geoJSON(clippedCell, {
              style: {
                color: color,
                weight: 1.5,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.35,
              },
            })
              .bindTooltip(
                `<div style="font-family:'Alexandria', sans-serif; direction:rtl; text-align:right; font-size:12px; padding:4px; line-height: 1.6;">
                <b style="font-size:13px; color:#1e293b;">نطاق مسؤولية جغرافية:</b><br>
                <b>المرفق:</b> ${props.facilityName}<br>
                <b>حالة الحصر:</b> <span style="color:${color}; font-weight:bold;">${statusInfo?.label ?? props.inventoryStatus}</span><br>
                <hr style="margin: 4px 0; border: 0; border-top: 1px solid #e2e8f0;">
                <b>المساحة المغطاة:</b> <span style="color:#2563eb; font-weight:bold;">${Math.round(areaInSquareKm).toLocaleString()}</span> كم²
              </div>`,
                { sticky: true },
              )
              .addTo(this.gapLayers);
          }
        });
      },
      error: (err) => {
        console.error('فشل في تحميل ملف GeoJSON الخاص بالحدود الجغرافية لليبيا:', err);
      },
    });
  }
  // ════════════════════════════════════════════════════════════════════════════
  // 5. NEAREST FACILITY LINKS  — turf.nearestPoint
  //    For each facility, draws a line to its nearest neighbour,
  //    revealing isolated facilities needing reinforcement.
  // ════════════════════════════════════════════════════════════════════════════
  renderNearestLinks(): void {
    this.nearestLayers.clearLayers();
    if (!this.showNearest) return;

    const facilities = this.getFilteredFacilities();
    if (facilities.length < 2) return;

    const points = turf.featureCollection(
      facilities.map((f) =>
        turf.point([f.lng!, f.lat!], { name: f.facilityName, fid: f.id }),
      ),
    );

    facilities.forEach((f, idx) => {
      // Build a collection excluding self
      const others = turf.featureCollection(points.features.filter((_, i) => i !== idx));
      const nearest = turf.nearestPoint(turf.point([f.lng!, f.lat!]), others);
      const dist = turf.distance(turf.point([f.lng!, f.lat!]), nearest, { units: 'kilometers' });

      const line = turf.lineString([
        [f.lng!, f.lat!],
        nearest.geometry.coordinates as [number, number],
      ]);

      // Colour: red if isolated (>50 km), amber if moderate, green if close
      const linkColor = dist > 50 ? '#ef4444' : dist > 25 ? '#f59e0b' : '#10b981';

      L.geoJSON(line, {
        style: {
          color: linkColor,
          weight: 3.5,
          opacity: 0.8,
          dashArray: '6 4',
        },
      })
        .bindTooltip(
          `<div style="font-family:'Cairo',sans-serif;direction:rtl;font-size:12px;">
          ${f.facilityName} - ${nearest.properties?.['name']}<br>
          <b>المسافة:</b> ${dist.toFixed(1)} كم
        </div>`,
          { sticky: true },
        )
        .addTo(this.nearestLayers);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. REGIONAL CENTROID  — turf.centroid
  //    Computes and marks the geographic centre of mass per region.
  // ════════════════════════════════════════════════════════════════════════════
  renderCentroid(): void {
    this.centroidLayer.clearLayers();
    if (!this.showCentroid) return;

    const facilities = this.getFilteredFacilities();

    // Group by region string
    const byRegion = new Map<string, Facility[]>();
    for (const f of facilities) {
      if (!byRegion.has(f.region)) byRegion.set(f.region, []);
      byRegion.get(f.region)!.push(f);
    }

    byRegion.forEach((facs, regionName) => {
      if (facs.length === 0) return;

      const fc = turf.featureCollection(facs.map((f) => turf.point([f.lng!, f.lat!])));
      const ctr = turf.centroid(fc);
      const [lng, lat] = ctr.geometry.coordinates;

      // Star-shaped centroid marker
      if (!this.regionColorMap.has(regionName)) {
        const idx = this.regionColorMap.size % REGION_PALETTE.length;
        this.regionColorMap.set(regionName, REGION_PALETTE[idx]);
      }
      const color = this.regionColorMap.get(regionName)!;
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:34px;height:34px;
          background:${color};
          border:3px solid #fff;
          border-radius:4px;
          transform:rotate(45deg);
          box-shadow:0 2px 8px rgba(0,0,0,.5);
        "></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([lat, lng], { icon })
        .bindPopup(
          `<div style="font-family:'Cairo',sans-serif;direction:rtl;font-size:12px;">
            <b>مركز ثقل المنطقة</b><br>
            ${regionName}<br>
            عدد الجهات: ${facs.length}
          </div>`,
        )
        .addTo(this.centroidLayer);

      // Draw convex hull if ≥4 facilities
      if (facs.length >= 4) {
        const hull = turf.convex(fc);
        if (hull) {
          L.geoJSON(hull, {
            style: {
              color,
              weight: 1.5,
              opacity: 0.5,
              fillColor: color,
              fillOpacity: 0.06,
              dashArray: '8 4',
            },
          }).addTo(this.centroidLayer);
        }
      }
    });
  }

  // ─── filter / mode change handlers ─────────────────────────────────────────
  onFilterChange(): void {
    this.renderMarkers();
  }
  onColorModeChange(mode: any): void {
    this.colorMode.set(mode as ColorMode);
    this.regionColorMap.clear();
    this.renderMarkers();
  }

  // ─── analytics toggles ─────────────────────────────────────────────────────
  onHeatmapToggle(): void {
    this.toggleHeatmap(this.showHeatmap);
  }
  onClusterToggle(): void {
    this.toggleClusters(this.showClusters);
  }
  onBuffersToggle(): void {
    this.renderBuffers();
  }
  onGapsToggle(): void {
    this.renderGapAnalysis();
  }
  onNearestToggle(): void {
    this.renderNearestLinks();
  }
  onCentroidToggle(): void {
    this.renderCentroid();
  }
  onBufferRadiusChange(): void {
    if (this.showBuffers) this.renderBuffers();
  }

  // ─── quick stats for analytics sidebar ────────────────────────────────────
  get avgAssetsPerFacility(): number {
    const facs = this.facilities();
    if (!facs.length) return 0;
    const total = this.simpleInventories().reduce((sum, inv) => sum + (inv.items?.length ?? 0), 0);
    return Math.round(total / facs.length);
  }

  get mostIsolatedFacility(): string {
    const facilities = this.getFilteredFacilities();
    if (facilities.length < 2) return '-';
    let maxDist = 0;
    let name = '-';
    const pts = turf.featureCollection(facilities.map((f) => turf.point([f.lng!, f.lat!])));
    facilities.forEach((f, i) => {
      const others = turf.featureCollection(pts.features.filter((_, j) => j !== i));
      const nearest = turf.nearestPoint(turf.point([f.lng!, f.lat!]), others);
      const d = turf.distance(turf.point([f.lng!, f.lat!]), nearest, { units: 'kilometers' });
      if (d > maxDist) {
        maxDist = d;
        name = f.facilityName;
      }
    });
    return `${name} (${maxDist.toFixed(0)} كم)`;
  }

  get facilitiesWithoutCoverage(): number {
    // Facilities with 0 assets = no coverage
    const counts = this.assetCountMap();
    return this.getFilteredFacilities().filter((f) => (counts.get(f.id) ?? 0) === 0).length;
  }

  // ─── existing stats ─────────────────────────────────────────────────────────
  get totalFacilities() {
    return this.facilities().length;
  }
  get facilitiesWithCoords() {
    return this.facilities().filter((f) => f.lat && f.lng).length;
  }
  get approvedCount() {
    return this.facilities().filter((f) => f.inventoryStatus === 'APPROVED').length;
  }
  get inProgressCount() {
    return this.facilities().filter((f) => f.inventoryStatus === 'PENDING_APPROVAL').length;
  }
  get notStartedCount() {
    return this.facilities().filter((f) => f.inventoryStatus === 'NOT_STARTED').length;
  }

  get facilityTypeOptions() {
    const types = [...new Set(this.facilities().map((f) => f.facilityLevel).filter(Boolean))];
    return [{ label: 'الكل', value: null }, ...types.map((t) => ({ label: t, value: t }))];
  }
  get regionOptions() {
    const uniqueRegions = Array.from(new Set(this.facilities().map(f => f.region).filter(Boolean)));
    return [
      { label: 'الكل', value: null },
      ...uniqueRegions.map(r => ({ label: r, value: r }))
    ];
  }

  get statusLegend() {
    return Object.entries(STATUS_COLORS).map(([k, v]) => ({ key: k, ...v }));
  }
  get typeLegend() {
    return Object.entries(TYPE_COLORS).map(([k, v]) => ({ key: k, ...v }));
  }

  fitBounds(): void {
    const facs = this.facilities().filter((f) => f.lat && f.lng);
    if (!facs.length || !this.map) return;
    this.map.fitBounds(L.latLngBounds(facs.map((f) => [f.lat!, f.lng!])), { padding: [40, 40] });
  }
}
