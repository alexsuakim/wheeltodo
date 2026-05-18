#!/bin/bash
# ionstudioapps — new Mac setup
# Run once after completing the GitHub + Claude Code steps in the onboarding doc.
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/ionstudioapps/wheeltodo/main/scripts/setup.sh)

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

ok()   { echo -e "${GREEN}✅ $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠️  $1${RESET}"; }
fail() { echo -e "${RED}❌ $1${RESET}"; }
step() { echo -e "\n${BOLD}── $1${RESET}"; }

echo -e "${BOLD}"
echo "  ionstudioapps setup"
echo "  ───────────────────"
echo -e "${RESET}"

# ── 1. Homebrew ──────────────────────────────────────────────────────────────
step "Homebrew"
if command -v brew &>/dev/null; then
  ok "Homebrew already installed"
else
  warn "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  ok "Homebrew installed"
fi

# ── 2. Core tools ────────────────────────────────────────────────────────────
step "Core tools (git, node, gh)"

if ! command -v git &>/dev/null; then
  warn "Installing git..."
  xcode-select --install 2>/dev/null || true
  ok "git installed"
else
  ok "git $(git --version | awk '{print $3}')"
fi

if ! command -v node &>/dev/null; then
  warn "Installing Node.js..."
  brew install node
  ok "Node.js installed"
else
  ok "Node $(node -v)"
fi

if ! command -v gh &>/dev/null; then
  warn "Installing GitHub CLI..."
  brew install gh
  ok "gh installed"
else
  ok "gh $(gh --version | head -1 | awk '{print $3}')"
fi

# ── 3. Claude Code PATH fix ───────────────────────────────────────────────────
step "Claude Code PATH"
if ! grep -q '\.local/bin' ~/.zshrc 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
  export PATH="$HOME/.local/bin:$PATH"
  ok "Added ~/.local/bin to PATH"
else
  ok "PATH already configured"
fi

if command -v claude &>/dev/null; then
  ok "claude $(claude --version 2>/dev/null | head -1)"
else
  warn "Claude Code not found in PATH — open a new terminal tab and re-run this script if you just installed it"
fi

# ── 4. GitHub auth ───────────────────────────────────────────────────────────
step "GitHub login"
if gh auth status &>/dev/null; then
  GH_USER=$(gh api user --jq '.login' 2>/dev/null)
  ok "Logged in as ${GH_USER}"

  if gh api orgs/ionstudioapps/members --jq '.[].login' 2>/dev/null | grep -q "^${GH_USER}$"; then
    ok "Member of ionstudioapps org"
  else
    warn "Not yet a member of ionstudioapps — ask Sua to invite your GitHub username (${GH_USER})"
    warn "Then re-run this script once you've accepted the invite"
    exit 1
  fi
else
  warn "Not logged into GitHub — opening browser login..."
  gh auth login --hostname github.com --web
fi

# ── 5. Clone repos ───────────────────────────────────────────────────────────
step "Cloning ionstudioapps repos"
mkdir -p ~/Projects
cd ~/Projects

REPOS=("wheeltodo" "rocky" "studio")
for repo in "${REPOS[@]}"; do
  if [ -d "$HOME/Projects/$repo/.git" ]; then
    ok "$repo already cloned — pulling latest"
    git -C "$HOME/Projects/$repo" pull --quiet
  else
    warn "Cloning $repo..."
    gh repo clone "ionstudioapps/$repo" "$HOME/Projects/$repo" 2>/dev/null && ok "$repo cloned" || warn "$repo not accessible (you may not have permission)"
  fi
done

# ── 6. Install dependencies ───────────────────────────────────────────────────
step "Installing dependencies"

if [ -d "$HOME/Projects/wheeltodo" ]; then
  warn "Installing wheeltodo dependencies..."
  npm install --prefix "$HOME/Projects/wheeltodo" --silent
  ok "wheeltodo dependencies installed"
fi

if [ -d "$HOME/Projects/rocky" ]; then
  warn "Installing rocky dependencies..."
  npm install --prefix "$HOME/Projects/rocky" --silent
  ok "rocky dependencies installed"
fi

# ── 7. Summary ───────────────────────────────────────────────────────────────
echo -e "\n${BOLD}── Done! ──────────────────────────────${RESET}"
echo ""
echo "  Open wheeltodo in Claude:"
echo "  cd ~/Projects/wheeltodo && claude"
echo ""
echo "  Next steps:"
echo "  • Ask Sua for the secrets file (rocky/.env)"
echo "  • Web app: cd apps/web && npm run dev"
echo "  • Read TEAM.md for project overview"
echo ""
