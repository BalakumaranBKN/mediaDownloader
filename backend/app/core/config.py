import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "MediaVault Backend"
    APP_VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Authorized Platform API configuration
    # Users/administrators can provide official developer tokens to access official platform APIs
    TWITTER_BEARER_TOKEN: str = os.getenv("TWITTER_BEARER_TOKEN", "")
    INSTAGRAM_ACCESS_TOKEN: str = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    
    # Enable test / fixture demonstration endpoints
    ENABLE_DEMO_FIXTURES: bool = True
    
    # Allowed CORS origins
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
