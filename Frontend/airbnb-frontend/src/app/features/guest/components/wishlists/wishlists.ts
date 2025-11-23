import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-wishlists',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './wishlists.html',
  styleUrls: ['./wishlists.css']
})
export class WishlistsComponent implements OnInit {
  constructor(public wishlistService: WishlistService) {}

  ngOnInit(): void {}
}
