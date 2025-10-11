#!/bin/bash

# 🚀 Quantum Spark Bot™ - Admin Panel APK Build Script
# This script builds the admin panel as an Android APK

echo "🚀 Building Quantum Spark Bot Admin Panel APK..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="your-domain.com"
APP_NAME="QuantumSparkAdmin"
PACKAGE_ID="com.quantumsparkbot.admin"
BUILD_DIR="builds/admin-panel"

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

# Initialize bubblewrap project for admin panel
echo -e "${BLUE}🔧 Initializing Admin Panel TWA project...${NC}"

# Create the initialization configuration for admin panel
cat > admin-init-config.json << EOF
{
  "packageId": "$PACKAGE_ID",
  "host": "https://$DOMAIN",
  "name": "Quantum Spark Admin",
  "launcherName": "Quantum Admin",
  "display": "standalone",
  "orientation": "portrait",
  "themeColor": "#7c3aed",
  "backgroundColor": "#f8fafc",
  "startUrl": "/admin-panel.html",
  "iconUrl": "https://$DOMAIN/icons/admin-icon-512x512.png",
  "maskableIconUrl": "https://$DOMAIN/icons/admin-icon-512x512.png",
  "shortcuts": [
    {
      "name": "Dashboard",
      "shortName": "Dashboard",
      "url": "/admin-panel.html#dashboard",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/admin-shortcut-dashboard.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Users",
      "shortName": "Users",
      "url": "/admin-panel.html#users",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/admin-shortcut-users.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Analytics",
      "shortName": "Analytics",
      "url": "/admin-panel.html#analytics",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/admin-shortcut-analytics.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Settings",
      "shortName": "Settings",
      "url": "/admin-panel.html#system",
      "icons": [
        {
          "src": "https://$DOMAIN/icons/admin-shortcut-settings.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
EOF

# Initialize with admin manifest URL
echo -e "${YELLOW}📄 Fetching Admin PWA manifest from https://$DOMAIN/admin-manifest.json${NC}"
bubblewrap init --manifest="https://$DOMAIN/admin-manifest.json"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to initialize Admin TWA project${NC}"
    echo -e "${YELLOW}💡 Make sure:${NC}"
    echo "   1. Your admin panel is live at https://$DOMAIN/admin-panel.html"
    echo "   2. admin-manifest.json is accessible"
    echo "   3. Admin service worker is registered"
    echo "   4. Admin panel has proper PWA meta tags"
    exit 1
fi

echo -e "${GREEN}✅ Admin TWA project initialized successfully${NC}"

# Update package ID to distinguish from main app
echo -e "${BLUE}🔧 Configuring admin-specific settings...${NC}"

# Customize the generated twa-manifest.json for admin panel
if [ -f "twa-manifest.json" ]; then
    # Update the package ID and other admin-specific settings
    sed -i.backup "s/com\.quantumsparkbot\.app/com.quantumsparkbot.admin/g" twa-manifest.json
    sed -i.backup "s/Quantum Spark Bot/Quantum Spark Admin/g" twa-manifest.json
    echo -e "${GREEN}✅ Admin configuration updated${NC}"
fi

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

# Custom admin panel configurations
echo -e "${BLUE}🔐 Adding admin panel security configurations...${NC}"

# Create custom values for admin panel
mkdir -p app/src/main/res/values
cat > app/src/main/res/values/admin_config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Quantum Spark Admin</string>
    <string name="admin_mode">true</string>
    <string name="require_authentication">true</string>
    <bool name="debug_enabled">false</bool>
</resources>
EOF

# Add admin-specific permissions to AndroidManifest.xml
if [ -f "app/src/main/AndroidManifest.xml" ]; then
    # Add admin-specific permissions
    sed -i.backup '/<application/i\
    <!-- Admin Panel Specific Permissions -->\
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />\
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    ' app/src/main/AndroidManifest.xml
    
    echo -e "${GREEN}✅ Admin permissions added${NC}"
fi

# Build APK
echo -e "${BLUE}🔨 Building Admin Panel APK...${NC}"
echo "This may take several minutes on first build..."

bubblewrap build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! Admin Panel APK built successfully!${NC}"
    echo -e "${GREEN}📍 Location: $(pwd)/app/build/outputs/apk/release/app-release.apk${NC}"
    
    # Check if APK file exists and show info
    APK_FILE="app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_FILE" ]; then
        APK_SIZE=$(du -h "$APK_FILE" | cut -f1)
        echo -e "${BLUE}📊 APK Size: $APK_SIZE${NC}"
        
        # Copy to easier location with admin-specific name
        cp "$APK_FILE" "../quantum-spark-admin-panel.apk"
        echo -e "${GREEN}📦 APK copied to: $(pwd)/../quantum-spark-admin-panel.apk${NC}"
        
        # Create a debug version as well
        DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$DEBUG_APK" ]; then
            cp "$DEBUG_APK" "../quantum-spark-admin-debug.apk"
            echo -e "${YELLOW}🔧 Debug APK: $(pwd)/../quantum-spark-admin-debug.apk${NC}"
        fi
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Admin Panel Next Steps:${NC}"
    echo "1. Test the admin APK on an Android device"
    echo "2. Verify admin authentication works correctly"
    echo "3. Test all admin panel features offline"
    echo "4. Configure enterprise distribution or internal testing"
    echo ""
    echo -e "${YELLOW}📱 Install commands:${NC}"
    echo "Production: adb install quantum-spark-admin-panel.apk"
    echo "Debug: adb install quantum-spark-admin-debug.apk"
    
    echo ""
    echo -e "${RED}🔐 SECURITY NOTICE:${NC}"
    echo "⚠️  The admin panel APK should only be distributed to authorized administrators"
    echo "⚠️  Consider additional authentication layers for production use"
    echo "⚠️  Use enterprise distribution methods for enhanced security"
    
else
    echo -e "${RED}❌ Admin Panel build failed!${NC}"
    echo -e "${YELLOW}💡 Admin Panel Troubleshooting:${NC}"
    echo "1. Check that your admin panel is accessible at https://$DOMAIN/admin-panel.html"
    echo "2. Verify admin-manifest.json is properly configured"
    echo "3. Ensure admin service worker (admin-sw.js) is working"
    echo "4. Check that Android SDK is properly installed"
    echo "5. Verify Java JDK 8+ is installed"
    echo "6. Check the build logs above for specific errors"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Admin Panel build process completed!${NC}"
echo -e "${BLUE}🎯 Both apps are now ready for deployment:${NC}"
echo "   • Main App: quantum-spark-bot-main.apk"
echo "   • Admin Panel: quantum-spark-admin-panel.apk"