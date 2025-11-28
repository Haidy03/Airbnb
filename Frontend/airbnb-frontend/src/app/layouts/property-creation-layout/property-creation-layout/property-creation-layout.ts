import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-creation-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
   
    <header class="fixed-header">
      <div class="logo" [routerLink]="['/']">
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false">
          <path d="M16 1c-5.5 0-10 4.5-10 10 0 8 10 20 10 20s10-12 10-20c0-5.5-4.5-10-10-10zm0 13.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"></path>
        </svg>
      </div>
      
      <div class="header-actions">
        <button class="btn-secondary" (click)="showQuestions()">Questions?</button>
        <button class="btn-secondary save-exit-btn" (click)="saveAndExit()">Save & exit</button>
      </div>
    </header>

    <!-- ✅ هنا سيتم عرض محتوى الصفحات المتغيرة (Intro, Location, Pricing...) -->
    <div class="step-content">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
   
    .fixed-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: white;
      border-bottom: 1px solid #EBEBEB;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      z-index: 1000;
    }

    .logo svg {
      height: 32px;
      width: 32px;
      fill: #FF385C;
      cursor: pointer;
    }

    .header-actions {
      display: flex;
      gap: 16px;
    }

    .btn-secondary {
      background: white;
      border: 1px solid transparent;
      border-radius: 30px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      color: #222;
    }

    .btn-secondary:hover {
      background: #F7F7F7;
    }

    .save-exit-btn {
      border-color: #DDDDDD;
    }

    .save-exit-btn:hover {
      border-color: #000;
    }

    
    .step-content {
      margin-top: 80px; 
      min-height: calc(100vh - 80px);
    }

    @media (max-width: 768px) {
      .fixed-header { padding: 0 24px; }
    }
  `]
})
export class PropertyCreationLayoutComponent {
  constructor(private router: Router) {}

  saveAndExit() {
   
    this.router.navigate(['/host/properties']);
  }

  showQuestions() {
    alert("Help center coming soon!");
  }
}