import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../models/property.model';
import { PropertyService } from '../../services/property';

@Component({
  selector: 'app-propertystatus',
  imports: [CommonModule],
  templateUrl: './propertystatus.html',
  styleUrl: './propertystatus.css',
})
export class Propertystatus {
  @Input() property!: Property;
  @Output() statusChanged = new EventEmitter<Property>();
  @Output() completeSetup = new EventEmitter<void>();

  isLoading = signal(false);
  validationErrors = signal<string[]>([]);
  showSuccess = signal(false);
  successMessage = signal('');

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.validateProperty();
  }

  isPublished(): boolean {
    return this.property.status === 'published';
  }

  canPublish(): boolean {
    return this.validationErrors().length === 0;
  }

  getStatusClass(): string {
    return this.isPublished() ? 'published' : 'unlisted';
  }

  getStatusText(): string {
    return this.isPublished() ? 'Published' : 'Unlisted';
  }

  validateProperty(): void {
    const validation = this.propertyService.validatePropertyForPublishing(this.property);
    this.validationErrors.set(validation.errors);
  }

  onToggleStatus(): void {
    if (this.isLoading()) return;

    const willPublish = !this.isPublished();

    if (willPublish && !this.canPublish()) {
      alert('Please complete all required steps before publishing');
      return;
    }

    const confirmMessage = willPublish 
      ? 'Are you sure you want to publish this listing? It will be visible to guests.'
      : 'Are you sure you want to unpublish this listing? It will be hidden from guests.';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.isLoading.set(true);

    const action$ = willPublish 
      ? this.propertyService.publishProperty(this.property.id)
      : this.propertyService.unpublishProperty(this.property.id);

    action$.subscribe({
      next: (updatedProperty) => {
        this.property = updatedProperty;
        this.isLoading.set(false);
        
        this.successMessage.set(
          willPublish ? 'Listing published successfully!' : 'Listing unpublished successfully!'
        );
        this.showSuccess.set(true);
        
        setTimeout(() => this.showSuccess.set(false), 3000);
        
        this.statusChanged.emit(updatedProperty);
      },
      error: (error) => {
        this.isLoading.set(false);
        alert(error.message || 'Failed to update listing status');
      }
    });
  }

  onCompleteSetup(): void {
    this.completeSetup.emit();
  }
}
