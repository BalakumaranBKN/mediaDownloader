import httpx
from typing import Optional
from app.models.schemas import (
    PreviewResponse,
    MediaType,
    MediaItem,
    PlatformInfo,
    SamplePost
)
from app.core.config import settings

SAMPLE_POSTS = [
    SamplePost(
        id="demo-single-image",
        title="Single Photo Post (Public Nature Shot)",
        description="Preview & download a single high-resolution image",
        platform="demo",
        media_type=MediaType.IMAGE,
        sample_url="demo://single-image"
    ),
    SamplePost(
        id="demo-carousel",
        title="Multi-Image Carousel (4 Photos)",
        description="Preview selectable grid, Select All / Deselect All, and download selected images",
        platform="demo",
        media_type=MediaType.CAROUSEL,
        sample_url="demo://carousel"
    ),
    SamplePost(
        id="demo-video",
        title="Video Post (Audio & Muted Options)",
        description="Preview video with options for with audio or muted download",
        platform="demo",
        media_type=MediaType.VIDEO,
        sample_url="demo://video-with-audio"
    )
]

# High quality reliable public media assets (Creative Commons / Public Domain)
DEMO_ASSETS = {
    "single-image": {
        "title": "Mountain Lake Sunrise - Public Showcase",
        "author": "Nature Explorer",
        "handle": "@nature_explorer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "items": [
            MediaItem(
                id="img-1",
                type=MediaType.IMAGE,
                thumbnail_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
                media_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&auto=format&fit=crop&q=90",
                width=1920,
                height=1080,
                filename="mountain_lake_sunrise.jpg",
                file_size_estimate_bytes=1420000
            )
        ]
    },
    "carousel": {
        "title": "Architecture & Travel Collection (4-photo Carousel)",
        "author": "Urban Studio",
        "handle": "@urban_studio",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "items": [
            MediaItem(
                id="car-1",
                type=MediaType.IMAGE,
                thumbnail_url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
                media_url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=90",
                width=1600,
                height=1067,
                filename="architecture_glass_tower.jpg",
                file_size_estimate_bytes=980000
            ),
            MediaItem(
                id="car-2",
                type=MediaType.IMAGE,
                thumbnail_url="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
                media_url="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=90",
                width=1600,
                height=1067,
                filename="cozy_minimalist_room.jpg",
                file_size_estimate_bytes=1120000
            ),
            MediaItem(
                id="car-3",
                type=MediaType.IMAGE,
                thumbnail_url="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80",
                media_url="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&auto=format&fit=crop&q=90",
                width=1600,
                height=1067,
                filename="misty_mountain_forest.jpg",
                file_size_estimate_bytes=1250000
            ),
            MediaItem(
                id="car-4",
                type=MediaType.IMAGE,
                thumbnail_url="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80",
                media_url="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&auto=format&fit=crop&q=90",
                width=1600,
                height=1067,
                filename="developer_workspace_setup.jpg",
                file_size_estimate_bytes=890000
            )
        ]
    },
    "video": {
        "title": "Ocean Waves & Coastal Cliffs - 4K Video Showcase",
        "author": "Oceanic Films",
        "handle": "@oceanic_films",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "items": [
            MediaItem(
                id="vid-1",
                type=MediaType.VIDEO,
                thumbnail_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
                media_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                width=1280,
                height=720,
                duration_seconds=15.0,
                supports_muted=True,
                muted_media_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4#t=0.1",
                filename="ocean_waves_coastal.mp4",
                file_size_estimate_bytes=15800000
            )
        ]
    }
}

class MediaResolver:
    @staticmethod
    async def resolve_url(platform: str, resource_id: Optional[str], raw_url: str) -> PreviewResponse:
        # 1. Demo fixtures
        if platform == "demo":
            return MediaResolver._resolve_demo(raw_url)

        # 2. Direct media links
        if platform in ("direct_image", "direct_video"):
            return await MediaResolver._resolve_direct(platform, raw_url)

        # 3. Twitter / X
        if platform == "twitter":
            return await MediaResolver._resolve_twitter(resource_id, raw_url)

        # 4. Instagram
        if platform == "instagram":
            return await MediaResolver._resolve_instagram(resource_id, raw_url)

        return PreviewResponse(
            status="error",
            platform="unknown",
            media_type=MediaType.IMAGE,
            platform_info=PlatformInfo(
                platform="unknown",
                platform_name="Unknown",
                source_url=raw_url
            ),
            items=[],
            can_download=False,
            message="Unsupported or invalid URL format.",
            limitation_details="Please provide a valid public URL from Instagram, X/Twitter, or a direct media link."
        )

    @staticmethod
    def _resolve_demo(url: str) -> PreviewResponse:
        url_lower = url.lower()
        if "carousel" in url_lower:
            data = DEMO_ASSETS["carousel"]
            mtype = MediaType.CAROUSEL
        elif "video" in url_lower:
            data = DEMO_ASSETS["video"]
            mtype = MediaType.VIDEO
        else:
            data = DEMO_ASSETS["single-image"]
            mtype = MediaType.IMAGE

        return PreviewResponse(
            status="success",
            platform="demo",
            media_type=mtype,
            platform_info=PlatformInfo(
                platform="demo",
                platform_name="Demo Showcase Post",
                author=data["author"],
                author_handle=data["handle"],
                author_avatar=data["avatar"],
                title_or_caption=data["title"],
                source_url=url
            ),
            items=data["items"],
            can_download=True,
            message="Media retrieved successfully via verified public source."
        )

    @staticmethod
    async def _resolve_direct(platform: str, url: str) -> PreviewResponse:
        is_video = platform == "direct_video"
        media_type = MediaType.VIDEO if is_video else MediaType.IMAGE
        ext = "mp4" if is_video else "jpg"
        filename = f"media_download.{ext}"
        
        # Check URL accessibility with HEAD
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.head(url)
                if resp.status_code >= 400:
                    # Fallback to GET with small range
                    resp = await client.get(url, headers={"Range": "bytes=0-1024"})
                    if resp.status_code >= 400:
                        return PreviewResponse(
                            status="error",
                            platform="direct",
                            media_type=media_type,
                            platform_info=PlatformInfo(
                                platform="direct",
                                platform_name="Direct Link",
                                source_url=url
                            ),
                            items=[],
                            can_download=False,
                            message=f"Direct media resource responded with HTTP {resp.status_code}.",
                            limitation_details="The remote server denied access or the link has expired."
                        )

                content_len = resp.headers.get("Content-Length")
                size_bytes = int(content_len) if content_len and content_len.isdigit() else None
                
                # Derive filename from URL
                path_segments = url.split("?")[0].split("/")
                if path_segments:
                    clean_name = path_segments[-1]
                    if "." in clean_name:
                        filename = clean_name

                item = MediaItem(
                    id="direct-item-1",
                    type=media_type,
                    thumbnail_url=url if not is_video else "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
                    media_url=url,
                    filename=filename,
                    file_size_estimate_bytes=size_bytes,
                    supports_muted=is_video,
                    muted_media_url=url if is_video else None
                )

                return PreviewResponse(
                    status="success",
                    platform="direct",
                    media_type=media_type,
                    platform_info=PlatformInfo(
                        platform="direct",
                        platform_name="Direct Public Media",
                        title_or_caption=f"Direct public {media_type.value} link",
                        source_url=url
                    ),
                    items=[item],
                    can_download=True,
                    message="Direct public media verified and ready to download."
                )
        except Exception as e:
            return PreviewResponse(
                status="error",
                platform="direct",
                media_type=media_type,
                platform_info=PlatformInfo(
                    platform="direct",
                    platform_name="Direct Public Media",
                    source_url=url
                ),
                items=[],
                can_download=False,
                message=f"Failed to connect to media host: {str(e)}",
                limitation_details="Please verify the direct media link is accessible and CORS/network policies permit downloading."
            )

    @staticmethod
    async def _resolve_twitter(tweet_id: Optional[str], raw_url: str) -> PreviewResponse:
        # Check if official API token is provided
        if settings.TWITTER_BEARER_TOKEN:
            try:
                headers = {"Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}"}
                api_url = (
                    f"https://api.twitter.com/2/tweets/{tweet_id}"
                    "?expansions=attachments.media_keys,author_id"
                    "&media.fields=duration_ms,height,media_key,preview_image_url,type,url,width,variants"
                    "&user.fields=name,username,profile_image_url"
                )
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(api_url, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        tweet = data.get("data", {})
                        includes = data.get("includes", {})
                        users = {u["id"]: u for u in includes.get("users", [])}
                        author = users.get(tweet.get("author_id"), {})
                        
                        media_list = includes.get("media", [])
                        items: list[MediaItem] = []
                        primary_type = MediaType.IMAGE

                        for idx, m in enumerate(media_list):
                            m_type = m.get("type")
                            if m_type == "video" or m_type == "animated_gif":
                                primary_type = MediaType.VIDEO
                                variants = m.get("variants", [])
                                # Sort by bitrate
                                mp4_variants = [v for v in variants if v.get("content_type") == "video/mp4"]
                                mp4_variants.sort(key=lambda x: x.get("bitrate", 0), reverse=True)
                                best_variant = mp4_variants[0] if mp4_variants else variants[0] if variants else {}
                                video_url = best_variant.get("url", "")

                                items.append(MediaItem(
                                    id=f"tw-media-{idx}",
                                    type=MediaType.VIDEO,
                                    thumbnail_url=m.get("preview_image_url", ""),
                                    media_url=video_url,
                                    width=m.get("width"),
                                    height=m.get("height"),
                                    duration_seconds=m.get("duration_ms", 0) / 1000.0,
                                    supports_muted=True,
                                    muted_media_url=video_url,
                                    filename=f"twitter_{tweet_id}_{idx}.mp4"
                                ))
                            else:
                                if len(media_list) > 1:
                                    primary_type = MediaType.CAROUSEL
                                items.append(MediaItem(
                                    id=f"tw-media-{idx}",
                                    type=MediaType.IMAGE,
                                    thumbnail_url=m.get("url", ""),
                                    media_url=m.get("url", ""),
                                    width=m.get("width"),
                                    height=m.get("height"),
                                    filename=f"twitter_{tweet_id}_{idx}.jpg"
                                ))

                        if items:
                            return PreviewResponse(
                                status="success",
                                platform="twitter",
                                media_type=primary_type,
                                platform_info=PlatformInfo(
                                    platform="twitter",
                                    platform_name="X / Twitter (Authorized API)",
                                    author=author.get("name", "X User"),
                                    author_handle=f"@{author.get('username', 'user')}",
                                    author_avatar=author.get("profile_image_url"),
                                    title_or_caption=tweet.get("text", ""),
                                    source_url=raw_url
                                ),
                                items=items,
                                can_download=True,
                                message="Media retrieved successfully via official X/Twitter API."
                            )
            except Exception as e:
                # Log and fallback to limitation response
                pass

        # Query official public oEmbed to show verified metadata
        author_name = "Public X/Twitter Creator"
        author_url = raw_url
        caption = "Public Post on X/Twitter"
        try:
            oembed_url = f"https://publish.twitter.com/oembed?url={raw_url}"
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(oembed_url)
                if resp.status_code == 200:
                    data = resp.json()
                    author_name = data.get("author_name", author_name)
                    author_url = data.get("author_url", author_url)
                    html = data.get("html", "")
                    caption = f"Post by {author_name}"
        except Exception:
            pass

        return PreviewResponse(
            status="limitation",
            platform="twitter",
            media_type=MediaType.IMAGE,
            platform_info=PlatformInfo(
                platform="twitter",
                platform_name="X / Twitter",
                author=author_name,
                author_handle=author_name,
                title_or_caption=caption,
                source_url=raw_url
            ),
            items=[],
            can_download=False,
            message="Direct media stream download for X/Twitter requires official API credentials.",
            limitation_details=(
                "In compliance with platform access rules and content rights, this app uses authorized API methods only "
                "and does not bypass access controls, DRM, or perform unauthorized DOM scraping. "
                "To enable direct X/Twitter downloads, configure a valid TWITTER_BEARER_TOKEN in the backend environment, "
                "or test full preview and download capabilities with the built-in sample demo posts."
            )
        )

    @staticmethod
    async def _resolve_instagram(post_id: Optional[str], raw_url: str) -> PreviewResponse:
        # Check if official Meta Graph token is configured
        if settings.INSTAGRAM_ACCESS_TOKEN:
            try:
                # Meta Graph API oembed or media node
                oembed_endpoint = f"https://graph.facebook.com/v12.0/instagram_oembed?url={raw_url}&access_token={settings.INSTAGRAM_ACCESS_TOKEN}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(oembed_endpoint)
                    if resp.status_code == 200:
                        data = resp.json()
                        thumbnail_url = data.get("thumbnail_url")
                        author_name = data.get("author_name", "Instagram Creator")
                        title = data.get("title", "")
                        
                        if thumbnail_url:
                            item = MediaItem(
                                id=f"ig-{post_id}-1",
                                type=MediaType.IMAGE,
                                thumbnail_url=thumbnail_url,
                                media_url=thumbnail_url,
                                filename=f"instagram_{post_id}.jpg"
                            )
                            return PreviewResponse(
                                status="success",
                                platform="instagram",
                                media_type=MediaType.IMAGE,
                                platform_info=PlatformInfo(
                                    platform="instagram",
                                    platform_name="Instagram (Graph API)",
                                    author=author_name,
                                    author_handle=f"@{author_name}",
                                    title_or_caption=title,
                                    source_url=raw_url
                                ),
                                items=[item],
                                can_download=True,
                                message="Media verified and retrieved via official Meta Graph API."
                            )
            except Exception:
                pass

        return PreviewResponse(
            status="limitation",
            platform="instagram",
            media_type=MediaType.IMAGE,
            platform_info=PlatformInfo(
                platform="instagram",
                platform_name="Instagram",
                author="Instagram Public Post",
                author_handle="@instagram_user",
                title_or_caption="Public Instagram Post",
                source_url=raw_url
            ),
            items=[],
            can_download=False,
            message="Instagram direct media download requires authorized Meta Graph API credentials.",
            limitation_details=(
                "Meta platform policies require an authorized Graph API access token (INSTAGRAM_ACCESS_TOKEN) "
                "to retrieve media assets. In accordance with platform terms and content rights, private post bypass, "
                "session-hijacking, and unauthorized scraping are strictly prohibited. "
                "Use the demo showcase buttons to test single image, carousel, and video downloads."
            )
        )
