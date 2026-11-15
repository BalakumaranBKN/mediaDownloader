from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"

class MediaItem(BaseModel):
    id: str
    type: MediaType
    thumbnail_url: str
    media_url: str
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    supports_muted: bool = False
    muted_media_url: Optional[str] = None
    filename: str
    file_size_estimate_bytes: Optional[int] = None

class PlatformInfo(BaseModel):
    platform: str  # "instagram", "twitter", "demo", "direct"
    platform_name: str
    author: Optional[str] = "Public Creator"
    author_handle: Optional[str] = "@creator"
    author_avatar: Optional[str] = None
    title_or_caption: Optional[str] = ""
    source_url: str

class PreviewRequest(BaseModel):
    url: str

class PreviewResponse(BaseModel):
    status: str  # "success", "limitation", "error"
    platform: str
    media_type: MediaType
    platform_info: PlatformInfo
    items: List[MediaItem] = []
    can_download: bool = True
    message: Optional[str] = None
    limitation_details: Optional[str] = None

class SamplePost(BaseModel):
    id: str
    title: str
    description: str
    platform: str
    media_type: MediaType
    sample_url: str

class DownloadProxyRequest(BaseModel):
    media_url: str
    filename: str
    muted: bool = False
