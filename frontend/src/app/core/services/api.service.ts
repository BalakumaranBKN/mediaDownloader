import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { PreviewResponse, SamplePost, PlatformConfig } from '../models/media.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly STORAGE_KEY = 'mediavault_backend_url';
  
  apiUrl = signal<string>(this.detectInitialUrl());
  isConnected = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.testConnection();
  }

  private detectInitialUrl(): string {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) return saved;

    if (Capacitor.isNativePlatform()) {
      // Android emulator default host mapping is 10.0.2.2
      return 'http://10.0.2.2:8000';
    }
    // Browser default
    return 'http://localhost:8000';
  }

  setBackendUrl(url: string): void {
    let clean = url.trim();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    localStorage.setItem(this.STORAGE_KEY, clean);
    this.apiUrl.set(clean);
    this.testConnection();
  }

  async testConnection(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.apiUrl()}/api/health`, { method: 'GET' });
      const ok = resp.ok;
      this.isConnected.set(ok);
      return ok;
    } catch {
      this.isConnected.set(false);
      return false;
    }
  }

  getSamples(): Observable<SamplePost[]> {
    return this.http.get<SamplePost[]>(`${this.apiUrl()}/api/samples`);
  }

  getPlatforms(): Observable<PlatformConfig[]> {
    return this.http.get<PlatformConfig[]>(`${this.apiUrl()}/api/platforms`);
  }

  previewUrl(url: string): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>(`${this.apiUrl()}/api/preview`, { url });
  }

  getDownloadProxyUrl(mediaUrl: string, filename: string, muted: boolean = false): string {
    const params = new URLSearchParams({
      media_url: mediaUrl,
      filename: filename,
      muted: String(muted)
    });
    return `${this.apiUrl()}/api/download/proxy?${params.toString()}`;
  }

  downloadMediaWithProgress(
    mediaUrl: string,
    filename: string,
    muted: boolean = false
  ): Observable<{ progress: number; blob?: Blob }> {
    const url = `${this.apiUrl()}/api/download/proxy`;
    const params = new HttpParams()
      .set('media_url', mediaUrl)
      .set('filename', filename)
      .set('muted', String(muted));

    return this.http.get(url, {
      params,
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).pipe(
      filter((event: HttpEvent<Blob>) => 
        event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response
      ),
      map((event: HttpEvent<Blob>) => {
        if (event.type === HttpEventType.DownloadProgress) {
          const total = event.total || 0;
          const progress = total > 0 ? Math.round((100 * event.loaded) / total) : 50;
          return { progress: Math.min(progress, 99) };
        } else if (event.type === HttpEventType.Response) {
          return { progress: 100, blob: event.body || undefined };
        }
        return { progress: 0 };
      })
    );
  }
}
