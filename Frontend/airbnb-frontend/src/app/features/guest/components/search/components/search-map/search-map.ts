import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet'; // تأكد إنك منزل: npm install leaflet @types/leaflet
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-search-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-map.html',
  styleUrls: ['./search-map.css']
})
export class SearchMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() properties: Property[] = [];
  @Input() selectedPropertyId: string | null = null;
  @Output() propertySelect = new EventEmitter<Property>();
  @Output() mapBoundsChange = new EventEmitter<any>();

  private map!: L.Map;
  private markers: L.Marker[] = [];

  // للتحكم في ظهور اللودينج
  mapInitialized = false;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // تحديث العلامات عند تغير البيانات أو العقار المختار
    if ((changes['properties'] || changes['selectedPropertyId']) && this.map) {
      this.updateMarkers();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // 1. إنشاء الخريطة (بدون أزرار التحكم الافتراضية عشان هنستخدم أزرارك)
    this.map = L.map('map-container', {
      center: [30.0444, 31.2357], // القاهرة
      zoom: 13,
      zoomControl: false, // هنستخدم الأزرار المخصصة
      attributionControl: false
    });

    // 2. إضافة الطبقة (Tile Layer) - أهم خطوة عشان الخريطة تظهر
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    // 3. إخفاء اللودينج بعد التحميل
    setTimeout(() => {
      this.mapInitialized = true;
      this.map.invalidateSize(); // إعادة حساب الحجم للتأكد من الملء
    }, 500);

    this.updateMarkers();
  }

  private updateMarkers(): void {
    // مسح القديم
    this.markers.forEach(m => m.remove());
    this.markers = [];

    if (!this.properties || this.properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    this.properties.forEach(p => {
      if (p.location?.latitude && p.location?.longitude) {

        // تحديد هل هذا العقار هو المختار؟
        const isSelected = this.selectedPropertyId === p.id;

        // تصميم الكبسولة (السعر)
        const iconHtml = `
          <div class="price-marker ${isSelected ? 'selected' : ''}">
            ${p.price} <span class="currency">EGP</span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [null as any, 30], // Auto width
          iconAnchor: [20, 15]
        });

        const marker = L.marker([p.location.latitude, p.location.longitude], { icon: customIcon })
          .addTo(this.map)
          .on('click', () => {
            this.propertySelect.emit(p);
          });

        // رفع الـ z-index للعنصر المختار
        if (isSelected) {
          marker.setZIndexOffset(1000);
        }

        this.markers.push(marker);
        bounds.extend([p.location.latitude, p.location.longitude]);
      }
    });

    // توجيه الكاميرا لتشمل كل العلامات
    if (this.markers.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // --- دوال التحكم المخصصة (لأزرار الـ HTML) ---

  zoomIn(): void {
    if (this.map) this.map.zoomIn();
  }

  zoomOut(): void {
    if (this.map) this.map.zoomOut();
  }

  centerOnProperty(property: Property): void {
    if (this.map && property.location) {
      this.map.setView(
        [property.location.latitude, property.location.longitude],
        15,
        { animate: true }
      );
    }
  }

  highlightMarker(id: string): void {
    // يمكن إضافة لوجيك هنا لتغيير لون الماركر عند الوقوف عليه بالماوس
  }
}
