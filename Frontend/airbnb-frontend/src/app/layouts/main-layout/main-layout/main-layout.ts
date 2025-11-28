import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './../../../shared/components/toast/toast';
import { FooterComponent } from './../../../shared/components/footer/footer';
import { HeaderComponent } from './../../../features/guest/components/header/header';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent,ToastComponent,], 
  template: `
    
    <app-header></app-header>
    
    <main>
      <router-outlet></router-outlet>
    </main>
    
    <app-footer></app-footer>
    <app-toast></app-toast>
  `
})
export class MainLayoutComponent {}