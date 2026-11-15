import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage.service';
import { SavedMediaRecord } from '../../core/models/media.models';

@Component({
  selector: 'app-history-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-sheet.component.html',
  styleUrl: './history-sheet.component.css'
})
export class HistorySheetComponent {
  @Output() close = new EventEmitter<void>();

  filterSubfolder: 'all' | 'Images' | 'Videos' = 'all';

  constructor(public storageService: StorageService) {}

  get filteredFiles(): SavedMediaRecord[] {
    const files = this.storageService.savedFiles();
    if (this.filterSubfolder === 'all') return files;
    return files.filter(f => f.subfolder === this.filterSubfolder);
  }

  setFilter(subfolder: 'all' | 'Images' | 'Videos'): void {
    this.filterSubfolder = subfolder;
  }

  async share(record: SavedMediaRecord): Promise<void> {
    await this.storageService.shareFile(record);
  }

  clearAll(): void {
    if (confirm('Clear download history list? Saved files on device storage will remain intact.')) {
      this.storageService.clearHistory();
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }
}
