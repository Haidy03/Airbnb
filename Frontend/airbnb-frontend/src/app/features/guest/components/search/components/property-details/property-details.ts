import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// Assuming PropertyModel is available
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})

export class PropertyDetailsComponent implements OnInit {

  propertyId: number | null = null;
  propertyDetails: any; // Use 'any' temporarily or PropertyModel

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get the 'id' parameter from the URL path: /property/123
    this.route.paramMap.subscribe(params => {
      this.propertyId = Number(params.get('id'));
      if (this.propertyId) {
        this.fetchPropertyDetails(this.propertyId);
      }
    });
  }

  fetchPropertyDetails(id: number): void {
    // In a real app, you would call SearchService to get details for this ID
    console.log('Fetching details for property ID:', id);
    // ...
  }
}
