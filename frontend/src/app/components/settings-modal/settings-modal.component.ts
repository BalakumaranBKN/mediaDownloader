import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PlatformConfig } from '../../core/models/media.models';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.css'
})
export class SettingsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  backendUrlInput = '';
  isTesting = false;
  testResult: { success: boolean; message: string } | null = null;
  platforms: PlatformConfig[] = [];

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.backendUrlInput = this.apiService.apiUrl();
    this.loadPlatforms();
  }

  loadPlatforms(): void {
    this.apiService.getPlatforms().subscribe({
      next: (data) => this.platforms = data,
      error: () => {}
    });
  }

  setPreset(url: string): void {
    this.backendUrlInput = url;
  }

  async testAndSave(): Promise<void> {
    this.isTesting = true;
    this.testResult = null;
    this.apiService.setBackendUrl(this.backendUrlInput);

    const ok = await this.apiService.testConnection();
    this.isTesting = false;
    if (ok) {
      this.testResult = { success: true, message: 'Connected successfully to backend server!' };
      this.loadPlatforms();
    } else {
      this.testResult = {
        success: false,
        message: 'Could not reach backend at this address. Check if backend is running and network is accessible.'
      };
    }
  }
}
