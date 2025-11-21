import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property, SearchQuery } from '../../models/property.model';
import { SearchFilters } from '../../models/property.model';
import { SearchMapComponent } from '../search-map/search-map';
import { PropertyListComponent } from '../property-list/property-list';
import { FiltersComponent } from '../filters/filters';
import { SearchBarComponent } from '../search-bar/search-bar';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    PropertyListComponent,
    SearchMapComponent,
    FiltersComponent,
    SearchBarComponent
  ],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css']
})
export class SearchResultsComponent implements OnInit {

  @ViewChild(PropertyListComponent) propertyList!: PropertyListComponent;
  @ViewChild(SearchMapComponent) searchMap!: SearchMapComponent;

  showFilters = false;
  showMap = false;
  selectedProperty: Property | null = null;
  hoveredPropertyId: string | null = null;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.showMap = window.innerWidth >= 1024;
  }

  get isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }

  onSearchSubmit(filters: SearchFilters): void {
    if (this.propertyList) {
      this.propertyList.applyFilters(filters);
    }
  }

  onFiltersOpen(): void {
    this.showFilters = true;
  }

  onFiltersClose(): void {
    this.showFilters = false;
  }

  onFiltersApply(filters: SearchFilters): void {
    if (this.propertyList) {
      this.propertyList.applyFilters(filters);
    }
  }

  toggleMap(): void {
    this.showMap = !this.showMap;
  }

  onPropertyHover(propertyId: string | null): void {
    this.hoveredPropertyId = propertyId;
    if (this.searchMap && propertyId) {
      this.searchMap.highlightMarker(propertyId);
    }
  }

  onPropertySelect(property: Property): void {
    this.selectedProperty = property;
    if (this.searchMap) {
      this.searchMap.centerOnProperty(property);
    }
  }

  onMapPropertySelect(property: Property): void {
    this.selectedProperty = property;
  }

  onMapBoundsChange(bounds: any): void {
    console.log('Map bounds changed:', bounds);
  }
}
