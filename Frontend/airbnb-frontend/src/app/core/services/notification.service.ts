import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private primaryColor = '#E31C5F';

  constructor() { }


  showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
      confirmButtonColor: this.primaryColor,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'px-4 py-2 rounded-3 fw-bold'
      }
    });
  }

 
  showSuccess(title: string, message: string = '') {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonColor: '#222',
      confirmButtonText: 'Great!',
      customClass: {
        popup: 'rounded-4 shadow-lg'
      }
    });
  }


  showToast(icon: 'success' | 'error' | 'info' | 'warning', title: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    Toast.fire({
      icon: icon,
      title: title
    });
  }


  async confirmAction(
    title: string, 
    text: string, 
    confirmButtonText: string = 'Yes', 
    cancelButtonText: string = 'Cancel'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#222222',
      cancelButtonColor: '#ffffff',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'px-4 py-2 rounded-3 fw-bold border-0',
        cancelButton: 'px-4 py-2 rounded-3 fw-bold text-dark border border-secondary me-2' 
      }
    });

    return result.isConfirmed;
  }
}