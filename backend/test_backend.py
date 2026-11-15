import asyncio
import httpx
from app.main import app

async def run_tests():
    print("--- Running MediaVault Backend Self-Tests ---")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health test
        resp = await client.get("/api/health")
        assert resp.status_code == 200, f"Health check failed: {resp.text}"
        data = resp.json()
        print("✓ /api/health:", data["status"], "| App:", data["app"])

        # 2. Samples test
        resp = await client.get("/api/samples")
        assert resp.status_code == 200
        samples = resp.json()
        assert len(samples) >= 3
        print(f"✓ /api/samples returned {len(samples)} sample posts")

        # 3. Platforms test
        resp = await client.get("/api/platforms")
        assert resp.status_code == 200
        platforms = resp.json()
        assert len(platforms) >= 3
        print(f"✓ /api/platforms returned {len(platforms)} platform configurations")

        # 4. Preview Single Image Demo
        resp = await client.post("/api/preview", json={"url": "demo://single-image"})
        assert resp.status_code == 200
        preview = resp.json()
        assert preview["status"] == "success"
        assert preview["media_type"] == "image"
        assert len(preview["items"]) == 1
        print("✓ Preview demo://single-image -> Success (1 image item)")

        # 5. Preview Carousel Demo
        resp = await client.post("/api/preview", json={"url": "demo://carousel"})
        assert resp.status_code == 200
        preview = resp.json()
        assert preview["status"] == "success"
        assert preview["media_type"] == "carousel"
        assert len(preview["items"]) == 4
        print("✓ Preview demo://carousel -> Success (4 carousel items)")

        # 6. Preview Video Demo
        resp = await client.post("/api/preview", json={"url": "demo://video-with-audio"})
        assert resp.status_code == 200
        preview = resp.json()
        assert preview["status"] == "success"
        assert preview["media_type"] == "video"
        assert preview["items"][0]["supports_muted"] is True
        print("✓ Preview demo://video-with-audio -> Success (Video with audio/muted support)")

        # 7. Instagram Policy Limitation Test (unauthenticated)
        resp = await client.post("/api/preview", json={"url": "https://www.instagram.com/p/DB123456789/"})
        assert resp.status_code == 200
        preview = resp.json()
        assert preview["status"] == "limitation"
        assert "Meta" in preview["limitation_details"] or "Graph API" in preview["limitation_details"]
        print("✓ Preview Instagram URL -> Structured platform limitation returned without scraping")

        # 8. Twitter / X Policy Limitation Test (unauthenticated)
        resp = await client.post("/api/preview", json={"url": "https://x.com/creator/status/1850000000000000000"})
        assert resp.status_code == 200
        preview = resp.json()
        assert preview["status"] == "limitation"
        assert "Twitter" in preview["limitation_details"] or "Bearer token" in preview["limitation_details"]
        print("✓ Preview X/Twitter URL -> Structured platform limitation returned without scraping")

        # 9. Invalid URL test
        resp = await client.post("/api/preview", json={"url": "https://randomsite.example.com/not-media"})
        assert resp.status_code == 200
        preview = resp.json()
        assert preview["status"] == "error"
        print("✓ Invalid URL handling -> Structured error returned")

    print("\n--- All Backend Tests Passed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
