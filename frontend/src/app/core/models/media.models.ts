export type MediaType = 'image' | 'video' | 'carousel';

export interface MediaItem {
  id: string;
  type: MediaType;
  thumbnail_url: string;
  media_url: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  supports_muted: boolean;
  muted_media_url?: string;
  filename: string;
  file_size_estimate_bytes?: number;
  selected?: boolean;
}

export interface PlatformInfo {
  platform: string;
  platform_name: string;
  author?: string;
  author_handle?: string;
  author_avatar?: string;
  title_or_caption?: string;
  source_url: string;
}

export interface PreviewResponse {
  status: 'success' | 'limitation' | 'error';
  platform: string;
  media_type: MediaType;
  platform_info: PlatformInfo;
  items: MediaItem[];
  can_download: boolean;
  message?: string;
  limitation_details?: string;
}

export interface SamplePost {
  id: string;
  title: string;
  description: string;
  platform: string;
  media_type: MediaType;
  sample_url: string;
}

export interface DownloadJob {
  id: string;
  item: MediaItem;
  filename: string;
  media_type: MediaType;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  saved_path?: string;
  error_message?: string;
  muted?: boolean;
  timestamp: number;
}

export interface SavedMediaRecord {
  id: string;
  filename: string;
  subfolder: 'Images' | 'Videos';
  type: MediaType;
  path: string;
  timestamp: number;
  size_bytes?: number;
}

export interface PlatformConfig {
  id: string;
  name: string;
  supported: boolean;
  auth_configured: boolean;
  policy: string;
  supported_types: string[];
}
