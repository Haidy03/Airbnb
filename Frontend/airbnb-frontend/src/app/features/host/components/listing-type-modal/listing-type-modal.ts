import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listing-type-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        
        <!-- Header: Close Button -->
        <div class="modal-header">
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <!-- Title -->
        <h2 class="modal-title">What would you like to host?</h2>

        <!-- Cards Container -->
        <div class="cards-container">
          
          <!-- 1. HOME Card -->
          <div class="selection-card" (click)="select('home')">
            <div class="icon-wrapper home-icon">
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false"><path d="M28 14.86V29a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V14.86L1.75 16.5 1 15.17 16 2l15 13.17-.75 1.33zM25 28V13.54L16 5.64l-9 7.9V28h18z"></path><path d="M11 18h10v10H11z"></path></svg>
            </div>
            <span class="card-label">Home</span>
          </div>

          <!-- 2. EXPERIENCE Card -->
          <div class="selection-card" (click)="select('experience')">
            <div class="icon-wrapper exp-icon">
               <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false"><path d="M16 2a9 9 0 0 1 9 9c0 4.2-2.8 7.8-6.6 8.8l1.3 4.2h3.3v2h-4.6l-1.5 4h-1.8l-1.5-4H9v-2h3.3l1.3-4.2A9.03 9.03 0 0 1 7 11a9 9 0 0 1 9-9zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"></path></svg>
            </div>
            <span class="card-label">Experience</span>
          </div>

          <!-- 3. SERVICE Card -->
          <div class="selection-card" (click)="select('service')">
            <div class="icon-wrapper service-icon">
               <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false"><path d="M28 24v2H4v-2h2v-6c0-5.1 3.9-9.3 8.8-9.9.4-2.5 2.5-4.5 5.2-4.1 2 .3 3.6 1.9 3.9 3.9.1.1.1.2.1.2 4.9.6 8.8 4.8 8.8 9.9v6h2zm-4 0v-6a8 8 0 0 0-16 0v6h16zM16 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>
            </div>
            <span class="card-label">Service</span>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2000; 
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.2s ease-out;
    }
    
    .modal-content {
      background: white;
      width: 90%;
      max-width: 850px;
      border-radius: 16px;
      padding: 24px;
      position: relative;
      box-shadow: 0 8px 28px rgba(0,0,0,0.28);
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 8px;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
    }
    .close-btn:hover { background: #f7f7f7; }

    .modal-title {
      text-align: center;
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 48px;
      color: #222;
    }

    .cards-container {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding-bottom: 40px;
      flex-wrap: wrap;
    }

    .selection-card {
      width: 200px;
      height: 200px;
      border: 1px solid #DDDDDD;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fff;
    }

    .selection-card:hover {
      border-color: #000;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      background-color: #FAFAFA;
    }

    .icon-wrapper {
      margin-bottom: 16px;
      color: #717171;
    }

    .icon-wrapper svg {
        display: block; 
        height: 48px; 
        width: 48px; 
        fill: currentColor;
    }
    
    .selection-card:hover .icon-wrapper {
      color: #222;
    }

    .exp-icon { color: #E0565B; } /* لون مميز للـ Experience */
    
    .card-label {
      font-size: 18px;
      font-weight: 600;
      color: #222;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    @media (max-width: 768px) {
      .cards-container { flex-direction: column; align-items: center; }
      .selection-card { width: 100%; max-width: 300px; height: 100px; flex-direction: row; gap: 24px; justify-content: flex-start; padding-left: 32px; }
      .icon-wrapper { margin-bottom: 0; }
      .icon-wrapper svg { height: 32px; width: 32px; }
    }
  `]
})
export class ListingTypeModalComponent {
  @Output() typeSelected = new EventEmitter<'home' | 'experience' | 'service'>();
  @Output() closeModal = new EventEmitter<void>();

  select(type: 'home' | 'experience' | 'service') {
    this.typeSelected.emit(type);
  }

  close() {
    this.closeModal.emit();
  }
}