import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// شلنا HeaderComponent من الـ imports لأنه بقى Global
import { WishlistService } from '../../services/wishlist.service';
import { Property } from '../search/models/property.model';
import { ToastService } from '../../../../core/services/toast.service'; // لو عايز إشعار عند الحذف

@Component({
  selector: 'app-wishlists',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlists.html',
  styleUrls: ['./wishlists.css']
})
export class WishlistsComponent implements OnInit {

  wishlistItems: Property[] = [];

  constructor(
    public wishlistService: WishlistService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistItems = items;
    });

    // تحديث القائمة عند فتح الصفحة
    this.wishlistService.loadWishlist();
  }

  removeFromWishlist(id: string) {
    this.wishlistService.toggleWishlist(Number(id)).subscribe(() => {
        this.toastService.show('Removed from wishlist', 'success');
    });
  }
}
