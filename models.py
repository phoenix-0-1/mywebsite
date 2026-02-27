"""Data persistence layer for Portfolio Pro"""
import json
import uuid
from copy import deepcopy
from config import DATA_FILE, DEFAULT, UPLOAD_DIR

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)


def load() -> dict:
    """Load portfolio data from JSON file, falling back to defaults."""
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Merge in any new default keys (for upgrades)
            for k, v in DEFAULT.items():
                if k not in data:
                    data[k] = deepcopy(v)
            return data
        except (json.JSONDecodeError, IOError):
            pass
    return deepcopy(DEFAULT)


def save(data: dict) -> None:
    """Persist portfolio data to JSON file."""
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def new_id(prefix: str = "item") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def validate_url(url: str) -> str:
    url = str(url).strip()
    if url and not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def sanitize_portfolio(incoming: dict) -> dict:
    """Validate and sanitize an incoming portfolio payload."""
    data = load()

    # ── Scalar fields ──────────────────────────────────────────────────
    scalars = ["name", "tagline", "bio", "bio_extended",
               "location", "email", "phone", "website",
               "accent", "theme"]
    for f in scalars:
        if f in incoming:
            data[f] = str(incoming[f])[:500]

    if "available" in incoming:
        data["available"] = bool(incoming["available"])

    if "resume_url" in incoming:
        data["resume_url"] = validate_url(incoming["resume_url"])

    # ── Social links ───────────────────────────────────────────────────
    if "social_links" in incoming:
        data["social_links"] = [
            {
                "platform": str(s.get("platform", ""))[:50],
                "url":      validate_url(s.get("url", "")),
                "icon":     str(s.get("icon", "link"))[:30],
            }
            for s in incoming["social_links"]
            if s.get("platform") or s.get("url")
        ]

    # ── Skills ─────────────────────────────────────────────────────────
    if "skills" in incoming:
        data["skills"] = [
            {
                "name":     str(sk.get("name", ""))[:50],
                "level":    max(0, min(100, int(sk.get("level", 80)))),
                "category": str(sk.get("category", "Other"))[:30],
            }
            for sk in incoming["skills"]
            if sk.get("name")
        ]

    # ── Projects ───────────────────────────────────────────────────────
    if "projects" in incoming:
        data["projects"] = [
            {
                "id":          str(p.get("id", new_id("proj"))),
                "title":       str(p.get("title", ""))[:100],
                "description": str(p.get("description", ""))[:500],
                "long_desc":   str(p.get("long_desc", ""))[:2000],
                "tags":        [str(t)[:30] for t in p.get("tags", [])[:10]],
                "url":         validate_url(p.get("url", "")),
                "github":      validate_url(p.get("github", "")),
                "image":       str(p.get("image", "")),
                "featured":    bool(p.get("featured", False)),
                "status":      str(p.get("status", ""))[:30],
                "color":       str(p.get("color", "#00D4FF"))[:10],
            }
            for p in incoming["projects"]
            if p.get("title")
        ]

    # ── Experience ─────────────────────────────────────────────────────
    if "experience" in incoming:
        data["experience"] = [
            {
                "id":          str(e.get("id", new_id("exp"))),
                "company":     str(e.get("company", ""))[:100],
                "role":        str(e.get("role", ""))[:100],
                "period":      str(e.get("period", ""))[:50],
                "location":    str(e.get("location", ""))[:100],
                "description": str(e.get("description", ""))[:1000],
                "tags":        [str(t)[:30] for t in e.get("tags", [])[:8]],
                "current":     bool(e.get("current", False)),
            }
            for e in incoming["experience"]
            if e.get("company") or e.get("role")
        ]

    # ── Testimonials ───────────────────────────────────────────────────
    if "testimonials" in incoming:
        data["testimonials"] = [
            {
                "id":     str(t.get("id", new_id("t"))),
                "name":   str(t.get("name", ""))[:100],
                "role":   str(t.get("role", ""))[:100],
                "avatar": str(t.get("avatar", "")),
                "text":   str(t.get("text", ""))[:500],
                "rating": max(1, min(5, int(t.get("rating", 5)))),
            }
            for t in incoming["testimonials"]
            if t.get("name") or t.get("text")
        ]

    # ── Stats ──────────────────────────────────────────────────────────
    if "stats" in incoming:
        data["stats"] = [
            {
                "label": str(s.get("label", ""))[:50],
                "value": str(s.get("value", ""))[:20],
            }
            for s in incoming["stats"][:8]
            if s.get("label")
        ]

    # ── Education ──────────────────────────────────────────────────────
    if "education" in incoming:
        data["education"] = [
            {
                "id":     str(e.get("id", new_id("edu"))),
                "school": str(e.get("school", ""))[:100],
                "degree": str(e.get("degree", ""))[:100],
                "period": str(e.get("period", ""))[:50],
                "gpa":    str(e.get("gpa", ""))[:10],
            }
            for e in incoming["education"]
            if e.get("school")
        ]

    return data
