import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { WishlistService } from '../../services/wishlist.service';
import { Property } from '../home/home'; // Import interface

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
    // الاشتراك في السيرفس عشان أي تغيير يحصل يظهر فوراً
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistItems = items;
    });
  }

  removeFromWishlist(id: number) {
    this.wishlistService.removeFromWishlist(id);
  }
}
