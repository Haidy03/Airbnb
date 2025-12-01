import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExperienceService } from '../../../../../../shared/Services/experience.service';
import { ExperienceCategory, CreateExperienceDto, UpdateExperienceDto, Experience, ExperienceAvailability, CreateAvailabilityDto } from '../../../../../../shared/models/experience.model';
import { environment } from '../../../../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-create-experience',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-experience.component.html',
  styleUrls: ['./create-experience.component.css']
})
export class CreateExperienceComponent implements OnInit {
  experienceForm!: FormGroup;
  categories = signal<ExperienceCategory[]>([]);
  isSubmitting = signal(false);
  isUploading = signal(false);
  error = signal<string | null>(null);
  
  isEditMode = false;
  experienceId: number | null = null;
  existingExperience = signal<Experience | null>(null);
  tempSlots = signal<any[]>([]); // لتخزين المواعيد الجديدة
  existingSlots = signal<ExperienceAvailability[]>([]); // لتخزين المواعيد القديمة (في حالة التعديل)
  
  newSlotDate: string = '';
  newSlotTime: string = '';
  experienceTypes = [
    { value: 'InPerson', label: 'In-Person', icon: '🏃' },
    { value: 'Adventure', label: 'Adventure', icon: '🏔️' }
  ];
  
  languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' }
  ];
  
  selectedLanguages: string[] = ['en'];

  constructor(
    private fb: FormBuilder,
    private experienceService: ExperienceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // 1. تحميل التصنيفات أولاً
    this.experienceService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data);
          
          // 2. بعد تحميل التصنيفات، نتحقق لو في Edit Mode نحمل البيانات
          // ده عشان نضمن إننا نلاقي الـ Category ID الصح
          this.checkEditMode();
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.experienceId = parseInt(id);
      this.loadExperienceDetails(this.experienceId);
      this.loadAvailabilities(this.experienceId);
    }
  }
  loadAvailabilities(id: number) {
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);

    this.experienceService.getAvailabilities(id, start, end).subscribe({
      next: (data) => {
        this.existingSlots.set(data as any[]);
      }
    });
  }

  initializeForm(): void {
    this.experienceForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(3000)]],
      categoryId: [null, Validators.required],
      type: ['InPerson', Validators.required],
      
      address: [''],
      city: [''],
      country: [''],
      
      durationHours: [2, [Validators.required, Validators.min(1)]],
      durationMinutes: [0, [Validators.min(0), Validators.max(59)]],
      
      minGroupSize: [1, [Validators.required, Validators.min(1)]],
      maxGroupSize: [10, [Validators.required, Validators.min(1)]],
      
      pricePerPerson: [50, [Validators.required, Validators.min(1)]],
      
      ageRequirement: ['All ages welcome'],
      skillLevel: ['Beginner'],
      whatToBring: [''],
      whatIsIncluded: [''],
      cancellationPolicy: ['Free cancellation up to 24 hours before the experience starts']
    });

    this.experienceForm.get('type')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });
  }

  updateValidators(type: string) {
    const cityControl = this.experienceForm.get('city');
    const countryControl = this.experienceForm.get('country');
    
    if (type === 'InPerson' || type === 'Adventure') {
      cityControl?.setValidators([Validators.required]);
      countryControl?.setValidators([Validators.required]);
    } else {
      cityControl?.clearValidators();
      countryControl?.clearValidators();
    }
    
    cityControl?.updateValueAndValidity();
    countryControl?.updateValueAndValidity();
  }

  loadExperienceDetails(id: number): void {
    this.experienceService.getExperienceById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const exp = response.data;
          this.existingExperience.set(exp);
          
          // تشغيل الـ Validators بناءً على النوع الراجع من الداتا بيز
          this.updateValidators(exp.type);

          this.experienceForm.patchValue({
            title: exp.title,
            description: exp.description,
            categoryId: this.getCategoryIdByName(exp.categoryName),
            type: exp.type,
            address: exp.address || '',
            city: exp.city,
            country: exp.country,
            durationHours: exp.durationHours,
            durationMinutes: exp.durationMinutes,
            minGroupSize: exp.minGroupSize,
            maxGroupSize: exp.maxGroupSize,
            pricePerPerson: exp.pricePerPerson,
            ageRequirement: exp.ageRequirement,
            skillLevel: exp.skillLevel,
            whatToBring: exp.whatToBring,
            whatIsIncluded: exp.whatIsIncluded,
            cancellationPolicy: exp.cancellationPolicy
          });

          this.selectedLanguages = exp.languages?.map((l: any) => l.languageCode) || ['en'];
        }
      },
      error: (err) => console.error(err)
    });
  }

  getCategoryIdByName(name: string): number | null {
    if (!name) return null;
    const cat = this.categories().find(c => c.name === name);
    return cat ? cat.id : null;
  }

  toggleLanguage(code: string): void {
    const index = this.selectedLanguages.indexOf(code);
    if (index > -1) {
      if (this.selectedLanguages.length > 1) {
        this.selectedLanguages.splice(index, 1);
      }
    } else {
      this.selectedLanguages.push(code);
    }
  }

  addSlot(): void {
    if (this.tempSlots().length >= 6) {
      alert('You can add up to 6 slots only.');
      return;
    }
    if (!this.newSlotDate || !this.newSlotTime) {
      alert('Please select date and start time.');
      return;
    }

    // 1. التحقق من التكرار (Duplicate Check)
    const targetDateStr = new Date(this.newSlotDate).toDateString(); // توحيد صيغة التاريخ للمقارنة
    
    // فحص في القائمة المؤقتة (Temp Slots)
    const existsInTemp = this.tempSlots().some(slot => 
      new Date(slot.date).toDateString() === targetDateStr && 
      slot.startTime.startsWith(this.newSlotTime) // "14:00" starts with "14:00"
    );

    // فحص في القائمة المحفوظة (DB Slots)
    const existsInDB = this.existingSlots().some(slot => 
      new Date(slot.date).toDateString() === targetDateStr && 
      slot.startTime.startsWith(this.newSlotTime)
    );

    if (existsInTemp || existsInDB) {
      alert('⚠️ This date and time is already selected!');
      return;
    }

    // حساب وقت الانتهاء
    const hours = this.experienceForm.get('durationHours')?.value || 0;
    const minutes = this.experienceForm.get('durationMinutes')?.value || 0;

    const [startH, startM] = this.newSlotTime.split(':').map(Number);
    const dateObj = new Date();
    dateObj.setHours(startH, startM, 0);
    dateObj.setHours(dateObj.getHours() + hours);
    dateObj.setMinutes(dateObj.getMinutes() + minutes);

    const endH = dateObj.getHours().toString().padStart(2, '0');
    const endM = dateObj.getMinutes().toString().padStart(2, '0');
    const endTimeStr = `${endH}:${endM}:00`;

    const newSlot = {
      date: this.newSlotDate,
      startTime: `${this.newSlotTime}:00`,
      endTime: endTimeStr,
      availableSpots: this.experienceForm.get('maxGroupSize')?.value,
      customPrice: this.experienceForm.get('pricePerPerson')?.value
    };

    this.tempSlots.update(slots => [...slots, newSlot]);
    
    this.newSlotDate = '';
    this.newSlotTime = '';
  }

  // ✅ NEW: حذف موعد من القائمة المؤقتة
  removeSlot(index: number): void {
    this.tempSlots.update(slots => slots.filter((_, i) => i !== index));
  }

  deleteExistingSlot(slotId: number): void {
    if(!confirm('Delete this schedule?')) return;
    this.experienceService.deleteAvailability(slotId).subscribe({
      next: () => {
        this.existingSlots.update(slots => slots.filter(s => s.id !== slotId));
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.experienceForm.invalid) {
      this.experienceForm.markAllAsTouched();
      alert('Please fill in all required fields marked with *');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValues = this.experienceForm.value;
    formValues.categoryId = Number(formValues.categoryId);

    try {
      let currentExpId = this.experienceId;

      if (this.isEditMode && this.experienceId) {
        const dto: UpdateExperienceDto = { ...formValues, languageCodes: this.selectedLanguages };
        await firstValueFrom(this.experienceService.updateExperience(this.experienceId, dto));
      } else {
        const dto: CreateExperienceDto = { ...formValues, languageCodes: this.selectedLanguages };
        const response = await firstValueFrom(this.experienceService.createExperience(dto));
        if (response.success) {
          currentExpId = response.data.id;
          this.experienceId = currentExpId;
        }
      }

      if (currentExpId && this.tempSlots().length > 0) {
        const slots = this.tempSlots();
        for (const slot of slots) {
          const availabilityDto: CreateAvailabilityDto = {
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            availableSpots: slot.availableSpots,
            customPrice: slot.customPrice
          };
          
          await firstValueFrom(this.experienceService.addAvailability(currentExpId, availabilityDto));
        }
      }

      alert('Saved successfully!');
      
      // ✅ التوجيه لصفحة التجارب الخاصة بالهوست
      this.router.navigate(['/host/experiences']);

    } catch (err: any) {
      console.error('Save Error:', err);
      this.error.set(err.error?.message || 'Failed to save');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // --- Image Handling ---
  onFileSelected(event: any): void {
    if (!this.experienceId) return;
    
    const file: File = event.target.files[0];
    if (file) {
      this.isUploading.set(true);
      this.experienceService.uploadImage(this.experienceId, file).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadExperienceDetails(this.experienceId!);
          }
          this.isUploading.set(false);
        },
        error: (err) => {
          console.error(err);
          alert('Failed to upload image');
          this.isUploading.set(false);
        }
      });
    }
  }

  deleteImage(imageId: number): void {
    if(!confirm('Delete this image?')) return;
    this.experienceService.deleteImage(imageId).subscribe({
      next: () => this.loadExperienceDetails(this.experienceId!)
    });
  }

  setPrimaryImage(imageId: number): void {
    this.experienceService.setPrimaryImage(imageId).subscribe({
      next: () => this.loadExperienceDetails(this.experienceId!)
    });
  }

  getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:image')) return imageUrl; // data:image عشان الـ Preview
  
  const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${cleanPath}`;
}

  cancel(): void {
    this.router.navigate(['/host/experiences']);
  }

  formatTime(time: string): string {
  if (!time) return '';
  
  const [h, m] = time.split(':');
  
  const date = new Date();
  date.setHours(Number(h));
  date.setMinutes(Number(m));
  
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
}
}