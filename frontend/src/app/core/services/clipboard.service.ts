import { Injectable, signal } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  clipboardDetectedUrl = signal<string | null>(null);

  async readClipboard(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Clipboard.read();
        return value || null;
      } else if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        return text || null;
      }
    } catch {
      // Gracefully ignore permission denials or unsupported browsers
    }
    return null;
  }

  async copyText(text: string): Promise<boolean> {
    try {
      await Clipboard.write({ string: text });
      return true;
    } catch {
      return false;
    }
  }

  async checkClipboardForUrl(): Promise<string | null> {
    const text = await this.readClipboard();
    if (text) {
      const trimmed = text.trim();
      if (this.isLikelySupportedUrl(trimmed)) {
        this.clipboardDetectedUrl.set(trimmed);
        return trimmed;
      }
    }
    this.clipboardDetectedUrl.set(null);
    return null;
  }

  dismissDetected(): void {
    this.clipboardDetectedUrl.set(null);
  }

  private isLikelySupportedUrl(str: string): boolean {
    if (!str) return false;
    const lower = str.toLowerCase();
    return (
      lower.startsWith('demo://') ||
      lower.includes('instagram.com/p/') ||
      lower.includes('instagram.com/reel/') ||
      lower.includes('twitter.com/') ||
      lower.includes('x.com/') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.mp4')
    );
  }
}
