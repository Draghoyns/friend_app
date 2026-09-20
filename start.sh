#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "${CYAN}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✔ $*${NC}"; }
error() { echo -e "${RED}✖ $*${NC}"; exit 1; }

command -v node >/dev/null || error "Node.js not found — install it from https://nodejs.org"

info "Installing frontend dependencies…"
cd "$FRONTEND"
npm install --silent
ok "Node deps ready"

info "Starting Orbit on http://localhost:5174 …"
npm run dev
