import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewResponse, MediaItem, MediaType } from '../../core/models/media.models';

@Component({
  selector: 'app-media-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-preview.component.html',
  styleUrl: './media-preview.component.css'
})
export class MediaPreviewComponent implements OnChanges {
  @Input({ required: true }) preview!: PreviewResponse;
  @Output() downloadSingle = new EventEmitter<{ item: MediaItem; muted: boolean }>();
  @Output() downloadBatch = new EventEmitter<{ items: MediaItem[]; muted: boolean }>();

  // Video download option
  videoAudioOption: 'audio' | 'muted' = 'audio';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preview'] && this.preview?.items) {
      // By default select all items in carousel
      this.preview.items.forEach(item => item.selected = true);
      this.videoAudioOption = 'audio';
    }
  }

  get isCarousel(): boolean {
    return this.preview.media_type === 'carousel' || (this.preview.items && this.preview.items.length > 1);
  }

  get isVideo(): boolean {
    return this.preview.media_type === 'video' || (this.preview.items && this.preview.items.length === 1 && this.preview.items[0].type === 'video');
  }

  get isSingleImage(): boolean {
    return !this.isCarousel && !this.isVideo && this.preview.items && this.preview.items.length === 1;
  }

  // Carousel selection helpers
  get selectedItems(): MediaItem[] {
    return this.preview.items.filter(i => i.selected);
  }

  get allSelected(): boolean {
    return this.preview.items.length > 0 && this.preview.items.every(i => i.selected);
  }

  get noneSelected(): boolean {
    return this.preview.items.every(i => !i.selected);
  }

  selectAll(): void {
    this.preview.items.forEach(i => i.selected = true);
  }

  deselectAll(): void {
    this.preview.items.forEach(i => i.selected = false);
  }

  toggleItem(item: MediaItem): void {
    item.selected = !item.selected;
  }

  triggerSingleDownload(item: MediaItem): void {
    const muted = this.isVideo && this.videoAudioOption === 'muted';
    this.downloadSingle.emit({ item, muted });
  }

  triggerBatchDownload(): void {
    const selected = this.selectedItems;
    if (selected.length > 0) {
      this.downloadBatch.emit({ items: selected, muted: false });
    }
  }

  formatBytes(bytes?: number): string {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }
}
