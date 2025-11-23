// Frontend/airbnb-frontend/src/app/features/host/components/property-steps/pricing/pricing.ts

import { Component, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService, PropertyDraft } from '../../../services/property';
import * as L from 'leaflet';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.css']
})
export class PricingComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  pricingForm!: FormGroup;
  isLoading = signal(false);
  showMap = signal(false);
  currentDraftId: string | null = null;
  currentDraft: PropertyDraft | null = null;

  private map!: L.Map;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentDraft();
  }

  ngAfterViewInit(): void {
    // Initialize map only when needed
    if (this.showMap()) {
      this.initializeMap();
    }
  }

  private initializeForm(): void {
    this.pricingForm = this.fb.group({
      pricePerNight: [46, [
        Validators.required,
        Validators.min(10),
        Validators.max(10000)
      ]]
    });

    // Watch for price changes
    this.pricingForm.get('pricePerNight')?.valueChanges.subscribe(() => {
      this.pricingForm.updateValueAndValidity();
    });
  }

  private getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          this.currentDraft = draft;
          
          this.pricingForm.patchValue({
            pricePerNight: draft.pricePerNight || 46
          });
          
          console.log('✅ Draft loaded:', draft);
        },
        error: (error) => {
          console.error('Error loading draft:', error);
          this.router.navigate(['/host/properties']);
        }
      });
    } else {
      console.error('No draft ID found');
      this.router.navigate(['/host/properties/intro']);
    }
  }

  private initializeMap(): void {
    if (this.map) return;

    // Get property location from draft
    let center = [30.0444, 31.2357]; // Default Cairo
    if (this.currentDraft && this.currentDraft.latitude && this.currentDraft.longitude) {
      center = [this.currentDraft.latitude, this.currentDraft.longitude];
    }
    
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [center[0], center[1]],
      13
    );

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add marker for property
    const customIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgNDhDMTYgNDggMCAyNi41IDAgMTZDMCA3LjE2MzQ0IDcuMTYzNDQgMCAxNiAwQzI0LjgzNjYgMCAzMiA3LjE2MzQ0IDMyIDE2QzMyIDI2LjUgMTYgNDggMTYgNDhaIiBmaWxsPSIjRkYzODVDIi8+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0id2hpdGUiLz48L3N2Zz4K',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    L.marker([center[0], center[1]], { icon: customIcon })
      .bindPopup(`<div style="padding: 8px; font-weight: bold;">${this.pricingForm.get('pricePerNight')?.value}</div>`)
      .addTo(this.map);

    // Add some comparison properties around the location
    const offset = 0.05;
    const properties = [
      { lat: center[0] + offset, lng: center[1], price: 45 },
      { lat: center[0] - offset, lng: center[1] + offset, price: 55 },
      { lat: center[0], lng: center[1] - offset, price: 100 },
      { lat: center[0] + offset, lng: center[1] - offset, price: 50 }
    ];

    properties.forEach(prop => {
      L.marker([prop.lat, prop.lng])
        .bindPopup(`<div style="padding: 8px; font-weight: bold;">${prop.price}</div>`)
        .addTo(this.map);
    });

    // Resize map when modal opens
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  getGuestPrice(): number {
    const price = this.pricingForm.get('pricePerNight')?.value || 46;
    return Math.round(price * 1.12);
  }

  saveAndExit(): void {
    if (!confirm('Save your progress and exit?')) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.pricingForm.valid) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        {
          pricePerNight: this.pricingForm.get('pricePerNight')?.value
        },
        'pricing'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  showQuestionsModal(): void {
    alert('Set competitive pricing based on your location and amenities!');
  }

  openMap(): void {
    this.showMap.set(true);
    // Initialize map after modal is shown
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  closeMap(): void {
    this.showMap.set(false);
  }

  goBack(): void {
    this.router.navigate(['/host/properties/description']);
  }

  goNext(): void {
    if (!this.pricingForm.valid) {
      alert('Please enter valid pricing information');
      return;
    }

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        {
          pricePerNight: this.pricingForm.get('pricePerNight')?.value
        },
        'pricing'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/legal-and-create']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    }
  }
}