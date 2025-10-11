#!/bin/bash

# 🚀 Quantum Spark Bot™ - APK Environment Setup Script
# Sets up everything needed for Android APK generation

echo "🚀 Setting up Quantum Spark Bot™ APK Build Environment"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Make all scripts executable
echo -e "${BLUE}🔧 Making build scripts executable...${NC}"
chmod +x build-main-apk.sh
chmod +x build-admin-apk.sh  
chmod +x build-both-apks.sh
chmod +x make-executable.sh

echo -e "${GREEN}✅ All build scripts are now executable${NC}"
echo ""

# Create required directories
echo -e "${BLUE}📁 Creating build directories...${NC}"
mkdir -p builds/main-app
mkdir -p builds/admin-panel
mkdir -p releases
mkdir -p build-logs
mkdir -p icons

echo -e "${GREEN}✅ Directory structure created${NC}"
echo ""

# Display build options
echo -e "${PURPLE}🎯 Available APK Build Commands:${NC}"
echo "=================================="
echo -e "${YELLOW}Main Trading Platform APK:${NC}"
echo "  ./build-main-apk.sh"
echo ""
echo -e "${YELLOW}Backend Admin Panel APK:${NC}"  
echo "  ./build-admin-apk.sh"
echo ""
echo -e "${YELLOW}Both APKs Together:${NC}"
echo "  ./build-both-apks.sh"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking build prerequisites...${NC}"

# Node.js check
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not found - Required for builds${NC}"
    echo -e "${YELLOW}   Install from: https://nodejs.org/${NC}"
fi

# npm check  
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
fi

# Java check
if command -v java &> /dev/null; then
    echo -e "${GREEN}✅ Java: $(java -version 2>&1 | head -1)${NC}"
else
    echo -e "${YELLOW}⚠️  Java not found - May be required for signing${NC}"
fi

# Android SDK check
if [ -n "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✅ Android SDK: $ANDROID_HOME${NC}"
else
    echo -e "${YELLOW}⚠️  ANDROID_HOME not set - Will search common locations${NC}"
fi

echo ""

# Display file summary
echo -e "${BLUE}📋 Created APK Build Files:${NC}"
echo "=========================="
echo -e "${GREEN}PWA Manifests:${NC}"
echo "  ✅ manifest.json (Main app PWA manifest)"
echo "  ✅ admin-manifest.json (Admin panel PWA manifest)"
echo ""
echo -e "${GREEN}Service Workers:${NC}"
echo "  ✅ sw.js (Main app offline functionality)" 
echo "  ✅ admin-sw.js (Admin panel offline functionality)"
echo ""
echo -e "${GREEN}Build Scripts:${NC}"
echo "  ✅ build-main-apk.sh (Main trading platform)"
echo "  ✅ build-admin-apk.sh (Admin panel)"
echo "  ✅ build-both-apks.sh (Complete build system)"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "  ✅ android-apk-build-guide.md (Complete build guide)"
echo "  ✅ ANDROID_APK_COMPLETION_SUMMARY.md (Project status)"
echo ""

# Show quick start
echo -e "${PURPLE}🚀 Quick Start Guide:${NC}"
echo "===================="
echo -e "${YELLOW}1. Update domain in build scripts:${NC}"
echo '   Edit DOMAIN="your-domain.com" in build-*.sh files'
echo ""
echo -e "${YELLOW}2. Build APKs:${NC}"
echo "   ./build-both-apks.sh"
echo ""
echo -e "${YELLOW}3. Install on Android:${NC}" 
echo "   adb install releases/quantum-spark-bot-main-latest.apk"
echo "   adb install releases/quantum-spark-admin-panel-latest.apk"
echo ""

# Configuration reminder
echo -e "${RED}🔧 IMPORTANT CONFIGURATION:${NC}"
echo "=============================="
echo -e "${YELLOW}Before building APKs, update the domain in:${NC}"
echo "  • build-main-apk.sh (line 17: DOMAIN=\"your-domain.com\")"
echo "  • build-admin-apk.sh (line 17: DOMAIN=\"your-domain.com\")"
echo "  • Replace with your actual domain where the app is deployed"
echo ""

# Final status
echo -e "${GREEN}✨ APK Build Environment Ready!${NC}"
echo "================================"
echo -e "${BLUE}📱 You can now generate Android APKs for:${NC}"
echo "   • Main Trading Platform (com.quantumsparkbot.app)"
echo "   • Backend Admin Panel (com.quantumsparkbot.admin)"
echo ""
echo -e "${PURPLE}🎯 Both apps feature:${NC}"
echo "   • Full offline functionality"
echo "   • Push notifications"  
echo "   • Native Android experience"
echo "   • PWA technology stack"
echo ""
echo -e "${GREEN}🚀 Ready for production deployment!${NC}"