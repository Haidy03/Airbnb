import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SearchBarComponent } from './features/guest/components/search/components/search-bar/search-bar';
import { SearchResultsComponent } from './features/guest/components/search/components/search-results/search-results';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SearchBarComponent,
    SearchResultsComponent // 👈 ده كان ناقص
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Airbnb Frontend');
}
