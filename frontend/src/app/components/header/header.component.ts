import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() openSettings = new EventEmitter<void>();
  @Output() openHistory = new EventEmitter<void>();

  constructor(
    public themeService: ThemeService,
    public apiService: ApiService,
    public storageService: StorageService
  ) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
