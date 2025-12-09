import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

 
  private primaryColor = '#E31C5F'; 

  constructor() { }

  showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Booking Failed',
      text: message,
      confirmButtonColor: this.primaryColor,
      confirmButtonText: 'OK',
      background: '#fff',
      iconColor: this.primaryColor,
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

 
  showToast(icon: 'success' | 'error', title: string) {
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
}