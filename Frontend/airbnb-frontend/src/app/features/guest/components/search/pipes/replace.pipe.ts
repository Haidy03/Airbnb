import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
  standalone: true,
})
export class ReplacePipe implements PipeTransform {
  /**
   * Replaces occurrences of a string with a replacement string globally.
   * @param value The input string.
   * @param pattern The string pattern to search for.
   * @param replacement The string to replace the pattern with.
   */
  transform(value: string, pattern: string, replacement: string): string {
    if (!value || !pattern) {
      return value;
    }
    const regex = new RegExp(pattern, 'g');
    return value.replace(regex, replacement);
  }
}
