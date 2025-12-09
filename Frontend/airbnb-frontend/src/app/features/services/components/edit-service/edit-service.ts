import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ServicesService } from '../../services/service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-edit-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './edit-service.html',
  styleUrls: ['./edit-service.css']
})
export class EditServiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private servicesService = inject(ServicesService);
  private location = inject(Location);

  serviceId!: number;
  isLoading = signal(true);
  isSaving = signal(false);
  isUploading = signal(false); // لحالة رفع الصور
  editForm!: FormGroup;
  
  // --- Availability Data ---
  duration = 60; // Default 1 hour
  slots: { day: number, time: string }[] = [];
  
  // Temp inputs for adding slots
  tempDay: number = 0;
  tempTime: string = '';

  days = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  // --- Images Data ---
  images: any[] = []; 

  ngOnInit() {
    this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadServiceData();
  }

  initForm() {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      pricePerUnit: [0, [Validators.required, Validators.min(1)]],
      maxGuests: [1, [Validators.required, Validators.min(1)]],
      city: ['', Validators.required],
      locationType: [0, Validators.required]
    });
  }

  loadServiceData() {
    this.servicesService.getHostServiceDetails(this.serviceId).subscribe({
      next: (res) => {
        const s = res.data;
        
        // 1. Fill Basic Form
        this.editForm.patchValue({
          title: s.title,
          description: s.description,
          pricePerUnit: s.pricePerUnit,
          maxGuests: s.maxGuests,
          city: s.city,
          locationType: s.locationType === 'Mobile' ? 0 : 1
        });

        // 2. Fill Availability
        this.duration = s.durationMinutes || 60;
        
        if (s.availabilities) {
          this.slots = s.availabilities.map((a: any) => ({
            day: a.dayOfWeek, 
            time: a.startTime 
          }));
        }

        // 3. Fill Images
        // ملاحظة: تأكدي أن الباك إند يرجع قائمة كائنات فيها id و url
        if (s.images) {
           // في حالة الباك إند تم تحديثه ليرجع كائنات
           // إذا كان مازال يرجع Strings، الكود سيحتاج تعديل، لكن سنفترض التحديث
           this.images = s.images.map((img: any) => ({
             id: img.id,
             url: this.getImageUrl(img.url),
             isCover: img.isCover
           }));
        }

        this.isLoading.set(false);
      },
      error: () => {
        alert('Failed to load service');
        this.goBack();
      }
    });
  }

  // --- Availability Logic ---

  getDayName(id: number): string {
    return this.days.find(d => d.id == id)?.name || 'Unknown';
  }

  addSlot() {
    const day = Number(this.tempDay);
    const time = this.tempTime;

    if (time) {
      const exists = this.slots.some(s => s.day === day && s.time === time);
      if (!exists) {
        this.slots.push({ day, time });
        // ترتيب المواعيد
        this.slots.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
      }
    }
  }

  removeSlot(index: number) {
    this.slots.splice(index, 1);
  }

  // --- Image Logic ---

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading.set(true);
      this.servicesService.uploadImage(this.serviceId, file).subscribe({
        next: () => {
          this.loadServiceData(); // إعادة تحميل البيانات لجلب الصورة الجديدة بالـ ID
          this.isUploading.set(false);
        },
        error: () => {
          alert('Failed to upload image');
          this.isUploading.set(false);
        }
      });
    }
  }

  deleteImg(imageId: number) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    this.servicesService.deleteImage(imageId).subscribe({
      next: () => {
        this.images = this.images.filter(img => img.id !== imageId);
      },
      error: () => alert('Failed to delete image')
    });
  }

  setCover(imageId: number) {
    this.servicesService.setCoverImage(imageId).subscribe({
      next: () => {
        this.images.forEach(img => {
            img.isCover = (img.id === imageId);
        });
      },
      error: () => alert('Failed to set cover image')
    });
  }

  getImageUrl(url: string) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}/${url.startsWith('/') ? url.substring(1) : url}`;
  }

  // --- Submit & Navigation ---

  onSubmit() {
    if (this.editForm.invalid) return;

    this.isSaving.set(true);
    
    const payload = {
      ...this.editForm.value,
      locationType: Number(this.editForm.value.locationType),
      
    
      DurationMinutes: this.duration,
      AvailabilityJson: JSON.stringify(this.slots) 
    };

    this.servicesService.updateService(this.serviceId, payload).subscribe({
      next: () => {
        alert('Service updated successfully!');
        this.goBack();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update service');
        this.isSaving.set(false);
      }
    });
  }

  goBack() {
    this.location.back();
  }
}