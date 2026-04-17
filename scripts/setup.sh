#!/usr/bin/env bash
# setup.sh — Bootstrap this machine for local dev and Fastlane publishing.
# Safe to run multiple times (idempotent).
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BOLD}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# 1. Homebrew
# ---------------------------------------------------------------------------
info "Checking Homebrew..."
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add Homebrew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  success "Homebrew already installed"
fi

# ---------------------------------------------------------------------------
# 2. Watchman
# ---------------------------------------------------------------------------
info "Checking Watchman..."
if ! command -v watchman &>/dev/null; then
  brew install watchman
else
  success "Watchman already installed"
fi

# ---------------------------------------------------------------------------
# 3. NVM + Node 20
# ---------------------------------------------------------------------------
info "Checking nvm..."
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  info "Installing nvm..."
  brew install nvm
  mkdir -p "$NVM_DIR"
fi
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"

info "Checking Node 20..."
if ! nvm ls 20 &>/dev/null || [[ "$(node --version 2>/dev/null | cut -d. -f1)" != "v20" ]]; then
  info "Installing Node 20..."
  nvm install 20
fi
nvm use 20
nvm alias default 20
success "Node $(node --version)"

# ---------------------------------------------------------------------------
# 4. pnpm
# ---------------------------------------------------------------------------
info "Checking pnpm..."
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
else
  success "pnpm $(pnpm --version)"
fi

# ---------------------------------------------------------------------------
# 5. rbenv + Ruby 3.3.0
# ---------------------------------------------------------------------------
info "Checking rbenv..."
if ! command -v rbenv &>/dev/null; then
  brew install rbenv ruby-build
  eval "$(rbenv init -)"
else
  eval "$(rbenv init -)"
  success "rbenv $(rbenv --version)"
fi

RUBY_VERSION="3.3.0"
info "Checking Ruby $RUBY_VERSION..."
if ! rbenv versions | grep -q "$RUBY_VERSION"; then
  info "Installing Ruby $RUBY_VERSION (this may take a few minutes)..."
  rbenv install "$RUBY_VERSION"
fi
rbenv global "$RUBY_VERSION"
success "Ruby $(ruby --version)"

# ---------------------------------------------------------------------------
# 6. CocoaPods + Fastlane
# ---------------------------------------------------------------------------
info "Checking CocoaPods..."
if ! gem list cocoapods -i &>/dev/null; then
  gem install cocoapods
else
  success "CocoaPods $(pod --version)"
fi

info "Checking Fastlane..."
if ! gem list fastlane -i &>/dev/null; then
  gem install fastlane
else
  success "Fastlane $(fastlane --version | head -1)"
fi

# ---------------------------------------------------------------------------
# 7. JDK 17
# ---------------------------------------------------------------------------
info "Checking JDK 17..."
if ! /usr/libexec/java_home -v 17 &>/dev/null; then
  info "Installing OpenJDK 17..."
  brew install openjdk@17
  sudo ln -sfn "$(brew --prefix openjdk@17)/libexec/openjdk.jdk" \
    /Library/Java/JavaVirtualMachines/openjdk-17.jdk
else
  success "JDK 17 found"
fi
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"

# ---------------------------------------------------------------------------
# 8. Android SDK
# ---------------------------------------------------------------------------
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [[ ! -d "$ANDROID_HOME" ]]; then
  warn "Android SDK not found at $ANDROID_HOME"
  warn "Install Android Studio from https://developer.android.com/studio"
  warn "Then re-run this script, or set ANDROID_HOME to your SDK path."
else
  success "Android SDK found at $ANDROID_HOME"
  export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"

  info "Checking Android platform/build tools..."
  if command -v sdkmanager &>/dev/null; then
    sdkmanager --install "platform-tools" "platforms;android-35" "build-tools;35.0.0" "cmdline-tools;latest" 2>/dev/null || true
    success "Android SDK components up to date"
  else
    warn "sdkmanager not found — install SDK components manually in Android Studio"
  fi
fi

# ---------------------------------------------------------------------------
# 9. Xcode check
# ---------------------------------------------------------------------------
info "Checking Xcode..."
if ! xcode-select -p &>/dev/null; then
  error "Xcode not found. Install from the Mac App Store, then re-run this script."
fi
if ! xcodebuild -version &>/dev/null 2>&1; then
  warn "Xcode found but license may not be accepted. Run: sudo xcodebuild -license accept"
else
  success "$(xcodebuild -version | head -1)"
fi

# ---------------------------------------------------------------------------
# 10. SSH key for certs repo
# ---------------------------------------------------------------------------
info "Checking SSH access to GitHub..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  success "GitHub SSH access OK"
else
  warn "Could not verify GitHub SSH access."
  warn "Make sure your SSH key is added to GitHub: https://github.com/settings/keys"
fi

# ---------------------------------------------------------------------------
# 11. Secrets check
# ---------------------------------------------------------------------------
info "Checking secrets..."
SECRETS_DIR="$HOME/.fastlane/api_keys"
KEYSTORE_SRC="$SECRETS_DIR/400scorekeeper.keystore"
ENV_FILE="$REPO_ROOT/fastlane/.env"

if [[ ! -d "$SECRETS_DIR" ]]; then
  warn "~/.fastlane/api_keys/ not found. Create it and place your secrets there."
  warn "Required files:"
  warn "  $SECRETS_DIR/400scorekeeper.keystore"
  warn "  $SECRETS_DIR/AuthKey_XXXXXXXXXX.p8"
  warn "  $SECRETS_DIR/play-store-key.json"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  warn "fastlane/.env not found. Copy fastlane/.env.example to fastlane/.env and fill in your values."
fi

# ---------------------------------------------------------------------------
# 12. Project dependencies
# ---------------------------------------------------------------------------
info "Installing JS dependencies..."
cd "$REPO_ROOT"
pnpm install
success "pnpm install complete"

# ---------------------------------------------------------------------------
# 13. expo prebuild
# ---------------------------------------------------------------------------
info "Running expo prebuild (generates ios/ and android/)..."
pnpm expo prebuild --clean
success "prebuild complete"

# ---------------------------------------------------------------------------
# 14. Copy Android keystore back (prebuild wipes android/)
# ---------------------------------------------------------------------------
info "Copying Android keystore from $SECRETS_DIR..."
if [[ -f "$KEYSTORE_SRC" ]]; then
  cp "$KEYSTORE_SRC" "$REPO_ROOT/android/400scorekeeper.keystore"
  success "Keystore copied to android/"
else
  warn "Keystore not found at $KEYSTORE_SRC — Android builds will fail until it is placed there."
fi

# ---------------------------------------------------------------------------
# 15. pod install
# ---------------------------------------------------------------------------
if [[ -d "$REPO_ROOT/ios" ]]; then
  info "Running pod install..."
  cd "$REPO_ROOT/ios"
  pod install
  cd "$REPO_ROOT"
  success "pod install complete"
else
  warn "ios/ not found — skipping pod install"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}Setup complete.${NC}"
echo ""
echo "Next steps:"
echo "  pnpm expo run:ios       — run on iOS simulator"
echo "  pnpm expo run:android   — run on Android emulator"
echo "  pnpm test               — run tests"
echo "  fastlane ios release    — build + submit to App Store"
echo "  fastlane android release — build + submit to Play Store"
echo ""
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${YELLOW}⚠  Remember to create fastlane/.env before running Fastlane lanes.${NC}"
fi
