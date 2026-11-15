# MediaVault — Social Media Image & Video Downloader

A modern, responsive social media image and video downloader built with an **Angular** frontend and a **Python (FastAPI)** backend, packaged for Android using **Capacitor**.

MediaVault provides a native Android experience for previewing and downloading public media posts from platforms such as **Instagram**, **X/Twitter**, and direct public media links, adhering strictly to platform access rules and content rights.

---

## Key Features

1. **Quick & Intuitive App Flow**:
   - **URL Input & Clipboard Detector**: Detects supported URLs on the device clipboard automatically upon opening or focus and offers a quick "Paste & Preview" action.
   - **Live Media Preview**: Confirms that media is accessible through authorized methods before offering download options.
   - **Single Image Preview**: Displays high-resolution image preview with resolution, estimated file size, and one-tap download.
   - **Multi-Image Carousel**: Interactive selectable thumbnail grid with **Select All** and **Deselect All** controls, allowing selective or complete carousel downloads.
   - **Video Preview**: Embedded video playback with download options:
     - *Download with audio* (Full video stream with sound)
     - *Download muted* (When supported, strips or downloads muted video variant)
     - Explanatory feedback when an option is unavailable.
   - **Download Manager**: Real-time progress bar (0–100%), success notifications, and one-tap **Open / Share in Gallery** integration.

2. **Storage Management**:
   - On first launch, initializes a dedicated app directory: `MediaVault/` inside user-accessible storage (`Documents/MediaVault`).
   - Automatically maintains organized subfolders:
     - `MediaVault/Images/` for all downloaded photos and carousel pictures.
     - `MediaVault/Videos/` for all downloaded video files.
   - Handles Android storage permissions gracefully with automatic sandboxed fallbacks.
   - Integrates with the native Android file share sheet to make saved files visible and shareable to Google Photos, Gallery, and messaging apps.
   - Local download history viewer with filter tabs (`All`, `Images`, `Videos`) and quick file sharing.

3. **Android Design & Theming**:
   - Designed following modern Android Material design principles with comfortable touch targets (minimum 48px).
   - Dynamic **Light and Dark themes** with persistent preference memory stored across sessions.
   - Clear loading skeletons, offline states, and informative error banners.

4. **Platform Compliance & Privacy**:
   - **No scraping workarounds**: Uses authorized official APIs and standard public oEmbed protocols.
   - **No login or DRM bypass**: Private accounts, subscriber stories, and DRM-protected streams are never bypassed.
   - **Clear limitation notices**: If a post requires an authorized developer API token (such as Meta Graph API or X/Twitter API v2 Bearer token), a detailed explanatory notice is shown explaining the platform rule.
   - **Demo Showcase Posts**: Built-in verified sample posts for instant end-to-end testing of single photos, 4-photo carousels, and videos with audio/muted controls without needing third-party API credentials.
   - **Data Minimization**: Only the requested URL is processed by the backend. No user credentials, cookies, or history are uploaded to remote databases.

---

## Project Structure

```text
d:\Project\media\
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # FastAPI endpoints (/preview, /download/proxy, /samples, /platforms, /health)
│   │   ├── core/
│   │   │   └── config.py          # Configuration & platform credentials
│   │   ├── models/
│   │   │   └── schemas.py         # Pydantic schemas (PreviewResponse, MediaItem, etc.)
│   │   ├── services/
│   │   │   ├── validator.py       # URL validation and platform classifier
│   │   │   ├── media_resolver.py  # Platform resolvers (Twitter, Instagram, Direct, Demo)
│   │   │   └── downloader.py      # Streaming proxy with CORS and chunked download
│   │   └── main.py                # FastAPI application initialization & CORS
│   ├── requirements.txt           # Python dependencies
│   └── run_server.py              # Server entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── header/            # Top bar, status indicator, theme toggle
│   │   │   │   ├── url-input/         # URL input, clipboard banner, paste button
│   │   │   │   ├── sample-picker/     # Quick test preview buttons
│   │   │   │   ├── media-preview/     # Single image, carousel grid, video player & options
│   │   │   │   ├── download-tracker/  # Download progress bar and success/failed cards
│   │   │   │   ├── history-sheet/     # MediaVault storage history & file opener
│   │   │   │   └── settings-modal/    # Backend URL configuration & platform policies
│   │   │   ├── core/
│   │   │   │   ├── models/            # TypeScript data models
│   │   │   │   └── services/          # StorageService, ApiService, ClipboardService, ThemeService
│   │   │   ├── app.ts                 # Main component orchestrator
│   │   │   ├── app.html
│   │   │   └── app.css
│   │   └── styles.css                 # Global theme variables and Android typography
│   ├── android/                       # Capacitor Android native project
│   ├── capacitor.config.ts            # Capacitor configuration
│   └── package.json
│
└── README.md
```

---

## Setup & Development

### 1. Python Backend Setup

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Configure authorized platform credentials:
   ```powershell
   $env:TWITTER_BEARER_TOKEN="your_twitter_api_bearer_token"
   $env:INSTAGRAM_ACCESS_TOKEN="your_meta_graph_api_token"
   ```
5. Start the FastAPI server:
   ```bash
   python run_server.py
   ```
   The backend will be available at `http://localhost:8000`. You can inspect the interactive OpenAPI documentation at `http://localhost:8000/docs`.

### 2. Angular Frontend Setup

1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Angular development server:
   ```bash
   npm start
   ```
   Open `http://localhost:4200` in your web browser.

---

## Backend Deployment & Android Access

When running the app on Android (via emulator or physical smartphone), the mobile app must reach your Python FastAPI backend:

1. **Android Emulator**:
   - In the app's **Settings** screen (gear icon in the top header), select the **Android Emulator (10.0.2.2:8000)** preset.
   - `10.0.2.2` is Android's special loopback alias routing to `localhost:8000` on your development PC.
2. **Physical Android Device over Wi-Fi**:
   - Ensure your phone and development PC are connected to the same Wi-Fi network.
   - Find your PC's local IP address (e.g. `ipconfig` -> `192.168.1.50`).
   - Run the backend with host `0.0.0.0` (default in `run_server.py`).
   - In the MediaVault app Settings screen, enter `http://192.168.1.50:8000` and tap **Save & Test Connection**.
3. **Cloud Deployment**:
   - Deploy the FastAPI backend to any cloud provider (such as Render, Railway, Google Cloud Run, AWS, or Fly.io).
   - Enter your public HTTPS backend URL (e.g., `https://mediavault-api.yourdomain.com`) in the app Settings screen.

---

## Android Build & APK Installation

### Prerequisites
- Java JDK 21+ (`JAVA_HOME` configured)
- Android SDK Platform 35 and Build-Tools 35.0.0 (`ANDROID_HOME` configured)

### Build Instructions
1. Build the production Angular web application:
   ```bash
   cd frontend
   npm run build
   ```
2. Synchronize web assets with the native Android project:
   ```bash
   npx cap sync android
   ```
3. Compile the debug APK using Gradle:
   ```powershell
   cd android
   .\gradlew.bat assembleDebug
   ```

### APK Output Path
The compiled debug APK is located at:
```text
d:\Project\media\frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

### Installation Steps

#### Option A: Using ADB (Android Debug Bridge)
If your phone is connected via USB with Developer Mode & USB Debugging enabled (or running an Android emulator):
```bash
adb install -r "d:\Project\media\frontend\android\app\build\outputs\apk\debug\app-debug.apk"
```

#### Option B: Direct Phone Installation
1. Copy `app-debug.apk` to your phone via USB cable, Google Drive, Bluetooth, or local transfer.
2. On your Android device, open your Files / File Manager app and tap `app-debug.apk`.
3. If prompted, allow "Install unknown apps" for your file manager.
4. Tap **Install** and open **MediaVault**.
