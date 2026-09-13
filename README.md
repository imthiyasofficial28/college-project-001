# CUOIS — Campus Unified Operations & Intelligence System

> **Architected & Developed by Imthiyas**  
> Sovereign System Owner & Lead Architect (`imthiyasofficial28@gmail.com`)

CUOIS is a high-performance, real-time institutional operations and digital twin platform built with React, Vite, Tailwind CSS, Three.js spatial telemetry, and Express.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or v20+
- npm (bundled with Node.js)

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
npm install
```

### 2. Configure Environment (Optional for Gemini Voice/AI)
Copy the example environment file:
```bash
cp .env.example .env
```
*(Optional: Add your `GEMINI_API_KEY` for live AI chat and voice streaming).*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to GitHub Pages (Static Hosting)

The repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys your website automatically with zero configuration.

### How to Enable GitHub Pages:
1. **Push your code to GitHub** on branch `main` or `master`:
   ```bash
   git add .
   git commit -m "feat: complete cuois application setup"
   git push origin main
   ```
2. On GitHub, go to your repository's **Settings** tab.
3. In the left sidebar, click **Pages** (under "Code and automation").
4. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
5. Go to the **Actions** tab in GitHub. The deployment workflow will run and publish the site.
6. Your live website URL will be:
   `https://<your-username>.github.io/<your-repo-name>/`

> **Note on Static Hosting**: On GitHub Pages, CUOIS runs with an integrated **Client-Side Standalone Storage Engine**. All your data, Digital Twin nodes, and institutional settings persist directly in your browser's local storage without requiring a Node.js server.

---

## ☁️ Full-Stack Deployment (With Express Server & WebSockets)

If you want live WebSocket connections and full backend API capabilities, deploy to any Node.js container host:

### Option A: Google Cloud Run (Recommended)
Deploy directly using Google AI Studio or Cloud Run:
```bash
gcloud run deploy cuois --source . --port 3000 --allow-unauthenticated
```

### Option B: Render / Railway / Fly.io
1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: `3000`
3. Set environment variable: `GEMINI_API_KEY` (if using AI features).

---

## 🔑 Sovereign Owner Credentials
- **System Owner ID**: `IMTHIYAS`
- **Owner Name**: Imthiyas
- **Official Contact**: `imthiyasofficial28@gmail.com`
- **System Role**: Sovereign Lead Architect & System Owner

---

## 🛠 Project Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts dev server on port 3000 with hot reload |
| `npm run build` | Builds Vite frontend into `dist/` and compiles `server.ts` into `dist/server.cjs` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Checks TypeScript compilation without emitting files |
