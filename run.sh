#!/usr/bin/env bash
# ═══════════════════════════════════════════
#  Portfolio Pro v2 — Quick Start (Linux/Mac)
# ═══════════════════════════════════════════
set -e
cd "$(dirname "$0")"

PYTHON=""
for cmd in python3 python; do
  command -v "$cmd" &>/dev/null && PYTHON="$cmd" && break
done
[ -z "$PYTHON" ] && echo "❌ Python not found → https://python.org" && exit 1

echo ""; echo "══════════════════════════════════════"
echo "  ◆  Portfolio Pro v2"
echo "══════════════════════════════════════"
printf "  Python: "; $PYTHON --version
echo ""

[ ! -d ".venv" ] && echo "  Creating virtual environment..." && $PYTHON -m venv .venv

# Activate
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null

echo "  Installing dependencies..."
pip install -q -r requirements.txt

echo "  Starting server..."
echo "  → Open: http://localhost:5000"
echo "  → Edit: Click 'Edit Portfolio' or press Ctrl+E"
echo "  → Stop: Ctrl+C"
echo "══════════════════════════════════════"; echo ""

python app.py
