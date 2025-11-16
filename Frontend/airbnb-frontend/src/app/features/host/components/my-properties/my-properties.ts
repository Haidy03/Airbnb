import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-my-properties',
  imports: [CommonModule, RouterLink],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.css',
 
})
export class MyProperties implements OnInit{
  properties: Property[] = [];
  isLoading = true;
  activeTab: 'all' | 'active' | 'inactive' = 'all';

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    // في الوقت الحالي hostId ثابت، لما Authentication يخلص هناخده من الـ Token
    this.propertyService.getHostProperties('host-1').subscribe({
      next: (data) => {
        this.properties = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.isLoading = false;
      }
    });
  }

  get filteredProperties(): Property[] {
    if (this.activeTab === 'all') {
      return this.properties;
    }
    return this.properties.filter(p => 
      this.activeTab === 'active' ? p.isActive : !p.isActive
    );
  }

  get activePropertiesCount(): number {
    return this.properties.filter(p => p.isActive).length;
  }

  get inactivePropertiesCount(): number {
    return this.properties.filter(p => !p.isActive).length;
  }

  togglePropertyStatus(property: Property): void {
    if (confirm(`Are you sure you want to ${property.isActive ? 'deactivate' : 'activate'} this property?`)) {
      this.propertyService.togglePropertyStatus(property.id).subscribe({
        next: (updatedProperty) => {
          // Update the property in the list
          const index = this.properties.findIndex(p => p.id === property.id);
          if (index !== -1) {
            this.properties[index] = updatedProperty;
          }
        },
        error: (error) => {
          console.error('Error toggling property status:', error);
          alert('Failed to update property status');
        }
      });
    }
  }

  deleteProperty(property: Property): void {
    if (confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
      this.propertyService.deleteProperty(property.id).subscribe({
        next: (success) => {
          if (success) {
            this.properties = this.properties.filter(p => p.id !== property.id);
            alert('Property deleted successfully');
          }
        },
        error: (error) => {
          console.error('Error deleting property:', error);
          alert('Failed to delete property');
        }
      });
    }
  }

  getPrimaryImage(property: Property): string {
    const primaryImage = property.images.find(img => img.isPrimary);
    return primaryImage?.imageUrl || property.images[0]?.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';
  }
}
