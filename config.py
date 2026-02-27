"""Configuration for Portfolio Pro"""
import os
from pathlib import Path

BASE_DIR     = Path(__file__).parent
DATA_FILE    = BASE_DIR / "data" / "portfolio.json"
UPLOAD_DIR   = BASE_DIR / "uploads"
MAX_BYTES    = 15 * 1024 * 1024          # 15 MB upload limit
THUMB_SIZE   = (120, 120)                 # thumbnail dimensions
PHOTO_SIZE   = (800, 800)                 # max saved photo dimensions
ALLOWED_EXT  = {"png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "tiff"}
SECRET_KEY   = os.environ.get("SECRET_KEY", os.urandom(32))
DEBUG        = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
PORT         = int(os.environ.get("PORT", 5000))

# ── Default Portfolio Data ─────────────────────────────────────────────────
DEFAULT = {
    "name":        "Alex Morgan",
    "tagline":     "Full-Stack Developer & UI Architect",
    "bio":         "I build fast, beautiful, and accessible web experiences. Passionate about clean code, thoughtful design, and solving hard problems with elegant solutions.",
    "bio_extended": "With 5+ years building production systems, I've shipped products used by millions. I specialize in Python, modern JavaScript, and turning complex requirements into simple interfaces.",
    "location":    "San Francisco, CA",
    "email":       "alex@example.com",
    "phone":       "+1 (555) 000-1234",
    "website":     "https://alexmorgan.dev",
    "resume_url":  "",
    "photo":       "",
    "available":   True,
    "theme":       "dark",
    "accent":      "#00D4FF",

    "social_links": [
        {"platform": "GitHub",    "url": "https://github.com/",      "icon": "github"},
        {"platform": "LinkedIn",  "url": "https://linkedin.com/in/",  "icon": "linkedin"},
        {"platform": "Twitter",   "url": "https://twitter.com/",      "icon": "twitter"},
        {"platform": "Dev.to",    "url": "https://dev.to/",           "icon": "dev"},
    ],

    "skills": [
        {"name": "Python",      "level": 92, "category": "Backend"},
        {"name": "Flask/FastAPI","level": 88, "category": "Backend"},
        {"name": "PostgreSQL",  "level": 82, "category": "Backend"},
        {"name": "JavaScript",  "level": 90, "category": "Frontend"},
        {"name": "HTML/CSS",    "level": 95, "category": "Frontend"},
        {"name": "React",       "level": 78, "category": "Frontend"},
        {"name": "Docker",      "level": 75, "category": "DevOps"},
        {"name": "Git",         "level": 90, "category": "DevOps"},
        {"name": "Figma",       "level": 80, "category": "Design"},
        {"name": "UI/UX Design","level": 75, "category": "Design"},
    ],

    "projects": [
        {
            "id": "proj-1",
            "title":       "DataFlow Studio",
            "description": "A real-time data pipeline visualization tool that turns complex ETL processes into interactive node graphs. Handles 10M+ events/day.",
            "long_desc":   "",
            "tags":        ["Python", "React", "WebSocket", "PostgreSQL"],
            "url":         "",
            "github":      "",
            "image":       "",
            "featured":    True,
            "status":      "Live",
            "color":       "#00D4FF",
        },
        {
            "id": "proj-2",
            "title":       "Nebula UI Kit",
            "description": "Open-source React component library with 60+ accessible, themeable components. 2.4k GitHub stars.",
            "long_desc":   "",
            "tags":        ["React", "TypeScript", "Storybook", "CSS"],
            "url":         "",
            "github":      "",
            "image":       "",
            "featured":    True,
            "status":      "Open Source",
            "color":       "#7C3AED",
        },
        {
            "id": "proj-3",
            "title":       "Sentinel Monitor",
            "description": "Infrastructure monitoring dashboard with ML-based anomaly detection. Reduced incident response time by 60%.",
            "long_desc":   "",
            "tags":        ["Python", "Flask", "ML", "Redis"],
            "url":         "",
            "github":      "",
            "image":       "",
            "featured":    False,
            "status":      "Live",
            "color":       "#10B981",
        },
    ],

    "experience": [
        {
            "id":          "exp-1",
            "company":     "TechCorp Inc.",
            "role":        "Senior Software Engineer",
            "period":      "2022 – Present",
            "location":    "San Francisco, CA",
            "description": "Leading backend architecture for a SaaS platform serving 500k+ users. Built microservices handling 50M requests/day.",
            "tags":        ["Python", "Flask", "Kubernetes", "PostgreSQL"],
            "current":     True,
        },
        {
            "id":          "exp-2",
            "company":     "StartupLab",
            "role":        "Full-Stack Engineer",
            "period":      "2019 – 2022",
            "location":    "Remote",
            "description": "First engineering hire. Built the entire product from scratch — from DB schema to pixel-perfect UI. Grew to $2M ARR.",
            "tags":        ["Python", "React", "AWS"],
            "current":     False,
        },
        {
            "id":          "exp-3",
            "company":     "Digital Agency Co.",
            "role":        "Frontend Developer",
            "period":      "2017 – 2019",
            "location":    "New York, NY",
            "description": "Delivered 20+ client websites and web applications. Established front-end coding standards still used today.",
            "tags":        ["JavaScript", "CSS", "WordPress"],
            "current":     False,
        },
    ],

    "testimonials": [
        {
            "id":      "t-1",
            "name":    "Sarah Chen",
            "role":    "CTO, TechCorp Inc.",
            "avatar":  "",
            "text":    "Alex is one of the most technically sharp and reliable engineers I've worked with. Ships fast without compromising quality.",
            "rating":  5,
        },
        {
            "id":      "t-2",
            "name":    "Marcus Rivera",
            "role":    "Founder, StartupLab",
            "avatar":  "",
            "text":    "Hired Alex as our first engineer and it was the best decision we made. Built our entire platform and helped us reach $2M ARR.",
            "rating":  5,
        },
    ],

    "stats": [
        {"label": "Years Experience", "value": "5+"},
        {"label": "Projects Shipped", "value": "40+"},
        {"label": "Happy Clients",    "value": "28"},
        {"label": "GitHub Stars",     "value": "3.2k"},
    ],

    "education": [
        {
            "id":       "edu-1",
            "school":   "UC Berkeley",
            "degree":   "B.S. Computer Science",
            "period":   "2013 – 2017",
            "gpa":      "3.8",
        }
    ],
}
