#!/bin/bash
# Make all build scripts executable

echo "🔧 Making build scripts executable..."

chmod +x build-main-apk.sh
chmod +x build-admin-apk.sh  
chmod +x build-both-apks.sh

echo "✅ All build scripts are now executable!"
echo ""
echo "📋 Available build commands:"
echo "  ./build-main-apk.sh      - Build main trading platform APK"
echo "  ./build-admin-apk.sh     - Build admin panel APK"  
echo "  ./build-both-apks.sh     - Build both APKs together"