# CUOIS Deployment Guide

## Why Did You See an "Empty Page" on GitHub?

When deploying a modern Vite application to GitHub Pages, an empty/blank page typically happens for two reasons:

1. **Asset Path Resolution (`404 Not Found` on `/assets/...`)**:
   GitHub Pages serves your site from a subpath (e.g., `https://username.github.io/repository-name/`). Without `base: './'`, Vite generates absolute asset links (`/assets/index.js`), which the browser attempts to load from `https://username.github.io/assets/index.js`, causing a 404 error and leaving a blank white screen.
   - **Fix Applied**: We configured `base: './'` in `vite.config.ts` so all assets use relative paths.

2. **Full-Stack Node.js Backend vs. Static Hosting**:
   CUOIS contains both a React frontend and an Express Node.js server (`server.ts`). GitHub Pages only hosts static files (HTML/CSS/JS) and cannot run Node.js backend processes.
   - **Fix Applied**: We integrated an automatic **Client-Side Standalone Storage Engine** (`src/lib/client-storage.ts`). When deployed to GitHub Pages, the application seamlessly detects static hosting and switches to in-browser persistence with Sovereign Owner `IMTHIYAS` and Digital Twin nodes ready to use.
   - **Fix Applied**: We added a root **React Error Boundary** (`src/components/common/ErrorBoundary.tsx`) to catch any unhandled exceptions and prevent blank screens.

---

## Deployment Option 1: GitHub Pages (Free Frontend Hosting)

The repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Step-by-Step Instructions:
1. Push your repository to GitHub (`main` or `master` branch).
2. On GitHub, navigate to your repository **Settings** tab.
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment** -> **Source**, choose **GitHub Actions**.
5. Push a commit or go to the **Actions** tab and click **Run workflow**.
6. Once completed, your application will be live at `https://<your-username>.github.io/<your-repo-name>/` with no blank screen.

---

## Deployment Option 2: Full-Stack Cloud Deployment (Recommended for Live Features)

To enable live Gemini Voice streaming via WebSockets and real multi-device synchronization, deploy to a Node.js-compatible host:

### A. Google Cloud Run (Direct from AI Studio)
- In the top-right header of Google AI Studio, click **Deploy** -> **Cloud Run**.
- AI Studio will containerize the application and provide a production URL.

### B. Render.com / Railway / Fly.io (Free / Low Cost)
1. Link your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Configure the service:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (or `node dist/server.cjs`)
   - **Port**: `3000`
3. Add your Environment Variables:
   - `GEMINI_API_KEY`: Your Google AI Studio API key (for AI Intelligence and Live Audio).

---

## Sovereign Owner Access
- **System Owner ID**: `IMTHIYAS`
- **Lead Architect**: Imthiyas
- **Official Contact**: `imthiyasofficial28@gmail.com`
