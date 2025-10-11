#!/bin/bash

# 🚀 Quantum Spark Bot™ - Main App APK Build Script
# This script builds the main trading platform as an Android APK

echo "🚀 Building Quantum Spark Bot Main App APK..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="your-domain.com"
APP_NAME="QuantumSparkBot"
PACKAGE_ID="com.quantumsparkbot.app"
BUILD_DIR="builds/main-app"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Package ID: $PACKAGE_ID"
echo "   Build Directory: $BUILD_DIR"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js from https://nodejs.org/${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
fi

# Install bubblewrap if not present
if ! command -v bubblewrap &> /dev/null; then
    echo -e "${YELLOW}📦 Installing bubblewrap CLI...${NC}"
    npm install -g @bubblewrap/cli
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Bubblewrap installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install bubblewrap${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Bubblewrap found: $(bubblewrap --version)${NC}"
fi

echo ""

# Create build directory
echo -e "${BLUE}📁 Setting up build environment...${NC}"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Check if project already initialized
if [ -f "twa-manifest.json" ]; then
    echo -e "${YELLOW}⚠️  Project already initialized. Rebuilding...${NC}"
    rm -rf ./*
fi

# Initialize bubblewrap project
echo -e "${BLUE}🔧 Initializing TWA project...${NC}"

# Create the initialization automatically
cat > init-config.json << EOF
{
  "packageId": "$PACKAGE_ID",
  "host": "https://$DOMAIN",
  "name": "Quantum Spark Bot",
  "launcherName": "Quantum Spark",
  "display": "standalone",
  "orientation": "portrait",
  "themeColor": "#7c3aed",
  "backgroundColor": "#f8fafc",
  "startUrl": "/",
  "iconUrl": "https://$DOMAIN/icons/icon-512x512.png",
  "maskableIconUrl": "https://$DOMAIN/icons/icon-512x512.png",
  "shortcuts": [
    {
      "name": "Start Trading",
      "shortName": "Trade",
      "url": "/#trading",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/shortcut-trading.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Analytics",
      "shortName": "Analytics",
      "url": "/#analytics",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/shortcut-analytics.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Upgrade",
      "shortName": "Upgrade",
      "url": "/#upgrade",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/shortcut-upgrade.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
EOF

# Initialize with manifest URL
echo -e "${YELLOW}📄 Fetching PWA manifest from https://$DOMAIN/manifest.json${NC}"
bubblewrap init --manifest="https://$DOMAIN/manifest.json"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to initialize TWA project${NC}"
    echo -e "${YELLOW}💡 Make sure:${NC}"
    echo "   1. Your website is live at https://$DOMAIN"
    echo "   2. manifest.json is accessible"
    echo "   3. Service worker is registered"
    exit 1
fi

echo -e "${GREEN}✅ TWA project initialized successfully${NC}"

# Check for Android SDK
echo -e "${BLUE}🤖 Checking Android environment...${NC}"

if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️  ANDROID_HOME not set. Trying common locations...${NC}"
    
    # Common Android SDK locations
    ANDROID_LOCATIONS=(
        "$HOME/Android/Sdk"
        "$HOME/Library/Android/sdk"
        "/usr/local/android-sdk"
        "/opt/android-sdk"
    )
    
    for location in "${ANDROID_LOCATIONS[@]}"; do
        if [ -d "$location" ]; then
            export ANDROID_HOME="$location"
            echo -e "${GREEN}✅ Found Android SDK at: $ANDROID_HOME${NC}"
            break
        fi
    done
    
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${RED}❌ Android SDK not found${NC}"
        echo -e "${YELLOW}💡 Please install Android Studio or set ANDROID_HOME${NC}"
        exit 1
    fi
fi

# Add Android tools to PATH if not present
if ! command -v adb &> /dev/null; then
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"
fi

# Build APK
echo -e "${BLUE}🔨 Building APK...${NC}"
echo "This may take several minutes on first build..."

bubblewrap build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! APK built successfully!${NC}"
    echo -e "${GREEN}📍 Location: $(pwd)/app/build/outputs/apk/release/app-release.apk${NC}"
    
    # Check if APK file exists and show info
    APK_FILE="app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_FILE" ]; then
        APK_SIZE=$(du -h "$APK_FILE" | cut -f1)
        echo -e "${BLUE}📊 APK Size: $APK_SIZE${NC}"
        
        # Copy to easier location
        cp "$APK_FILE" "../quantum-spark-bot-main.apk"
        echo -e "${GREEN}📦 APK copied to: $(pwd)/../quantum-spark-bot-main.apk${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "1. Test the APK on an Android device"
    echo "2. Upload to Google Play Console for distribution"
    echo "3. Or share directly with users for beta testing"
    echo ""
    echo -e "${YELLOW}📱 Install command:${NC}"
    echo "adb install quantum-spark-bot-main.apk"
    
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo "1. Check that your PWA is accessible and working"
    echo "2. Verify Android SDK is properly installed"
    echo "3. Make sure you have Java JDK 8+ installed"
    echo "4. Check the build logs above for specific errors"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Build process completed!${NC}"