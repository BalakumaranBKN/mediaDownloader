from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import (
    PreviewRequest,
    PreviewResponse,
    SamplePost,
    MediaType
)
from app.services.validator import URLValidator
from app.services.media_resolver import MediaResolver, SAMPLE_POSTS
from app.services.downloader import MediaDownloader
from app.core.config import settings

router = APIRouter(prefix="/api")

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "twitter_api_configured": bool(settings.TWITTER_BEARER_TOKEN),
        "instagram_api_configured": bool(settings.INSTAGRAM_ACCESS_TOKEN)
    }

@router.get("/samples", response_model=list[SamplePost])
async def get_samples():
    """Returns sample posts representing Single Image, Multi-image Carousel, and Video."""
    return SAMPLE_POSTS

@router.get("/platforms")
async def get_platforms():
    """Returns list of supported platforms and their configuration/access rules."""
    return [
        {
            "id": "instagram",
            "name": "Instagram",
            "supported": True,
            "auth_configured": bool(settings.INSTAGRAM_ACCESS_TOKEN),
            "policy": "Requires Meta Graph API access token. Private accounts, stories, and DRM-protected media are not accessed.",
            "supported_types": ["Single Image", "Reels/Video", "Carousel"]
        },
        {
            "id": "twitter",
            "name": "X / Twitter",
            "supported": True,
            "auth_configured": bool(settings.TWITTER_BEARER_TOKEN),
            "policy": "Requires Twitter/X API v2 Bearer token. Public tweet metadata resolved via official oEmbed.",
            "supported_types": ["Single Image", "Video", "Multi-image"]
        },
        {
            "id": "direct",
            "name": "Direct Media Link",
            "supported": True,
            "auth_configured": True,
            "policy": "Public direct URLs (JPEG, PNG, WebP, MP4) verified via standard HTTP HEAD requests.",
            "supported_types": ["Direct Image", "Direct Video"]
        },
        {
            "id": "demo",
            "name": "Demo & Showcase Posts",
            "supported": True,
            "auth_configured": True,
            "policy": "Open-access Creative Commons media for full UI testing and APK validation.",
            "supported_types": ["Single Image", "Carousel Grid (4)", "Video (Audio & Mute)"]
        }
    ]

@router.post("/preview", response_model=PreviewResponse)
async def preview_media(payload: PreviewRequest):
    """
    Validates the provided URL, classifies platform, and retrieves media preview metadata.
    Returns preview data or platform limitation notice.
    """
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")

    is_valid, platform, resource_id, normalized_url = URLValidator.validate_and_classify(url)
    if not is_valid:
        return PreviewResponse(
            status="error",
            platform="unknown",
            media_type=MediaType.IMAGE,
            platform_info={
                "platform": "unknown",
                "platform_name": "Unsupported Source",
                "source_url": url
            },
            items=[],
            can_download=False,
            message="Invalid or unsupported URL.",
            limitation_details="Please provide a valid URL from Instagram (post/reel), X/Twitter (status post), or a direct public media link (.jpg, .mp4)."
        )

    response = await MediaResolver.resolve_url(platform, resource_id, normalized_url or url)
    return response

@router.get("/download/proxy")
async def download_proxy(
    media_url: str = Query(..., description="URL of the media to stream"),
    filename: str = Query(..., description="Target filename"),
    muted: bool = Query(False, description="Whether to request muted stream")
):
    """
    Streams media file to client, bypassing CORS limitations on mobile / web,
    and supplying proper content headers for device storage.
    """
    return await MediaDownloader.stream_media(media_url, filename, muted)
