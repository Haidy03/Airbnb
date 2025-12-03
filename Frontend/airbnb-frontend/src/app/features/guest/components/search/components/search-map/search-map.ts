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
  @Output() mapBackgroundClick = new EventEmitter<void>();


  private map!: L.Map;
  private markers: L.Marker[] = [];


  mapInitialized = false;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
 
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

    this.map = L.map('map-container', {
      center: [30.0444, 31.2357],
      zoom: 13,
      zoomControl: false, 
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', () => {
      this.mapBackgroundClick.emit();
    });


    setTimeout(() => {
      this.mapInitialized = true;
      this.map.invalidateSize(); 
    }, 500);

    this.updateMarkers();
  }

  private updateMarkers(): void {

    this.markers.forEach(m => m.remove());
    this.markers = [];

    if (!this.properties || this.properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    this.properties.forEach(p => {
      if (p.location?.latitude && p.location?.longitude) {

    
        const isSelected = this.selectedPropertyId === p.id;

    
        const iconHtml = `
          <div class="price-marker ${isSelected ? 'selected' : ''}">
            ${p.price} <span class="currency">EGP</span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [null as any, 30],
          iconAnchor: [20, 15]
        });

        const marker = L.marker([p.location.latitude, p.location.longitude], { icon: customIcon })
          .addTo(this.map)
          .on('click', (e) => {
         
            L.DomEvent.stopPropagation(e); 
            this.propertySelect.emit(p);
          });

        if (isSelected) {
          marker.setZIndexOffset(1000);
        }

        this.markers.push(marker);
        bounds.extend([p.location.latitude, p.location.longitude]);
      }
    });


    if (this.markers.length > 0 && !this.selectedPropertyId) {
       this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }


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
   
  }
}
