import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClipboardService } from '../../core/services/clipboard.service';
import { UrlValidatorService, UrlClassification } from '../../core/services/url-validator.service';

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './url-input.component.html',
  styleUrl: './url-input.component.css'
})
export class UrlInputComponent implements OnInit {
  @Input() url = '';
  @Input() isLoading = false;
  @Output() urlChange = new EventEmitter<string>();
  @Output() previewRequest = new EventEmitter<string>();

  isInputFocused = false;

  classification: UrlClassification = {
    isValid: false,
    platform: 'unknown',
    badgeName: 'Enter URL',
    badgeClass: 'badge-muted',
    icon: 'link'
  };

  constructor(
    public clipboardService: ClipboardService,
    private urlValidator: UrlValidatorService
  ) {}

  ngOnInit(): void {
    this.updateClassification(this.url);
    // Check clipboard on load
    this.clipboardService.checkClipboardForUrl();
  }

  onInput(value: string): void {
    this.url = value;
    this.urlChange.emit(this.url);
    this.updateClassification(this.url);
  }

  updateClassification(val: string): void {
    this.classification = this.urlValidator.classify(val);
  }

  async pasteFromClipboard(): Promise<void> {
    const text = await this.clipboardService.readClipboard();
    if (text) {
      this.onInput(text.trim());
      this.clipboardService.dismissDetected();
    }
  }

  pasteDetectedClipboard(): void {
    const detected = this.clipboardService.clipboardDetectedUrl();
    if (detected) {
      this.onInput(detected);
      this.clipboardService.dismissDetected();
      this.submitUrl();
    }
  }

  clearInput(): void {
    this.onInput('');
  }

  submitUrl(): void {
    if (this.url && this.url.trim() && !this.isLoading) {
      this.previewRequest.emit(this.url.trim());
    }
  }
}
