// src/app/services/listing.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Listing } from '../models/listing-model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ListingService {

  // هذا الرابط سيتم تفعيله عندما ينتهي زميلك من الباك إند
  private apiUrl = `${environment.apiUrl}/Search`;

  constructor(private http: HttpClient) { }

  getListingById(id: string): Observable<Listing> {
   return this.http.get<Listing>(`${this.apiUrl}/${id}`);
   // return of(this.MOCK_LISTING);

    
  }

  // === بيانات وهمية للتجربة (نفس بيانات Airbnb في الصور) ===
  private MOCK_LISTING: Listing = {
    id: '1',
    title: 'Brassbell By the Pyramids Studio & Grand Museum',
    location: 'Kafr Nassar, Giza Governorate, Egypt',
    description: 'Stay in our clean, studio apartment just 5 minutes from the Pyramids and new museum. Our home has a fully-equipped kitchen and cozy living area. Enjoy high-speed internet and a 55-inch smart TV. Conveniently located with easy access to top attractions.',
    images: [
      'https://a0.muscache.com/im/pictures/miso/Hosting-1049259544397397726/original/5502d64a-2517-4860-844c-02db44d70d69.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1049259544397397726/original/d8630737-4b72-466d-8877-33f7d45f3299.jpeg?im_w=720',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1049259544397397726/original/b3827170-8260-496a-bf09-2d2023a10974.jpeg?im_w=720',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1049259544397397726/original/c412e612-421b-4d7a-b510-749e7b300f22.jpeg?im_w=720',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1049259544397397726/original/23477140-5712-4a0b-876a-39f80a472c67.jpeg?im_w=720'
    ],
    pricePerNight: 2229,
    currency: 'EGP',
    rating: 4.93,
    reviewsCount: 14,
    maxGuests: 2,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    host: {
      id: 'h1',
      name: 'Brassbell',
      avatarUrl: 'https://a0.muscache.com/im/pictures/user/User-438994961/original/20d85942-320d-45ad-9b88-5111b7d56637.jpeg?im_w=240',
      isSuperhost: true,
      joinedDate: '2018'
    },
    amenities: [
      { icon: 'fa-solid fa-wifi', name: 'Wifi' },
      { icon: 'fa-solid fa-tv', name: 'TV' },
      { icon: 'fa-solid fa-elevator', name: 'Elevator' },
      { icon: 'fa-solid fa-snowflake', name: 'Air conditioning' },
      { icon: 'fa-solid fa-kitchen-set', name: 'Kitchen' }
    ],
     // 1. أرقام الفئات (من 5)
  ratingBreakdown: {
    cleanliness: 5.0,
    accuracy: 4.9,
    communication: 4.8,
    location: 4.9,
    checkIn: 5.0,
    value: 4.7
  },

  // 2. قائمة التعليقات
  reviews: [
    {
      id: 'r1',
      authorName: 'Mohamed',
      authorAvatar: 'https://a0.muscache.com/im/users/3272332/profile_pic/1423232232/original.jpg', // أي صورة
      country: 'Cairo, Egypt',
      date: 'November 2025',
      comment: 'The place was amazing! The view of the Pyramids is breathtaking. Highly recommended.'
    },
    {
      id: 'r2',
      authorName: 'Sarah',
      authorAvatar: 'https://a0.muscache.com/im/pictures/user/User-438994961/original/20d85942-320d-45ad-9b88-5111b7d56637.jpeg?im_w=240',
      country: 'London, UK',
      date: 'October 2025',
      comment: 'Very clean and cozy. The host was very responsive and helpful. Check-in was smooth.'
    },
    {
      id: 'r3',
      authorName: 'John',
      authorAvatar: '', // لو مفيش صورة هنعرض حرف
      country: 'New York, USA',
      date: 'September 2025',
      comment: 'Good value for money. A bit noisy at night but acceptable given the location.'
    },
    {
      id: 'r4',
      authorName: 'Yousuh',
      authorAvatar: '',
      country: 'Johannesburg, South Africa',
      date: 'August 2025',
      comment: 'These apartments are really well kept, the places are clean, the service is great and the hosts are amazing.'
    }
  ]


  };

}
