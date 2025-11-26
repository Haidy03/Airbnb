import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { WishlistService } from '../../services/wishlist.service';
import { Property } from '../search/models/property.model';

@Component({
  selector: 'app-wishlists',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './wishlists.html',
  styleUrls: ['./wishlists.css']
})
export class WishlistsComponent implements OnInit {

  wishlistItems: Property[] = [];

  constructor(public wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistItems = items;
    });
  }

  removeFromWishlist(id: string) {
    // الموديل الجديد الـ id سترينج، لكن السيرفس ممكن تكون مستنية رقم
    // لو السيرفس عدلناها تاخد رقم:
    this.wishlistService.removeFromWishlist(Number(id));
  }
}
