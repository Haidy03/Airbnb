// src/app/features/guest/components/search/components/search-map/search-map.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Standalone: Add CommonModule imports
import { Property } from '../../models/property.model';

declare var google: any;

@Component({
  selector: 'app-search-map',
  standalone: true, // IMPORTANT: Converted to Standalone
  imports: [
    CommonModule // Standalone imports
  ],
  templateUrl: './search-map.html',
  styleUrls: ['./search-map.css']
})
export class SearchMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() properties: Property[] = [];
  @Input() selectedPropertyId: string | null = null;
  @Output() propertySelect = new EventEmitter<Property>();
  @Output() mapBoundsChange = new EventEmitter<any>();

  map: any;
  markers: Map<string, any> = new Map();
  infoWindow: any;
  mapInitialized = false;

  ngOnInit(): void {
    this.loadGoogleMapsScript(); // Load map scripts
  }

  ngAfterViewInit(): void {
    // Initialization done after script loads
  }

  ngOnDestroy(): void {
    // Cleanup map markers
    this.markers.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    this.markers.clear();
  }

  loadGoogleMapsScript(): void {
    // Check if map is initialized
    if (typeof google !== 'undefined' && google.maps) {
      this.initializeMap();
      return;
    }
    this.loadLeafletScript(); // Load Leaflet for demo
  }

  loadLeafletScript(): void {
    // Dynamically loads Leaflet CSS and JS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      this.initializeLeafletMap(); // Initialize after script load
    };
    document.head.appendChild(script);
  }

  initializeLeafletMap(): void {
    const L = (window as any).L;
    const defaultCenter = [30.0444, 31.2357];

    this.map = L.map('map-container').setView(defaultCenter, 12); // Initialize map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.mapInitialized = true;

    if (this.properties.length > 0) {
      this.updateMarkers();
      this.fitMapToMarkers();
    }

    this.map.on('moveend', () => {
      const bounds = this.map.getBounds();
      this.mapBoundsChange.emit({ /* bounds data */ }); // Emit bounds changes
    });
  }

  initializeMap(): void {
    // Google Maps initialization (use in production)
    const defaultCenter = { lat: 30.0444, lng: 31.2357 };

    this.map = new google.maps.Map(document.getElementById('map-container'), { /* options */ });
    this.infoWindow = new google.maps.InfoWindow();
    this.mapInitialized = true;

    if (this.properties.length > 0) {
      this.updateMarkers();
      this.fitMapToMarkers();
    }

    // Listen to bounds changes
    google.maps.event.addListener(this.map, 'idle', () => {
      const bounds = this.map.getBounds();
      if (bounds) {
        this.mapBoundsChange.emit({ /* bounds data */ }); // Emit bounds changes
      }
    });
  }

  updateMarkers(): void {
    if (!this.mapInitialized) return;

    const L = (window as any).L;

    // Clear existing markers
    this.markers.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    this.markers.clear();

    // Add new markers
    this.properties.forEach(property => {
      // Assuming 'location' exists or needs adjustment
      const position = [property.location.latitude, property.location.longitude];
      const marker = L.marker(position, { /* icon */ }).addTo(this.map);

      marker.on('click', () => {
        this.onMarkerClick(property);
      });
      marker.bindPopup(/* content */);

      this.markers.set(property.id, marker);
    });
  }

  fitMapToMarkers(): void {
    if (!this.mapInitialized || this.properties.length === 0) return;

    const L = (window as any).L;
    const bounds = L.latLngBounds(
      this.properties.map(p => [p.location.latitude, p.location.longitude])
    );

    this.map.fitBounds(bounds, { padding: [50, 50] }); // Fit map to properties bounds
  }

  onMarkerClick(property: Property): void {
    this.propertySelect.emit(property); // Emit property selection
  }

  centerOnProperty(property: Property): void {
    if (!this.mapInitialized) return;

    const L = (window as any).L;
    this.map.setView(
      [property.location.latitude, property.location.longitude],
      15,
      { animate: true }
    );

    const marker = this.markers.get(property.id);
    if (marker) {
      marker.openPopup(); // Open marker popup
    }
  }

  highlightMarker(propertyId: string | null): void {
    // Update marker styles based on hover/selection
    this.markers.forEach((marker, id) => {
      const element = marker.getElement();
      if (element) {
        const priceMarker = element.querySelector('.price-marker');
        if (priceMarker) {
          if (id === propertyId) {
            priceMarker.classList.add('selected');
          } else {
            priceMarker.classList.remove('selected');
          }
        }
      }
    });
  }
}
