import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
<<<<<<< HEAD
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';

=======
>>>>>>> 221cd89216df6657bd4a1a742d2898ca29234b85
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
<<<<<<< HEAD

importProvidersFrom(FormsModule),

    // --- HTTP Client ---
    provideHttpClient(),

    // --- Router Setup ---
    provideRouter(routes),
=======
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi())
>>>>>>> 221cd89216df6657bd4a1a742d2898ca29234b85
  ]
};
