import { Injectable, signal } from '@angular/core';

export interface CalendarError {
  type: 'network' | 'validation' | 'permission' | 'server';
  message: string;
  details?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarErrorHandler {
  private errors = signal<CalendarError[]>([]);
  private currentError = signal<CalendarError | null>(null);

  readonly allErrors = this.errors.asReadonly();
  readonly latestError = this.currentError.asReadonly();

  /**
   * Handle calendar-specific errors
   */
  handleError(error: any, context: string): CalendarError {
    console.error(`❌ Calendar Error [${context}]:`, error);

    let calendarError: CalendarError;

    // Network errors
    if (error.status === 0 || error.statusText === 'Unknown Error') {
      calendarError = {
        type: 'network',
        message: 'Connection lost. Please check your internet and try again.',
        details: error,
        timestamp: new Date()
      };
    }
    // Validation errors
    else if (error.status === 400) {
      calendarError = {
        type: 'validation',
        message: error.error?.message || 'Invalid data. Please check your input.',
        details: error.error?.errors,
        timestamp: new Date()
      };
    }
    // Permission errors
    else if (error.status === 401 || error.status === 403) {
      calendarError = {
        type: 'permission',
        message: 'You don\'t have permission to perform this action.',
        details: error,
        timestamp: new Date()
      };
    }
    // Server errors
    else {
      calendarError = {
        type: 'server',
        message: error.error?.message || 'Something went wrong. Please try again.',
        details: error,
        timestamp: new Date()
      };
    }

    // Store error
    this.currentError.set(calendarError);
    this.errors.update(errors => [...errors, calendarError]);

    return calendarError;
  }

  /**
   * Clear current error
   */
  clearError(): void {
    this.currentError.set(null);
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errors.set([]);
    this.currentError.set(null);
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(error: CalendarError): string {
    switch (error.type) {
      case 'network':
        return '🌐 Connection Issue: Please check your internet connection';
      case 'validation':
        return '⚠️ Invalid Data: ' + error.message;
      case 'permission':
        return '🔒 Access Denied: ' + error.message;
      case 'server':
        return '⚙️ Server Error: ' + error.message;
      default:
        return error.message;
    }
  }

  /**
   * Should retry operation
   */
  shouldRetry(error: CalendarError): boolean {
    return error.type === 'network' || error.type === 'server';
  }

  /**
   * Get retry delay in ms
   */
  getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s
    return Math.min(1000 * Math.pow(2, attemptNumber), 8000);
  }
}