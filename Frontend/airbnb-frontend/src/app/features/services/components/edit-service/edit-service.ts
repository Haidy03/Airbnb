import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicesService } from '../../services/service';

@Component({
  selector: 'app-edit-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-service.html',
  styleUrls: ['./edit-service.css']
})
export class EditServiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private servicesService = inject(ServicesService);
  private location = inject(Location);

  serviceId!: number;
  isLoading = signal(true);
  isSaving = signal(false);
  editForm!: FormGroup;
  
  // Time Slots Logic
  timeSlots: string[] = [];
  newTime = '';

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
      locationType: [0, Validators.required] // 0: Mobile, 1: OnSite
    });
  }

  loadServiceData() {
    this.servicesService.getHostServiceDetails(this.serviceId).subscribe({
      next: (res) => {
        const s = res.data;
        
        this.editForm.patchValue({
          title: s.title,
          description: s.description,
          pricePerUnit: s.pricePerUnit,
          maxGuests: s.maxGuests,
          city: s.city,
          locationType: s.locationType === 'Mobile' ? 0 : 1
        });

        this.timeSlots = s.timeSlots || [];
        this.isLoading.set(false);
      },
      error: () => {
        alert('Failed to load service');
        this.goBack();
      }
    });
  }

  // Time Slots Methods
  addTimeSlot(event: any) {
    const time = event.target.value;
    if (time && !this.timeSlots.includes(time)) {
      this.timeSlots.push(time);
      this.timeSlots.sort();
    }
    event.target.value = ''; // Reset input
  }

  removeTimeSlot(index: number) {
    this.timeSlots.splice(index, 1);
  }

  onSubmit() {
    if (this.editForm.invalid) return;

    this.isSaving.set(true);
    const payload = {
      ...this.editForm.value,
      locationType: Number(this.editForm.value.locationType), // Ensure number for Enum
      timeSlots: this.timeSlots
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