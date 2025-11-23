import { Component, OnInit, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { PropertyService } from '../../../services/property';

@Component({
  selector: 'app-property-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './property-location.html',
  styleUrls: ['./property-location.css']
})
export class PropertyLocationComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  locationForm!: FormGroup;
  isLoading = signal(false);
  isGettingLocation = signal(false);
  showManualEntry = signal(false);
  addressSuggestions = signal<any[]>([]);
  currentDraftId: string | null = null;
  // Leaflet map
  private map!: L.Map;
  private marker!: L.Marker;
  
  // Map state
  mapCenter = signal({ lat: 30.0444, lng: 31.2357 }); // Default: Cairo
  mapZoom = signal(12);
  markerPosition = signal<{ lat: number; lng: number } | null>(null);

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
    this.initializeMap();
  }

  /**
   * Initialize Leaflet map
   */
  initializeMap(): void {
    const center = this.mapCenter();
    
    // Initialize map
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [center.lat, center.lng],
      this.mapZoom()
    );

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Custom marker icon
    const customIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDQ4QzE2IDQ4IDAgMjYuNSAwIDE2QzAgNy4xNjM0NCA3LjE2MzQ0IDAgMTYgMEMyNC44MzY2IDAgMzIgNy4xNjM0NCAzMiAxNkMzMiAyNi41IDE2IDQ4IDE2IDQ4WiIgZmlsbD0iI0ZGMzg1QyIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    // Add marker if position exists
    if (this.markerPosition()) {
      const pos = this.markerPosition()!;
      this.marker = L.marker([pos.lat, pos.lng], { icon: customIcon, draggable: true })
        .addTo(this.map);

      // Handle marker drag
      this.marker.on('dragend', () => {
        const position = this.marker.getLatLng();
        this.updateLocation(position.lat, position.lng);
      });

      this.map.setView([pos.lat, pos.lng], 15);
    }

    // Handle map clicks
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  /**
   * Get current draft
   */
  getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          this.locationForm.patchValue({
            country: draft.country,
            address: draft.address,
            city: draft.city,
            state: draft.state,
            postalCode: draft.postalCode,
            latitude: draft.latitude,
            longitude: draft.longitude
          });
        }
      });
    }
  }
  /**
   * Update location on map
   */
  updateLocation(lat: number, lng: number): void {
    // Update marker
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      const customIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDQ4QzE2IDQ4IDAgMjYuNSAwIDE2QzAgNy4xNjM0NCA3LjE2MzQ0IDAgMTYgMEMyNC44MzY2IDAgMzIgNy4xNjM0NCAzMiAxNkMzMiAyNi41IDE2IDQ4IDE2IDQ4WiIgZmlsbD0iI0ZGMzg1QyIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        iconSize: [32, 48],
        iconAnchor: [16, 48]
      });
      
      this.marker = L.marker([lat, lng], { icon: customIcon, draggable: true })
        .addTo(this.map);

      this.marker.on('dragend', () => {
        const position = this.marker.getLatLng();
        this.updateLocation(position.lat, position.lng);
      });
    }

    // Update state
    this.markerPosition.set({ lat, lng });
    this.mapCenter.set({ lat, lng });

    // Update form
    this.locationForm.patchValue({
      latitude: lat,
      longitude: lng
    });

    // Reverse geocode
    this.reverseGeocode(lat, lng);
  }

  /**
   * Initialize the location form
   */
  initializeForm(): void {
    this.locationForm = this.fb.group({
      searchAddress: ['', Validators.required],
      address: [''],
      city: [''],
      state: [''],
      country: [''],
      postalCode: [''],
      latitude: [0],
      longitude: [0]
    });

    // Watch for search input changes
    this.locationForm.get('searchAddress')?.valueChanges.subscribe(value => {
      if (value && value.length > 2) {
        this.searchAddress(value);
      } else {
        this.addressSuggestions.set([]);
      }
    });
  }

  /**
   * Load saved data from localStorage
   */
  loadSavedData(): void {
    const saved = localStorage.getItem('property_location');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.locationForm.patchValue(data);
        
        if (data.latitude && data.longitude) {
          this.mapCenter.set({ lat: data.latitude, lng: data.longitude });
          this.markerPosition.set({ lat: data.latitude, lng: data.longitude });
          this.mapZoom.set(15);
        }
      } catch (error) {
        console.error('Error loading saved location data:', error);
      }
    }
  }

  /**
   * Save form data to localStorage
   */
  saveData(): void {
    const data = this.locationForm.value;
    localStorage.setItem('property_location', JSON.stringify(data));
  }

  /**
   * Search for address using Nominatim API
   */
  searchAddress(query: string): void {
    if (query.length < 3) return;

    const encodedQuery = encodeURIComponent(query);
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        this.addressSuggestions.set(data);
      })
      .catch(error => {
        console.error('Address search error:', error);
      });
  }

  /**
   * Select address from suggestions
   */
  selectAddress(result: any): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Update map
    this.updateLocation(lat, lng);
    this.map.setView([lat, lng], 15);

    // Update form
    this.locationForm.patchValue({
      searchAddress: result.display_name,
      address: result.address.road || result.address.suburb || '',
      city: result.address.city || result.address.town || result.address.village || '',
      state: result.address.state || '',
      country: result.address.country || '',
      postalCode: result.address.postcode || ''
    });

    // Clear suggestions
    this.addressSuggestions.set([]);
  }

  /**
   * Get current location using browser geolocation
   */
  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    this.isGettingLocation.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Update map
        this.updateLocation(lat, lng);
        this.map.setView([lat, lng], 15);

        this.isGettingLocation.set(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.isGettingLocation.set(false);
        alert('Unable to get your location. Please enter your address manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode(lat: number, lng: number): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          
          this.locationForm.patchValue({
            searchAddress: data.display_name,
            address: addr.road || addr.suburb || '',
            city: addr.city || addr.town || addr.village || '',
            state: addr.state || '',
            country: addr.country || '',
            postalCode: addr.postcode || ''
          });
        }
      })
      .catch(error => {
        console.error('Reverse geocoding error:', error);
      });
  }

  /**
   * Toggle manual entry mode
   */
  toggleManualEntry(): void {
    this.showManualEntry.set(!this.showManualEntry());
  }

  /**
   * Close manual entry and geocode the entered address
   */
  closeManualEntry(): void {
    const address = this.locationForm.get('address')?.value;
    const city = this.locationForm.get('city')?.value;
    const country = this.locationForm.get('country')?.value;

    if (address || city) {
      const fullAddress = [address, city, country].filter(Boolean).join(', ');
      this.locationForm.patchValue({ searchAddress: fullAddress });
      
      // Geocode the manual address
      this.geocodeManualAddress(fullAddress);
    }

    this.showManualEntry.set(false);
  }

  /**
   * Geocode manually entered address
   */
  geocodeManualAddress(address: string): void {
    if (!address) return;

    this.isLoading.set(true);
    const encodedAddress = encodeURIComponent(address);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        this.isLoading.set(false);
        
        if (data && data.length > 0) {
          const result = data[0];
          this.selectAddress(result);
        } else {
          alert('Address not found. Please check and try again.');
        }
      })
      .catch(error => {
        console.error('Geocoding error:', error);
        this.isLoading.set(false);
        alert('Error finding address. Please try again.');
      });
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return !!(
      this.locationForm.get('latitude')?.value &&
      this.locationForm.get('longitude')?.value &&
      this.locationForm.get('latitude')?.value !== 0 &&
      this.locationForm.get('searchAddress')?.value
    );
  }

  /**
   * Save and exit
   */
   saveAndExit(): void {
    if (!confirm('Save your progress and exit?')) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.locationForm.valid) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        this.locationForm.value,
        'location'
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
    }
  }

  /**
   * Show questions modal
   */
  showQuestionsModal(): void {
    alert('Need help? Contact our support team.');
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    
    this.router.navigate(['/host/properties/room-type']);
  }

  /**
   * Go to next step
   */
    goNext(): void {
    if (!this.locationForm.valid) {
      alert('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        this.locationForm.value,
        'location'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/floor-plan']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    }
  }

}