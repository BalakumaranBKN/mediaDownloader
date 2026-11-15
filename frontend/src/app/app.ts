import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { UrlInputComponent } from './components/url-input/url-input.component';
import { SamplePickerComponent } from './components/sample-picker/sample-picker.component';
import { MediaPreviewComponent } from './components/media-preview/media-preview.component';
import { DownloadTrackerComponent } from './components/download-tracker/download-tracker.component';
import { HistorySheetComponent } from './components/history-sheet/history-sheet.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';
import { ApiService } from './core/services/api.service';
import { StorageService } from './core/services/storage.service';
import { ThemeService } from './core/services/theme.service';
import { PreviewResponse, MediaItem, DownloadJob } from './core/models/media.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    UrlInputComponent,
    SamplePickerComponent,
    MediaPreviewComponent,
    DownloadTrackerComponent,
    HistorySheetComponent,
    SettingsModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  currentUrl = signal<string>('');
  isLoadingPreview = signal<boolean>(false);
  previewData = signal<PreviewResponse | null>(null);
  activeJobs = signal<DownloadJob[]>([]);
  errorMessage = signal<string | null>(null);

  showSettings = signal<boolean>(false);
  showHistory = signal<boolean>(false);

  constructor(
    public apiService: ApiService,
    public storageService: StorageService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Check initial backend connectivity
    this.apiService.testConnection();
  }

  onUrlChange(url: string): void {
    this.currentUrl.set(url);
  }

  onSelectSample(url: string): void {
    this.currentUrl.set(url);
    this.loadPreview(url);
  }

  loadPreview(urlToPreview?: string): void {
    const url = urlToPreview || this.currentUrl();
    if (!url || !url.trim()) return;

    this.isLoadingPreview.set(true);
    this.errorMessage.set(null);

    this.apiService.previewUrl(url.trim()).subscribe({
      next: (response) => {
        this.isLoadingPreview.set(false);
        this.previewData.set(response);
      },
      error: (err) => {
        this.isLoadingPreview.set(false);
        this.errorMessage.set(
          err?.error?.detail ||
          err?.message ||
          'Failed to connect to backend server. Make sure the FastAPI service is running and accessible.'
        );
      }
    });
  }

  downloadSingleItem({ item, muted }: { item: MediaItem; muted: boolean }): void {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const job: DownloadJob = {
      id: jobId,
      item,
      filename: item.filename,
      media_type: item.type,
      status: 'downloading',
      progress: 5,
      muted,
      timestamp: Date.now()
    };

    this.activeJobs.update(jobs => [job, ...jobs]);

    this.apiService.downloadMediaWithProgress(item.media_url, item.filename, muted).subscribe({
      next: async (event) => {
        if (event.blob) {
          try {
            const saved = await this.storageService.saveBlob(event.blob, item.filename, item.type);
            this.updateJob(jobId, {
              status: 'completed',
              progress: 100,
              saved_path: saved.path
            });
          } catch (saveErr: any) {
            this.updateJob(jobId, {
              status: 'failed',
              error_message: saveErr?.message || 'Storage write failed'
            });
          }
        } else {
          this.updateJob(jobId, { progress: event.progress });
        }
      },
      error: (err) => {
        this.updateJob(jobId, {
          status: 'failed',
          error_message: err?.error?.detail || err?.message || 'Download stream disconnected'
        });
      }
    });
  }

  downloadBatchItems({ items, muted }: { items: MediaItem[]; muted: boolean }): void {
    for (const item of items) {
      this.downloadSingleItem({ item, muted });
    }
  }

  private updateJob(jobId: string, partial: Partial<DownloadJob>): void {
    this.activeJobs.update(jobs =>
      jobs.map(j => (j.id === jobId ? { ...j, ...partial } : j))
    );
  }

  dismissJob(jobId: string): void {
    this.activeJobs.update(jobs => jobs.filter(j => j.id !== jobId));
  }

  retryJob(job: DownloadJob): void {
    this.dismissJob(job.id);
    this.downloadSingleItem({ item: job.item, muted: !!job.muted });
  }

  dismissError(): void {
    this.errorMessage.set(null);
  }
}
