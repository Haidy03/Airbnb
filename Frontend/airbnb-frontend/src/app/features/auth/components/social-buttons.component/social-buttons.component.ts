import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-social-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-buttons.component.html',
  styleUrls: ['./social-buttons.component.css']
})
export class SocialButtonsComponent {
  @Output() socialLogin = new EventEmitter<string>();

  providers: SocialProvider[] = [
   //{ id: 'google', name: 'Continue with Google', icon: 'google' },
    //{ id: 'apple', name: 'Continue with Apple', icon: 'apple' },
    { id: 'email', name: 'Continue with email', icon: 'email' },
    //{ id: 'facebook', name: 'Continue with Facebook', icon: 'facebook' }
  ];

  onProviderClick(providerId: string) {
    this.socialLogin.emit(providerId);
  }
}
