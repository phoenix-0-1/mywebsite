"""
Portfolio Pro — Flask Backend
Supports 4 photo upload methods:
  1. File upload (drag & drop / browse)
  2. URL import (fetch from web)
  3. Webcam capture (base64 from browser)
  4. Clipboard paste (base64 from browser)

Run: python app.py
"""

import os
import io
import uuid
import base64
import urllib.request
import urllib.error
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory

import config
import models

# ── Optional: Pillow for image processing ─────────────────────────────────────
try:
    from PIL import Image, ImageOps
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = config.SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = config.MAX_BYTES


# ════════════════════════════════════════════
#  IMAGE PROCESSING HELPERS
# ════════════════════════════════════════════

def process_image(raw_bytes: bytes, filename: str = "photo.jpg") -> bytes:
    """
    Resize, auto-orient, and convert image to optimized JPEG.
    Falls back to raw bytes if Pillow is not installed.
    """
    if not HAS_PIL:
        return raw_bytes
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        # Auto-rotate based on EXIF orientation
        img = ImageOps.exif_transpose(img)
        # Convert to RGB (handles RGBA PNGs, palette images, etc.)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        # Resize to max dimensions keeping aspect ratio
        img.thumbnail(config.PHOTO_SIZE, Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88, optimize=True)
        return buf.getvalue()
    except Exception:
        return raw_bytes


def save_photo(raw_bytes: bytes, source_name: str = "photo") -> str:
    """Save processed photo, clean up old ones, return URL path."""
    # Delete all old profile photos
    for old in config.UPLOAD_DIR.glob("profile_*"):
        try:
            old.unlink()
        except OSError:
            pass

    processed = process_image(raw_bytes, source_name)
    filename   = f"profile_{uuid.uuid4().hex[:10]}.jpg"
    filepath   = config.UPLOAD_DIR / filename
    filepath.write_bytes(processed)
    return f"/uploads/{filename}"


def allowed_ext(filename: str) -> bool:
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in config.ALLOWED_EXT


# ════════════════════════════════════════════
#  ROUTES
# ════════════════════════════════════════════

@app.route("/")
def index():
    data = models.load()
    return render_template("index.html", p=data)


@app.route("/api/portfolio", methods=["GET"])
def get_portfolio():
    return jsonify(models.load())


@app.route("/api/portfolio", methods=["POST"])
def update_portfolio():
    incoming = request.get_json(force=True, silent=True)
    if not incoming:
        return jsonify({"error": "No JSON payload"}), 400
    try:
        cleaned = models.sanitize_portfolio(incoming)
        models.save(cleaned)
        return jsonify({"ok": True, "data": cleaned})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Upload Method 1: File ──────────────────────────────────────────────────────
@app.route("/api/photo/upload", methods=["POST"])
def photo_upload_file():
    """Standard multipart file upload."""
    if "photo" not in request.files:
        return jsonify({"error": "No file attached"}), 400
    f = request.files["photo"]
    if not f or f.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    if not allowed_ext(f.filename):
        return jsonify({"error": f"File type not allowed. Use: {', '.join(config.ALLOWED_EXT)}"}), 400

    raw = f.read()
    if len(raw) > config.MAX_BYTES:
        return jsonify({"error": "File too large (max 15 MB)"}), 413

    url = save_photo(raw, f.filename)
    _persist_photo(url)
    return jsonify({"ok": True, "url": url})


# ── Upload Method 2: URL import ───────────────────────────────────────────────
@app.route("/api/photo/url", methods=["POST"])
def photo_upload_url():
    """Fetch an image from a remote URL and save it."""
    body = request.get_json(force=True, silent=True) or {}
    img_url = str(body.get("url", "")).strip()
    if not img_url:
        return jsonify({"error": "No URL provided"}), 400
    if not img_url.startswith(("http://", "https://")):
        return jsonify({"error": "URL must start with http:// or https://"}), 400

    try:
        req = urllib.request.Request(
            img_url,
            headers={"User-Agent": "Mozilla/5.0 PortfolioBot/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if not content_type.startswith("image/"):
                return jsonify({"error": "URL does not point to an image"}), 400
            raw = resp.read(config.MAX_BYTES + 1)
    except urllib.error.HTTPError as e:
        return jsonify({"error": f"HTTP {e.code}: {e.reason}"}), 400
    except urllib.error.URLError as e:
        return jsonify({"error": f"Could not reach URL: {e.reason}"}), 400
    except Exception as e:
        return jsonify({"error": f"Fetch failed: {str(e)}"}), 400

    if len(raw) > config.MAX_BYTES:
        return jsonify({"error": "Remote image too large (max 15 MB)"}), 413

    url = save_photo(raw, "url_import.jpg")
    _persist_photo(url)
    return jsonify({"ok": True, "url": url})


# ── Upload Method 3 & 4: Base64 (webcam / clipboard) ─────────────────────────
@app.route("/api/photo/base64", methods=["POST"])
def photo_upload_base64():
    """
    Accept a base64-encoded image from webcam capture or clipboard paste.
    Expects JSON: { "data": "data:image/jpeg;base64,/9j/..." }
    """
    body = request.get_json(force=True, silent=True) or {}
    data_uri = str(body.get("data", "")).strip()
    if not data_uri:
        return jsonify({"error": "No image data provided"}), 400

    try:
        # Strip data URI prefix
        if "," in data_uri:
            header, b64 = data_uri.split(",", 1)
        else:
            b64 = data_uri
        raw = base64.b64decode(b64 + "==")          # pad safely
    except Exception:
        return jsonify({"error": "Invalid base64 data"}), 400

    if len(raw) > config.MAX_BYTES:
        return jsonify({"error": "Image too large (max 15 MB)"}), 413

    url = save_photo(raw, "capture.jpg")
    _persist_photo(url)
    return jsonify({"ok": True, "url": url})


# ── Delete photo ──────────────────────────────────────────────────────────────
@app.route("/api/photo/delete", methods=["POST"])
def photo_delete():
    data = models.load()
    if data.get("photo"):
        fname = Path(data["photo"]).name
        fpath = config.UPLOAD_DIR / fname
        fpath.unlink(missing_ok=True)
        data["photo"] = ""
        models.save(data)
    return jsonify({"ok": True})


# ── Serve uploads ─────────────────────────────────────────────────────────────
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(str(config.UPLOAD_DIR), filename)


# ── Health ────────────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"ok": True, "pil": HAS_PIL,
                    "version": "2.0.0", "port": config.PORT})


# ── Helpers ───────────────────────────────────────────────────────────────────
def _persist_photo(url: str) -> None:
    data = models.load()
    data["photo"] = url
    models.save(data)


# ════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "="*60)
    print("  ◆  Portfolio Pro v2.0")
    print("="*60)
    print(f"  URL:       http://localhost:{config.PORT}")
    print(f"  Edit:      Click 'Edit' button  or  Ctrl+E")
    print(f"  PIL:       {'✓ Image processing enabled' if HAS_PIL else '✗ Install Pillow for image optimization'}")
    print(f"  Data:      {config.DATA_FILE}")
    print(f"  Uploads:   {config.UPLOAD_DIR}")
    print("="*60 + "\n")
    app.run(debug=config.DEBUG, host="0.0.0.0", port=config.PORT)
