import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'mediavault_theme';
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved !== null) {
      this.setDarkMode(saved === 'dark');
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    }
  }

  toggleTheme(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
    }
  }
}
