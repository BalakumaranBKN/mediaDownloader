import { Injectable, signal } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { MediaType, SavedMediaRecord } from '../models/media.models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly APP_FOLDER = 'MediaVault';
  private readonly IMAGES_FOLDER = 'MediaVault/Images';
  private readonly VIDEOS_FOLDER = 'MediaVault/Videos';
  private readonly HISTORY_KEY = 'mediavault_download_history';

  savedFiles = signal<SavedMediaRecord[]>([]);
  directoriesInitialized = signal<boolean>(false);
  lastSavedRecord = signal<SavedMediaRecord | null>(null);

  constructor() {
    this.loadHistory();
    this.initDirectories();
  }

  /**
   * Initializes the user-accessible folders on first launch:
   * MediaVault/
   *   ├── Images/
   *   └── Videos/
   */
  async initDirectories(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      this.directoriesInitialized.set(true);
      return true;
    }

    try {
      // Check and request storage permissions
      const permStatus = await Filesystem.checkPermissions();
      if (permStatus.publicStorage !== 'granted') {
        const req = await Filesystem.requestPermissions();
        if (req.publicStorage !== 'granted') {
          console.warn('Storage permission not granted, will use app data sandbox.');
        }
      }

      // Ensure root app folder MediaVault exists
      await this.safeMkdir(this.APP_FOLDER, Directory.Documents);
      // Ensure MediaVault/Images exists
      await this.safeMkdir(this.IMAGES_FOLDER, Directory.Documents);
      // Ensure MediaVault/Videos exists
      await this.safeMkdir(this.VIDEOS_FOLDER, Directory.Documents);

      this.directoriesInitialized.set(true);
      return true;
    } catch (err) {
      console.error('Failed to initialize directories in Documents; attempting Data fallback:', err);
      try {
        await this.safeMkdir(this.APP_FOLDER, Directory.Data);
        await this.safeMkdir(this.IMAGES_FOLDER, Directory.Data);
        await this.safeMkdir(this.VIDEOS_FOLDER, Directory.Data);
        this.directoriesInitialized.set(true);
        return true;
      } catch (fallbackErr) {
        console.error('Failed fallback directory creation:', fallbackErr);
        return false;
      }
    }
  }

  private async safeMkdir(path: string, directory: Directory): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory,
        recursive: true
      });
    } catch (e: any) {
      // Directory may already exist (e.g. os error 17 or "exists")
      if (!e?.message?.toLowerCase().includes('exist')) {
        throw e;
      }
    }
  }

  /**
   * Saves a downloaded blob to the appropriate MediaVault subfolder
   */
  async saveBlob(blob: Blob, filename: string, type: MediaType): Promise<SavedMediaRecord> {
    const isVideo = type === 'video';
    const subfolder: 'Images' | 'Videos' = isVideo ? 'Videos' : 'Images';
    const relativePath = `${isVideo ? this.VIDEOS_FOLDER : this.IMAGES_FOLDER}/${filename}`;
    const targetDir = Directory.Documents;

    let fullSavedUri = relativePath;

    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToBase64(blob);
        // Write to device storage
        const result = await Filesystem.writeFile({
          path: relativePath,
          data: base64Data,
          directory: targetDir,
          recursive: true
        });

        fullSavedUri = result.uri;

        await Toast.show({
          text: `Saved to MediaVault/${subfolder}/${filename}`,
          duration: 'short'
        });
      } catch (err: any) {
        console.warn('Documents write failed, attempting Data sandbox write:', err);
        const base64Data = await this.blobToBase64(blob);
        const fallbackResult = await Filesystem.writeFile({
          path: relativePath,
          data: base64Data,
          directory: Directory.Data,
          recursive: true
        });
        fullSavedUri = fallbackResult.uri;
      }
    } else {
      // Web fallback: Trigger browser download anchor
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      fullSavedUri = `Downloads/${filename}`;
    }

    const record: SavedMediaRecord = {
      id: `save-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      filename,
      subfolder,
      type,
      path: fullSavedUri,
      timestamp: Date.now(),
      size_bytes: blob.size
    };

    this.lastSavedRecord.set(record);
    this.addHistory(record);
    return record;
  }

  async shareFile(record: SavedMediaRecord): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const canShare = await Share.canShare();
        if (canShare.value) {
          await Share.share({
            title: record.filename,
            text: `Media downloaded via MediaVault: ${record.filename}`,
            url: record.path,
            dialogTitle: 'Open / Share Media'
          });
          return true;
        }
      } else {
        if (navigator.share) {
          await navigator.share({
            title: record.filename,
            text: `Media from MediaVault: ${record.filename}`
          });
          return true;
        }
      }
    } catch (err) {
      console.warn('Share not completed:', err);
    }
    return false;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Strip data:*;base64, prefix for Capacitor Filesystem
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private loadHistory(): void {
    try {
      const raw = localStorage.getItem(this.HISTORY_KEY);
      if (raw) {
        this.savedFiles.set(JSON.parse(raw));
      }
    } catch {
      this.savedFiles.set([]);
    }
  }

  private addHistory(record: SavedMediaRecord): void {
    const current = [record, ...this.savedFiles()].slice(0, 50);
    this.savedFiles.set(current);
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(current));
    } catch {}
  }

  clearHistory(): void {
    this.savedFiles.set([]);
    localStorage.removeItem(this.HISTORY_KEY);
  }
}
