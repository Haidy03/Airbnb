// property-creation.service.ts
import { Injectable, signal } from '@angular/core';

interface PropertyDraft {
  propertyTypeId?: number;
  roomType?: string;
  // ... other fields as you add steps
}

@Injectable({
  providedIn: 'root'
})
export class PropertyCreationService {
  private draftData = signal<PropertyDraft>({});
  
  readonly draft = this.draftData.asReadonly();

  loadDraft(): void {
    const saved = localStorage.getItem('property_draft_data');
    if (saved) {
      this.draftData.set(JSON.parse(saved));
    }
  }

  updateDraft(updates: Partial<PropertyDraft>): void {
    const current = this.draftData();
    const updated = { ...current, ...updates };
    this.draftData.set(updated);
    localStorage.setItem('property_draft_data', JSON.stringify(updated));
  }

  clearDraft(): void {
    this.draftData.set({});
    localStorage.removeItem('property_draft_data');
  }

  getDraft(): PropertyDraft {
    return this.draftData();
  }
}