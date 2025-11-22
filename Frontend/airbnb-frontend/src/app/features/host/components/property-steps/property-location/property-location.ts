import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-property-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './property-location.html',
  styleUrls: ['./property-location.css']
})
export class PropertyLocationComponent implements OnInit {
  locationForm!: FormGroup;
  isLoading = signal(false);
  isGettingLocation = signal(false);
  showMap = signal(false);
  
  // Country suggestions for autocomplete
  countries: string[] = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland',
    'Austria', 'Greece', 'Portugal', 'Ireland', 'Denmark', 'Sweden',
    'Norway', 'Finland', 'Poland', 'Czech Republic', 'Japan', 'South Korea',
    'Singapore', 'New Zealand', 'Brazil', 'Mexico', 'Argentina', 'Chile',
    'United Arab Emirates', 'Thailand', 'Malaysia', 'India', 'Egypt'
  ].sort();

  filteredCountries = signal<string[]>([]);
  
  // Form validation state
  isFormValid = computed(() => {
    if (!this.locationForm) return false;
    return this.locationForm.valid;
  });

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSavedData();
    this.setupCountryFilter();
  }

  /**
   * Initialize the location form
   */
  initializeForm(): void {
    this.locationForm = this.fb.group({
      country: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: [''],
      postalCode: ['', [Validators.pattern(/^[A-Za-z0-9\s\-]{3,10}$/)]],
      latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]]
    });
  }

  /**
   * Setup country autocomplete filter
   */
  setupCountryFilter(): void {
    this.locationForm.get('country')?.valueChanges.subscribe(value => {
      if (value && value.length > 0) {
        this.filteredCountries.set(
          this.countries.filter(country => 
            country.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 8) // Show top 8 matches
        );
      } else {
        this.filteredCountries.set([]);
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
        
        // Show map if coordinates exist
        if (data.latitude && data.longitude) {
          this.showMap.set(true);
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
    if (this.locationForm.valid) {
      const data = this.locationForm.value;
      localStorage.setItem('property_location', JSON.stringify(data));
    }
  }

  /**
   * Select country from suggestions
   */
  selectCountry(country: string): void {
    this.locationForm.patchValue({ country });
    this.filteredCountries.set([]);
  }

  /**
   * Get current location using browser geolocation
   */
  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    this.isGettingLocation.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        this.locationForm.patchValue({
          latitude: lat,
          longitude: lng
        });

        this.showMap.set(true);
        this.isGettingLocation.set(false);

        // Optionally: Reverse geocode to get address
        this.reverseGeocode(lat, lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.isGettingLocation.set(false);
        
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Reverse geocode coordinates to address (using OpenStreetMap Nominatim)
   */
  reverseGeocode(lat: number, lng: number): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.address) {
          // Update form with geocoded address
          const addr = data.address;
          
          this.locationForm.patchValue({
            country: addr.country || '',
            city: addr.city || addr.town || addr.village || '',
            state: addr.state || '',
            postalCode: addr.postcode || '',
            address: data.display_name || ''
          });

          console.log('✅ Location detected:', data.display_name);
        }
      })
      .catch(error => {
        console.error('Reverse geocoding error:', error);
      });
  }

  /**
   * Geocode address to coordinates (using OpenStreetMap Nominatim)
   */
  geocodeAddress(): void {
    const address = this.locationForm.get('address')?.value;
    const city = this.locationForm.get('city')?.value;
    const country = this.locationForm.get('country')?.value;

    if (!address && !city && !country) {
      alert('Please enter at least a city or address');
      return;
    }

    this.isLoading.set(true);

    const query = [address, city, country].filter(Boolean).join(', ');
    const encodedQuery = encodeURIComponent(query);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`)
      .then(response => response.json())
      .then(data => {
        this.isLoading.set(false);
        
        if (data && data.length > 0) {
          const location = data[0];
          
          this.locationForm.patchValue({
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon)
          });

          this.showMap.set(true);
          
          alert('✅ Location found on map!');
        } else {
          alert('Location not found. Please check your address and try again.');
        }
      })
      .catch(error => {
        console.error('Geocoding error:', error);
        this.isLoading.set(false);
        alert('Error finding location. Please try again.');
      });
  }

  /**
   * Validate coordinates manually entered
   */
  validateCoordinates(): void {
    const lat = this.locationForm.get('latitude')?.value;
    const lng = this.locationForm.get('longitude')?.value;

    if (lat && lng && lat !== 0 && lng !== 0) {
      this.showMap.set(true);
    }
  }

  /**
   * Check if field has error
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.locationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.locationForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['min']) return 'Invalid value';
      if (field.errors['max']) return 'Invalid value';
      if (field.errors['pattern']) return 'Invalid format';
    }
    return '';
  }

  /**
   * Save and exit
   */
  saveAndExit(): void {
    const confirmed = confirm(
      'Save your progress and exit? You can continue later from where you left off.'
    );
    
    if (!confirmed) return;

    this.saveData();
    this.router.navigate(['/host/properties']);
  }

  /**
   * Show questions modal
   */
  showQuestionsModal(): void {
    alert('Questions? Contact our support team for help with listing your property.');
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    this.saveData();
    this.router.navigate(['/host/properties/room-type']);
  }

  /**
   * Go to next step
   */
  goNext(): void {
    if (!this.locationForm.valid) {
      alert('Please fill in all required fields correctly.');
      Object.keys(this.locationForm.controls).forEach(key => {
        this.locationForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if coordinates are set
    const lat = this.locationForm.get('latitude')?.value;
    const lng = this.locationForm.get('longitude')?.value;

    if (!lat || !lng || (lat === 0 && lng === 0)) {
      const confirmProceed = confirm(
        'Location coordinates are not set. Would you like to find them automatically?'
      );
      
      if (confirmProceed) {
        this.geocodeAddress();
        return;
      }
    }

    this.saveData();
    this.router.navigate(['/host/properties/floor-plan']);
  }
}