import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadJob, SavedMediaRecord } from '../../core/models/media.models';
import { StorageService } from '../../core/services/storage.service';
import { ClipboardService } from '../../core/services/clipboard.service';

@Component({
  selector: 'app-download-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './download-tracker.component.html',
  styleUrl: './download-tracker.component.css'
})
export class DownloadTrackerComponent {
  @Input({ required: true }) jobs: DownloadJob[] = [];
  @Output() dismissJob = new EventEmitter<string>();
  @Output() retryJob = new EventEmitter<DownloadJob>();

  constructor(
    public storageService: StorageService,
    private clipboardService: ClipboardService
  ) {}

  async openOrShare(job: DownloadJob): Promise<void> {
    const record: SavedMediaRecord = {
      id: job.id,
      filename: job.filename,
      subfolder: job.media_type === 'video' ? 'Videos' : 'Images',
      type: job.media_type,
      path: job.saved_path || `MediaVault/${job.media_type === 'video' ? 'Videos' : 'Images'}/${job.filename}`,
      timestamp: job.timestamp
    };
    await this.storageService.shareFile(record);
  }

  async copyPath(path?: string): Promise<void> {
    if (path) {
      await this.clipboardService.copyText(path);
    }
  }
}
