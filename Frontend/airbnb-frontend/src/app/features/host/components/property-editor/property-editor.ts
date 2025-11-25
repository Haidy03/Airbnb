import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';

type EditorSection = 'photos' | 'title' | 'description' | 'amenities' | 'location' | 'propertyType';

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './property-editor.html',
  styleUrls: ['./property-editor.css']
})
export class PropertyEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);

  // State
  property = signal<Property | null>(null);
  isLoading = signal(true);
  activeSection = signal<EditorSection>('title');
  
  // Edit Mode State
  isEditing = signal(false);
  tempValue = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(id);
    }
  }

  loadProperty(id: string) {
    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        this.property.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/host/properties']);
      }
    });
  }

  setActiveSection(section: EditorSection) {
    if (this.isEditing()) {
      if(!confirm('You have unsaved changes. Discard them?')) return;
      this.cancelEdit();
    }
    this.activeSection.set(section);
  }

  startEdit() {
    const prop = this.property();
    if(!prop) return;

    this.isEditing.set(true);
    
    switch(this.activeSection()) {
      case 'title': this.tempValue.set(prop.title); break;
      case 'description': this.tempValue.set(prop.description); break;
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.tempValue.set(null);
  }

  saveChanges() {
    const prop = this.property();
    if(!prop) return;

    const updates: any = {};
    const section = this.activeSection();

    if (section === 'title') updates.title = this.tempValue();
    if (section === 'description') updates.description = this.tempValue();

    // ✅ استخدام updateProperty بدلاً من updateDraft
    this.propertyService.updateProperty(prop.id, updates).subscribe({
      next: (updatedProp) => {
        this.property.set(updatedProp);
        this.isEditing.set(false);
      },
      error: (err) => alert('Failed to save changes')
    });
  }

  getCoverImage(): string {
    // ✅ الآن TypeScript يعرف أن coverImage موجودة
    return this.property()?.coverImage || '/assets/images/placeholder-property.jpg';
  }
}