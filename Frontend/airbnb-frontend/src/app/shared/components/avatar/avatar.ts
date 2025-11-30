import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-container" [style.width.px]="size" [style.height.px]="size">
      <img 
        *ngIf="!imageError && imageUrl" 
        [src]="imageUrl" 
        [alt]="name"
        (error)="onImageError()"
        class="avatar-img">
      
      <div 
        *ngIf="imageError || !imageUrl" 
        class="avatar-initial"
        [style.background-color]="getColor()"
        [style.font-size.px]="size * 0.4">
        {{ getInitial() }}
      </div>
    </div>
  `,
  styles: [`
    .avatar-container {
      position: relative;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-initial {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #222222;
      font-weight: 600;
      text-transform: uppercase;
    }
  `]
})
export class AvatarComponent {
  @Input() imageUrl?: string;
  @Input() name: string = 'User';
  @Input() size: number = 48;

  imageError = false;

  onImageError() {
    this.imageError = true;
  }

  getInitial(): string {
    if (!this.name) return 'U';
    return this.name.charAt(0).toUpperCase();
  }

  getColor(): string {
    // ألوان فاتحة مع نص أسود
    const colors = [
      '#FFE4E6', // وردي فاتح
      '#DBEAFE', // أزرق فاتح
      '#FEF3C7', // أصفر فاتح
      '#D1FAE5', // أخضر فاتح
      '#E9D5FF', // بنفسجي فاتح
      '#FED7AA', // برتقالي فاتح
      '#FEE2E2', // أحمر فاتح
      '#E0E7FF', // نيلي فاتح
    ];
    
    const hash = this.name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }
}