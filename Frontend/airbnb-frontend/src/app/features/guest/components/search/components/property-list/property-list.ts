import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property, SortOption } from '../../models/property.model';
import { PropertyCardComponent } from '../property-card/property-card';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCardComponent],
  templateUrl: './property-list.html',
  styleUrls: ['./property-list.css']
})
export class PropertyListComponent {

  // المدخلات من الأب (Search Results)
  @Input() properties: Property[] = [];
  @Input() totalProperties = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 12;
  @Input() isLoading = false;

  // المخرجات للأب (عشان يكلم السيرفس)
  @Output() propertyHover = new EventEmitter<string | null>();
  @Output() propertySelect = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<SortOption>();
  @Output() favoriteToggle = new EventEmitter<string>();

  sortOption: SortOption = SortOption.POPULAR;
  public Math = Math;

  // حساب عدد الصفحات
  get totalPages(): number {
    return Math.ceil(this.totalProperties / this.pageSize);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortOption = target.value as SortOption;
    this.sortChange.emit(this.sortOption);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onPropertyClick(property: Property): void {
    this.propertySelect.emit(property.id);
  }

  onHover(id: string | null) {
    this.propertyHover.emit(id);
  }

  onFavorite(id: string) {
    this.favoriteToggle.emit(id);
  }

  // دالة مساعدة لحساب نطاق الصفحات (Pagination Range)
  get paginationRange(): number[] {
    const range: number[] = [];
    const maxPages = 5;
    const total = this.totalPages;

    if (total <= 0) return [];

    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }
}
