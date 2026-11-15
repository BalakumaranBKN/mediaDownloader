import { Injectable } from '@angular/core';

export interface UrlClassification {
  isValid: boolean;
  platform: 'instagram' | 'twitter' | 'direct' | 'demo' | 'unknown';
  badgeName: string;
  badgeClass: string;
  icon: string;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UrlValidatorService {
  classify(url: string): UrlClassification {
    if (!url || !url.trim()) {
      return {
        isValid: false,
        platform: 'unknown',
        badgeName: 'Enter URL',
        badgeClass: 'badge-muted',
        icon: 'link'
      };
    }

    const trimmed = url.trim().toLowerCase();

    if (trimmed.startsWith('demo://') || trimmed.includes('sample-media') || trimmed.includes('test-post')) {
      return {
        isValid: true,
        platform: 'demo',
        badgeName: 'Demo Showcase',
        badgeClass: 'badge-demo',
        icon: 'stars',
        note: 'High-definition public domain test sample'
      };
    }

    if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
      const isPostOrReel = trimmed.includes('/p/') || trimmed.includes('/reel/') || trimmed.includes('/tv/');
      return {
        isValid: isPostOrReel,
        platform: 'instagram',
        badgeName: 'Instagram',
        badgeClass: 'badge-instagram',
        icon: 'photo_camera',
        note: isPostOrReel ? 'Public Instagram Post / Reel' : 'Must be a specific post or reel link'
      };
    }

    if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
      const isStatus = trimmed.includes('/status/');
      return {
        isValid: isStatus,
        platform: 'twitter',
        badgeName: 'X / Twitter',
        badgeClass: 'badge-twitter',
        icon: 'tag',
        note: isStatus ? 'Public X/Twitter status link' : 'Must be a specific tweet/post link'
      };
    }

    if (
      trimmed.endsWith('.jpg') ||
      trimmed.endsWith('.jpeg') ||
      trimmed.endsWith('.png') ||
      trimmed.endsWith('.webp') ||
      trimmed.endsWith('.gif') ||
      trimmed.endsWith('.mp4') ||
      trimmed.endsWith('.webm')
    ) {
      return {
        isValid: true,
        platform: 'direct',
        badgeName: 'Direct Media',
        badgeClass: 'badge-direct',
        icon: 'image',
        note: 'Direct public image or video link'
      };
    }

    return {
      isValid: false,
      platform: 'unknown',
      badgeName: 'Unsupported',
      badgeClass: 'badge-warning',
      icon: 'help_outline',
      note: 'Enter a valid Instagram, X/Twitter, or direct media URL'
    };
  }
}
