import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

type RoomType = 'entire_place' | 'private_room' | 'shared_room' | 'hotel_room';

interface RoomTypeOption {
  id: RoomType;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-property-room-type',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './room-type.html',
  styleUrls: ['./room-type.css']
  
 
})
export class PropertyRoomTypeComponent implements OnInit {
  selectedType = signal<RoomType | null>(null);
  
  roomTypes: RoomTypeOption[] = [
    {
      id: 'entire_place',
      title: 'An entire place',
      description: 'Guests have the whole place to themselves',
      icon: '🏠'
    },
    {
      id: 'private_room',
      title: 'A private room',
      description: 'Guests have their own room in a home, plus access to shared spaces',
      icon: '🚪'
    },
    {
      id: 'shared_room',
      title: 'A shared room',
      description: 'Guests sleep in a room or common area that may be shared with others',
      icon: '🛏️'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('room_type');
    if (saved) {
      this.selectedType.set(saved as RoomType);
    }
  }

  selectRoomType(type: RoomType): void {
    this.selectedType.set(type);
  }

  saveAndExit(): void {
    if (this.selectedType()) {
      localStorage.setItem('room_type', this.selectedType()!);
    }
    this.router.navigate(['/host/properties']);
  }

  showQuestionsModal(): void {
    alert('Questions? Contact support.');
  }

  goBack(): void {
    this.router.navigate(['/host/properties/property-type']);
  }

  goNext(): void {
    if (!this.selectedType()) {
      alert('Please select a room type.');
      return;
    }
    
    localStorage.setItem('room_type', this.selectedType()!);
    this.router.navigate(['/host/properties/location']);
  }
}