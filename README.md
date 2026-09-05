# PDF Merger

A small Flask app that merges multiple PDF files into one — drag and drop files, reorder them, and download the merged result. Files are processed in memory and never stored on the server.

## Run locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000/`.

## Deploy

The app ships with a `Procfile` and `gunicorn` in `requirements.txt`, so it works out of the box on most Python-friendly PaaS hosts. It reads the `PORT` env var and binds to `0.0.0.0`, and debug mode is off unless `FLASK_DEBUG=1` is set.

### Render

1. Push this repo to GitHub (already done if you're reading this from there).
2. On [render.com](https://render.com), create a **New Web Service** and connect the repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Deploy — Render sets `PORT` automatically.

### Railway

1. On [railway.app](https://railway.app), create a **New Project** → **Deploy from GitHub repo**.
2. Railway auto-detects the `Procfile` and `requirements.txt` — no extra config needed.
3. Deploy — Railway sets `PORT` automatically.

### Heroku

```bash
heroku create your-app-name
git push heroku main
```

Heroku reads the `Procfile` and installs `requirements.txt` automatically.

### Any other host

As long as the platform runs `pip install -r requirements.txt` and then `gunicorn app:app` (or `web: gunicorn app:app` from the `Procfile`), passing a `PORT` env var, it'll work.
