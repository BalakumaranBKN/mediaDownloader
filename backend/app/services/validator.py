import re
from urllib.parse import urlparse
from typing import Tuple, Optional

INSTAGRAM_REGEX = re.compile(
    r"^(https?://)?(www\.)?(instagram\.com|instagr\.am)/(p|reel|tv)/([A-Za-z0-9_-]+)",
    re.IGNORECASE
)

TWITTER_REGEX = re.compile(
    r"^(https?://)?(www\.)?(twitter\.com|x\.com)/([A-Za-z0-9_]{1,15})/status/([0-9]+)",
    re.IGNORECASE
)

DIRECT_IMAGE_REGEX = re.compile(r"\.(jpe?g|png|webp|gif)$", re.IGNORECASE)
DIRECT_VIDEO_REGEX = re.compile(r"\.(mp4|webm|mov)$", re.IGNORECASE)

class URLValidator:
    @staticmethod
    def validate_and_classify(url: str) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        Validates URL and classifies platform.
        Returns (is_valid, platform, resource_id, normalized_url)
        """
        if not url:
            return False, "unknown", None, None
            
        url = url.strip()
        
        # Check demo URLs
        if url.startswith("demo://") or "sample-media" in url or "test-post" in url:
            return True, "demo", url, url
            
        if not (url.startswith("http://") or url.startswith("https://")):
            url = "https://" + url

        try:
            parsed = urlparse(url)
            if not parsed.netloc:
                return False, "unknown", None, None
        except Exception:
            return False, "unknown", None, None

        # Instagram
        ig_match = INSTAGRAM_REGEX.search(url)
        if ig_match:
            post_type = ig_match.group(4)
            post_id = ig_match.group(5)
            normalized = f"https://www.instagram.com/{post_type}/{post_id}/"
            return True, "instagram", post_id, normalized

        # Twitter / X
        tw_match = TWITTER_REGEX.search(url)
        if tw_match:
            username = tw_match.group(4)
            tweet_id = tw_match.group(5)
            normalized = f"https://x.com/{username}/status/{tweet_id}"
            return True, "twitter", tweet_id, normalized

        # Direct media URL
        path = parsed.path.lower()
        if DIRECT_IMAGE_REGEX.search(path):
            return True, "direct_image", parsed.path, url
        if DIRECT_VIDEO_REGEX.search(path):
            return True, "direct_video", parsed.path, url

        return False, "unsupported", None, url
