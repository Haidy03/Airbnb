import { Component, Output, EventEmitter, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchFilters } from '../../models/property.model';
import { SearchService } from '../../services/search-service';
import { ServicesService } from '../../../../../services/services/service'; // تأكد من المسار
import { ExperienceService } from '../../../../../../shared/Services/experience.service'; // ✅ تأكد من المسار

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent implements OnInit {
  @Input() withFilterButton: boolean = false;
  @Output() search = new EventEmitter<SearchFilters>();
  @Output() filtersOpen = new EventEmitter<void>();

  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private searchService = inject(SearchService);
  private experienceService = inject(ExperienceService); // ✅ حقن سيرفس التجارب

  // نوع البحث الحالي
  searchType: 'stays' | 'experiences' | 'services' = 'stays';

  // === Shared / Stays Data ===
  location: string = '';
  checkIn: string = '';
  checkOut: string = '';
  minDate: string = '';
  guests: number = 0;

  // === Services Data ===
  serviceQuery: string = ''; // البحث باسم الخدمة
  
  // === Experiences Data ===
  experienceQuery: string = ''; // البحث باسم التجربة (searchTerm)
  experienceDuration: number | null = null; // المدة بالساعات

  // === Categories Handling ===
  serviceCategories: any[] = [];
  experienceCategories: any[] = [];
  
  // المتغيرات المختارة للعرض والإرسال
  selectedCategoryName: string = ''; 
  selectedCategoryId: number | null = null; 

  // === UI State ===
  activeInput: string | null = null; // لتحديد الحقل النشط
  showGuestsDropdown = false;
  showLocationsDropdown = false;
  showCategoriesDropdown = false;
  showDurationDropdown = false;

  availableLocations: string[] = [];
  
  // خيارات المدة (ساعات)
  durationOptions = [2, 3, 4, 5, 6, 8, 10, 12]; 

  // Guest Counters
  adultsCount = 0;
  childrenCount = 0;
  infantsCount = 0;
  petsCount = 0;

  ngOnInit() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // تحميل المدن
    this.searchService.locations$.subscribe(locations => {
      this.availableLocations = locations;
    });

    // 1. تحميل تصنيفات الخدمات
    this.servicesService.getAllCategories().subscribe(res => {
      if (res.success) this.serviceCategories = res.data;
    });

    // 2. تحميل تصنيفات التجارب
    this.experienceService.getCategories().subscribe(res => {
      if (res.success) this.experienceCategories = res.data;
    });
  }

  // التبديل بين التبويبات وتصفير البيانات
  setSearchType(type: 'stays' | 'experiences' | 'services') {
    this.searchType = type;
    this.activeInput = null;
    this.resetFields();
  }

  resetFields() {
    this.location = '';
    this.checkIn = '';
    this.checkOut = '';
    this.selectedCategoryName = '';
    this.selectedCategoryId = null;
    this.experienceQuery = '';
    this.serviceQuery = '';
    this.experienceDuration = null;
    this.adultsCount = 0;
    this.childrenCount = 0;
    this.guests = 0;
  }

  // إدارة التركيز (Focus) وعرض القوائم
  onInputFocus(input: string): void {
    this.activeInput = input;
    this.showGuestsDropdown = input === 'guests';
    this.showLocationsDropdown = input === 'location';
    // القائمة تفتح سواء كنا في Services أو Experiences
    this.showCategoriesDropdown = (input === 'serviceCategory' || input === 'expCategory');
    this.showDurationDropdown = input === 'expDuration';
  }

  onInputBlur(): void {
    // تأخير بسيط للسماح بالضغط على العناصر
    setTimeout(() => {
      this.activeInput = null;
      this.showGuestsDropdown = false;
      this.showLocationsDropdown = false;
      this.showCategoriesDropdown = false;
      this.showDurationDropdown = false;
    }, 200);
  }

  // --- Selection Helpers ---
  selectLocation(city: string) {
    this.location = city;
    this.showLocationsDropdown = false;
  }
  
  // ✅ دالة اختيار التصنيف (تعمل للاثنين)
  selectCategory(cat: any) {
    this.selectedCategoryName = cat.name;
    this.selectedCategoryId = cat.id; // نحتفظ بالـ ID للـ Experience
    this.showCategoriesDropdown = false;
  }

  selectDuration(hours: number) {
    this.experienceDuration = hours;
    this.showDurationDropdown = false;
  }

  clearField(field: string, event: Event) {
    event.stopPropagation();
    if (field === 'category') {
        this.selectedCategoryName = '';
        this.selectedCategoryId = null;
    }
    if (field === 'duration') this.experienceDuration = null;
    if (field === 'location') this.location = '';
    if (field === 'checkIn') this.checkIn = '';
    if (field === 'checkOut') this.checkOut = '';
  }

  // --- Guest Logic ---
  incrementGuests(type: string) { 
     if (this.adultsCount === 0 && type === 'adults') { this.adultsCount = 1; this.updateGuestsCount(); return; }
     if(type === 'adults' && this.adultsCount < 16) this.adultsCount++;
     if(type === 'children' && this.childrenCount < 15) this.childrenCount++;
     if(type === 'infants' && this.infantsCount < 5) this.infantsCount++;
     if(type === 'pets' && this.petsCount < 5) this.petsCount++;
     this.updateGuestsCount();
  }
  decrementGuests(type: string) {
     if(type === 'adults' && this.adultsCount > 0) this.adultsCount--;
     if(type === 'children' && this.childrenCount > 0) this.childrenCount--;
     if(type === 'infants' && this.infantsCount > 0) this.infantsCount--;
     if(type === 'pets' && this.petsCount > 0) this.petsCount--;
     this.updateGuestsCount();
  }
  updateGuestsCount() { this.guests = this.adultsCount + this.childrenCount; }
  get guestsText() { 
    const total = this.guests;
    return total > 0 ? `${total} guests` : 'Add guests';
  }

  // ✅ دالة البحث الرئيسية
  onSearch(): void {
    // 1. Stays (Properties)
    if (this.searchType === 'stays') {
      const filters: SearchFilters = {
        location: this.location || undefined,
        checkIn: this.checkIn ? new Date(this.checkIn) : undefined,
        checkOut: this.checkOut ? new Date(this.checkOut) : undefined,
        guests: this.guests > 0 ? this.guests : undefined
      };
      this.search.emit(filters);
    } 
    // 2. Experiences (Update)
    else if (this.searchType === 'experiences') {
        const queryParams: any = {};
        
        // الاسم (SearchTerm)
        if (this.experienceQuery) queryParams.searchTerm = this.experienceQuery;
        
        // التصنيف (ID)
        if (this.selectedCategoryId) queryParams.category = this.selectedCategoryId;
        
        // المدة (ساعات)
        if (this.experienceDuration) queryParams.duration = this.experienceDuration;
        
        // عدد الأشخاص
        if (this.guests > 0) queryParams.guests = this.guests;
        
        // الموقع (اختياري لو أضفتيه للواجهة)
        if (this.location) queryParams.location = this.location;

        this.router.navigate(['/experiences'], { queryParams: queryParams });
    } 
    // 3. Services
    else {
      const queryParams: any = {};
      if (this.serviceQuery) queryParams.q = this.serviceQuery;
      // الخدمات حالياً تبحث باسم التصنيف (string)
      if (this.selectedCategoryName) queryParams.category = this.selectedCategoryName; 
      
      this.router.navigate(['/services'], { queryParams: queryParams });
    }
  }

  onFiltersClick() { this.filtersOpen.emit(); }
}