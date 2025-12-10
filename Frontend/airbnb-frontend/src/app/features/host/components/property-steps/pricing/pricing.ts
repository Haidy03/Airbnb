import { Component, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 
import * as L from 'leaflet';
import { NotificationService } from '../../../../../core/services/notification.service';
import Swal from 'sweetalert2';

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
  currentDraft: Property | null = null;
  showCleaningFee = signal(false); 

  private map!: L.Map;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertyService: PropertyService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentDraft();
  }

  ngAfterViewInit(): void {
    if (this.showMap()) {
      this.initializeMap();
    }
  }

  private initializeForm(): void {
    this.pricingForm = this.fb.group({
      pricePerNight: [46, [
        Validators.required,
        Validators.min(10),
        Validators.max(1000000)
      ]],
      cleaningFee: [null] 
    });

    
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
            pricePerNight: draft.pricePerNight || 46,
            cleaningFee: draft.pricing?.cleaningFee || null
          });

  
          if (draft.pricing?.cleaningFee) {
            this.showCleaningFee.set(true);
          }
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
    if (!this.mapContainer) return;

    if (this.map) {
      setTimeout(() => { this.map.invalidateSize(); }, 200);
      return;
    }

   
    let lat = 30.0444;
    let lng = 31.2357;
    
    if (this.currentDraft?.location?.coordinates) {
      lat = this.currentDraft.location.coordinates.lat;
      lng = this.currentDraft.location.coordinates.lng;
    } else if (this.currentDraft?.latitude !== undefined && this.currentDraft?.longitude !== undefined) {
      lat = this.currentDraft.latitude;
      lng = this.currentDraft.longitude;
    }

   
    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

 
    const homeIcon = L.divIcon({
      className: 'custom-marker home',
      html: `<div style="background:#222;color:white;padding:6px 12px;border-radius:20px;font-weight:bold;box-shadow:0 2px 5px rgba(0,0,0,0.3); white-space:nowrap;">You (EGP${this.pricingForm.get('pricePerNight')?.value})</div>`
    });

    L.marker([lat, lng], { icon: homeIcon, zIndexOffset: 1000 }).addTo(this.map);

    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        const realListings = properties.filter(p => 
          p.isActive && 
          p.id !== this.currentDraft?.id && 
          p.location?.coordinates
        );

        console.log('✅ Found similar listings:', realListings.length);

        realListings.forEach(prop => {
          const pLat = prop.location.coordinates.lat;
          const pLng = prop.location.coordinates.lng;
          const price = prop.pricing?.basePrice || 0;
          
          const priceIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:white;padding:4px 8px;border-radius:12px;font-weight:bold;border:1px solid #ddd;box-shadow:0 2px 4px rgba(0,0,0,0.1); font-size:12px; white-space:nowrap;">EGP${price}</div>`
          });

          L.marker([pLat, pLng], { icon: priceIcon })
            .bindPopup(`
              <strong>${prop.title}</strong><br>
              EGP${price} / night
            `)
            .addTo(this.map);
        });
      },
      error: (err) => console.error('Failed to load similar listings', err)
    });

    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  toggleCleaningFee(): void {
    this.showCleaningFee.update(v => !v);
    if (!this.showCleaningFee()) {
      this.pricingForm.get('cleaningFee')?.setValue(null);
    }
  }

  getGuestPrice(): number {
    const price = this.pricingForm.get('pricePerNight')?.value || 46;
    return Math.round(price * 1.12);
  }

  async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction(
      'Save & Exit?',
      'Your progress will be saved, and you can resume later.'
    );
 
    if (!confirmed) return;

    this.saveData(() => this.router.navigate(['/host/properties']));
  }

  goNext(): void {
    if (!this.pricingForm.valid) {
      this.notificationService.showError('Please enter a valid price (between 10 and 1,000,000 EGP)');
      return;
    }
   
    this.saveData(() => this.router.navigate(['/host/properties/house-rules']));
  }


  private saveData(onSuccess: () => void): void {
    this.isLoading.set(true);

    if (this.currentDraftId) {
  
      const feeValue = this.showCleaningFee() ? this.pricingForm.get('cleaningFee')?.value : null;
      
      const payload = {
        pricePerNight: this.pricingForm.get('pricePerNight')?.value,
        cleaningFee: feeValue
      };

      console.log('📤 Saving Pricing:', payload); 

      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        payload,
        'pricing'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          onSuccess();
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Save error:', error);
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  showQuestionsModal(): void {
    Swal.fire({
      title: 'Pricing Tips',
      html: `
        <div style="text-align: left; line-height: 1.6;">
          <p>Set a competitive price to attract more guests.</p>
          <ul style="list-style: none; padding: 0;">
            <li>💰 <b>Start lower</b> to get your first reviews</li>
            <li>🧹 <b>Cleaning fee</b> covers housekeeping costs</li>
            <li>📍 <b>Check similar listings</b> in your area</li>
          </ul>
        </div>
      `,
      confirmButtonColor: '#222',
      confirmButtonText: 'Got it'
    });
  }
  
  openMap(): void {
    this.showMap.set(true);
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  closeMap(): void {
    this.showMap.set(false);
  }

  goBack(): void {
    this.router.navigate(['/host/properties/instant-book']);
  }
}