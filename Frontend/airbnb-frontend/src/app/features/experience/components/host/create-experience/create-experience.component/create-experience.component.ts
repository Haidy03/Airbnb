import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExperienceService } from '../../../../../../shared/Services/experience.service';
import { ExperienceCategory, CreateExperienceDto, UpdateExperienceDto, Experience } from '../../../../../../shared/models/experience.model';

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
  
  experienceTypes = [
    { value: 'InPerson', label: 'In-Person', icon: '🏃' },
    { value: 'Online', label: 'Online', icon: '💻' },
    { value: 'Adventure', label: 'Adventure', icon: '🏔️' }
  ];
  
  languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' }
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
    }
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

  onSubmit(): void {
    // ✅ 1. التحقق من صحة الفورم وطباعة الأخطاء في الكونسول
    if (this.experienceForm.invalid) {
      this.experienceForm.markAllAsTouched();
      
      // كود عشان نعرف إيه الحقل اللي فيه مشكلة
      const controls = this.experienceForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          console.error(`Invalid Field: ${name}`, controls[name].errors);
        }
      }
      
      alert('Please fill in all required fields marked with *');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValues = this.experienceForm.value;
    formValues.categoryId = Number(formValues.categoryId); 

    if (this.isEditMode && this.experienceId) {
      const dto: UpdateExperienceDto = {
        ...formValues,
        languageCodes: this.selectedLanguages
      };

      this.experienceService.updateExperience(this.experienceId, dto).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Experience updated successfully!');
            this.loadExperienceDetails(this.experienceId!);
          }
          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Update Error:', error);
          this.error.set(error.error?.message || 'Failed to update');
          this.isSubmitting.set(false);
        }
      });

    } else {
      const dto: CreateExperienceDto = {
        ...formValues,
        languageCodes: this.selectedLanguages
      };

      this.experienceService.createExperience(dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.isEditMode = true;
            this.experienceId = response.data.id;
            this.existingExperience.set(response.data);
            alert('Experience created! You can now upload photos.');
            window.history.replaceState({}, '', `/host/experiences/${this.experienceId}/edit`);
          }
          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Create Error:', error);
          this.error.set(error.error?.message || 'Failed to create');
          this.isSubmitting.set(false);
        }
      });
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

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return url; 
  }

  cancel(): void {
    this.router.navigate(['/host/experiences']);
  }
}