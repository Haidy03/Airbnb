// components/forgot-password/forgot-password.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forogt-password.component.html',
  styleUrls: ['./forogt-password.component.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private modalService = inject(ModalService);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.forgotPasswordForm.value.email!;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
        
        // إغلاق النافذة بعد 3 ثواني
        setTimeout(() => {
          this.closeModal();
        }, 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }

  openLoginModal(event: Event) {
    event.preventDefault();
    this.closeModal();
    // سنقوم بتنفيذ هذا لاحقاً
  }

  closeModal() {
    this.modalService.close();
  }
}