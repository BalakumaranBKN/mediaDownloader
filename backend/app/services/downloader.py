import httpx
from typing import AsyncGenerator
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

class MediaDownloader:
    @staticmethod
    async def stream_media(media_url: str, filename: str, muted: bool = False) -> StreamingResponse:
        """
        Streams media directly from the source to the client,
        handling CORS and providing proper Content-Disposition headers.
        """
        # Determine media content type based on extension
        lower_name = filename.lower()
        if lower_name.endswith(".mp4"):
            content_type = "video/mp4"
        elif lower_name.endswith(".webm"):
            content_type = "video/webm"
        elif lower_name.endswith(".png"):
            content_type = "image/png"
        elif lower_name.endswith(".webp"):
            content_type = "image/webp"
        elif lower_name.endswith(".gif"):
            content_type = "image/gif"
        else:
            content_type = "image/jpeg"

        client = httpx.AsyncClient(timeout=60.0, follow_redirects=True)
        try:
            req = client.build_request("GET", media_url)
            resp = await client.send(req, stream=True)
            if resp.status_code >= 400:
                await resp.aclose()
                await client.aclose()
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Source server rejected download request with HTTP {resp.status_code}."
                )

            async def iterfile() -> AsyncGenerator[bytes, None]:
                try:
                    async for chunk in resp.aiter_bytes(chunk_size=65536):
                        yield chunk
                finally:
                    await resp.aclose()
                    await client.aclose()

            headers = {
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
                "X-Media-Muted": "true" if muted else "false"
            }
            if "content-length" in resp.headers:
                headers["Content-Length"] = resp.headers["content-length"]

            return StreamingResponse(
                iterfile(),
                media_type=resp.headers.get("content-type", content_type),
                headers=headers
            )
        except HTTPException:
            raise
        except Exception as e:
            await client.aclose()
            raise HTTPException(status_code=500, detail=f"Failed to stream media: {str(e)}")
