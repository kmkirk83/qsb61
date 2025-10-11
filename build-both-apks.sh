#!/bin/bash

# 🚀 Quantum Spark Bot™ - Complete APK Build Script
# This script builds both the main app and admin panel APKs

echo "🚀 Quantum Spark Bot™ - Complete APK Build Process"
echo "=================================================="
echo "Building both Main App and Admin Panel APKs..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="your-domain.com"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="build-logs"
RELEASE_DIR="releases"

echo -e "${BLUE}📋 Build Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Timestamp: $TIMESTAMP"
echo "   Log Directory: $LOG_DIR"
echo "   Release Directory: $RELEASE_DIR"
echo ""

# Create directories
mkdir -p "$LOG_DIR" "$RELEASE_DIR"

# Function to log messages
log_message() {
    local message="$1"
    local log_file="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$log_file"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking build prerequisites...${NC}"
    
    local prereq_log="$LOG_DIR/prerequisites_$TIMESTAMP.log"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_message "ERROR: Node.js not found" "$prereq_log"
        echo -e "${RED}❌ Node.js is required. Install from https://nodejs.org/${NC}"
        return 1
    else
        log_message "Node.js found: $(node --version)" "$prereq_log"
        echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_message "ERROR: npm not found" "$prereq_log"
        echo -e "${RED}❌ npm is required${NC}"
        return 1
    else
        log_message "npm found: $(npm --version)" "$prereq_log"
        echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    fi
    
    # Check/install bubblewrap
    if ! command -v bubblewrap &> /dev/null; then
        echo -e "${YELLOW}📦 Installing bubblewrap CLI globally...${NC}"
        log_message "Installing bubblewrap CLI" "$prereq_log"
        npm install -g @bubblewrap/cli
        
        if [ $? -eq 0 ]; then
            log_message "Bubblewrap installed successfully" "$prereq_log"
            echo -e "${GREEN}✅ Bubblewrap installed${NC}"
        else
            log_message "ERROR: Failed to install bubblewrap" "$prereq_log"
            echo -e "${RED}❌ Failed to install bubblewrap${NC}"
            return 1
        fi
    else
        log_message "Bubblewrap found: $(bubblewrap --version)" "$prereq_log"
        echo -e "${GREEN}✅ Bubblewrap: $(bubblewrap --version)${NC}"
    fi
    
    # Check Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${YELLOW}⚠️  ANDROID_HOME not set. Searching...${NC}"
        
        ANDROID_LOCATIONS=(
            "$HOME/Android/Sdk"
            "$HOME/Library/Android/sdk"
            "/usr/local/android-sdk"
            "/opt/android-sdk"
        )
        
        for location in "${ANDROID_LOCATIONS[@]}"; do
            if [ -d "$location" ]; then
                export ANDROID_HOME="$location"
                log_message "Android SDK found at: $ANDROID_HOME" "$prereq_log"
                echo -e "${GREEN}✅ Android SDK: $ANDROID_HOME${NC}"
                break
            fi
        done
        
        if [ -z "$ANDROID_HOME" ]; then
            log_message "ERROR: Android SDK not found" "$prereq_log"
            echo -e "${RED}❌ Android SDK not found. Please install Android Studio${NC}"
            return 1
        fi
    else
        log_message "Android SDK: $ANDROID_HOME" "$prereq_log"
        echo -e "${GREEN}✅ Android SDK: $ANDROID_HOME${NC}"
    fi
    
    # Test internet connectivity to domain
    echo -e "${BLUE}🌐 Testing connectivity to $DOMAIN...${NC}"
    if curl -s --head "https://$DOMAIN" > /dev/null; then
        log_message "Domain connectivity verified" "$prereq_log"
        echo -e "${GREEN}✅ Domain accessible${NC}"
    else
        log_message "WARNING: Cannot reach domain" "$prereq_log"
        echo -e "${YELLOW}⚠️  Cannot reach $DOMAIN - builds may fail${NC}"
    fi
    
    echo ""
    return 0
}

# Function to build main app
build_main_app() {
    echo -e "${PURPLE}🔨 Building Main App APK...${NC}"
    echo "=============================="
    
    local build_log="$LOG_DIR/main_app_build_$TIMESTAMP.log"
    log_message "Starting main app build" "$build_log"
    
    # Run main app build script
    chmod +x build-main-apk.sh
    ./build-main-apk.sh 2>&1 | tee -a "$build_log"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_message "Main app build completed successfully" "$build_log"
        
        # Copy to release directory
        if [ -f "builds/quantum-spark-bot-main.apk" ]; then
            cp "builds/quantum-spark-bot-main.apk" "$RELEASE_DIR/quantum-spark-bot-main-$TIMESTAMP.apk"
            cp "builds/quantum-spark-bot-main.apk" "$RELEASE_DIR/quantum-spark-bot-main-latest.apk"
            echo -e "${GREEN}✅ Main App APK ready${NC}"
            return 0
        else
            log_message "ERROR: Main app APK not found after build" "$build_log"
            echo -e "${RED}❌ Main app APK not found${NC}"
            return 1
        fi
    else
        log_message "ERROR: Main app build failed" "$build_log"
        echo -e "${RED}❌ Main app build failed${NC}"
        return 1
    fi
}

# Function to build admin panel
build_admin_panel() {
    echo -e "${PURPLE}🔨 Building Admin Panel APK...${NC}"
    echo "================================"
    
    local build_log="$LOG_DIR/admin_panel_build_$TIMESTAMP.log"
    log_message "Starting admin panel build" "$build_log"
    
    # Run admin panel build script
    chmod +x build-admin-apk.sh
    ./build-admin-apk.sh 2>&1 | tee -a "$build_log"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_message "Admin panel build completed successfully" "$build_log"
        
        # Copy to release directory
        if [ -f "builds/quantum-spark-admin-panel.apk" ]; then
            cp "builds/quantum-spark-admin-panel.apk" "$RELEASE_DIR/quantum-spark-admin-panel-$TIMESTAMP.apk"
            cp "builds/quantum-spark-admin-panel.apk" "$RELEASE_DIR/quantum-spark-admin-panel-latest.apk"
            echo -e "${GREEN}✅ Admin Panel APK ready${NC}"
            return 0
        else
            log_message "ERROR: Admin panel APK not found after build" "$build_log"
            echo -e "${RED}❌ Admin panel APK not found${NC}"
            return 1
        fi
    else
        log_message "ERROR: Admin panel build failed" "$build_log"
        echo -e "${RED}❌ Admin panel build failed${NC}"
        return 1
    fi
}

# Function to create release manifest
create_release_manifest() {
    local manifest_file="$RELEASE_DIR/release-manifest-$TIMESTAMP.json"
    
    cat > "$manifest_file" << EOF
{
  "release_info": {
    "timestamp": "$TIMESTAMP",
    "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "domain": "$DOMAIN",
    "builder": "$(whoami)",
    "build_host": "$(hostname)",
    "node_version": "$(node --version)",
    "bubblewrap_version": "$(bubblewrap --version 2>/dev/null || echo 'unknown')"
  },
  "artifacts": {
    "main_app": {
      "filename": "quantum-spark-bot-main-$TIMESTAMP.apk",
      "latest": "quantum-spark-bot-main-latest.apk",
      "package_id": "com.quantumsparkbot.app",
      "size": "$(du -h "$RELEASE_DIR/quantum-spark-bot-main-latest.apk" 2>/dev/null | cut -f1 || echo 'unknown')"
    },
    "admin_panel": {
      "filename": "quantum-spark-admin-panel-$TIMESTAMP.apk",
      "latest": "quantum-spark-admin-panel-latest.apk",
      "package_id": "com.quantumsparkbot.admin",
      "size": "$(du -h "$RELEASE_DIR/quantum-spark-admin-panel-latest.apk" 2>/dev/null | cut -f1 || echo 'unknown')"
    }
  },
  "build_logs": {
    "prerequisites": "build-logs/prerequisites_$TIMESTAMP.log",
    "main_app": "build-logs/main_app_build_$TIMESTAMP.log",
    "admin_panel": "build-logs/admin_panel_build_$TIMESTAMP.log"
  }
}
EOF

    echo -e "${BLUE}📄 Release manifest created: $manifest_file${NC}"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🚀 Starting complete APK build process...${NC}"
    echo ""
    
    # Check prerequisites
    if ! check_prerequisites; then
        echo -e "${RED}❌ Prerequisites check failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🎯 Starting APK builds...${NC}"
    echo ""
    
    local main_success=false
    local admin_success=false
    
    # Build main app
    if build_main_app; then
        main_success=true
    fi
    
    echo ""
    
    # Build admin panel
    if build_admin_panel; then
        admin_success=true
    fi
    
    echo ""
    echo "=============================================="
    
    # Create release manifest
    create_release_manifest
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo -e "${BLUE}📊 Build Summary:${NC}"
    echo "=================="
    echo -e "Build Duration: ${minutes}m ${seconds}s"
    echo -e "Main App: $(if $main_success; then echo -e "${GREEN}✅ Success${NC}"; else echo -e "${RED}❌ Failed${NC}"; fi)"
    echo -e "Admin Panel: $(if $admin_success; then echo -e "${GREEN}✅ Success${NC}"; else echo -e "${RED}❌ Failed${NC}"; fi)"
    echo ""
    
    if $main_success && $admin_success; then
        echo -e "${GREEN}🎉 ALL BUILDS SUCCESSFUL!${NC}"
        echo ""
        echo -e "${BLUE}📦 Release Files:${NC}"
        ls -la "$RELEASE_DIR"/*.apk 2>/dev/null || echo "No APK files found"
        echo ""
        echo -e "${BLUE}📱 Installation Commands:${NC}"
        echo "Main App: adb install $RELEASE_DIR/quantum-spark-bot-main-latest.apk"
        echo "Admin Panel: adb install $RELEASE_DIR/quantum-spark-admin-panel-latest.apk"
        echo ""
        echo -e "${YELLOW}🔐 Security Reminders:${NC}"
        echo "• Test both APKs thoroughly before distribution"
        echo "• Admin panel should only be given to authorized users"
        echo "• Consider code signing for production releases"
        echo "• Use proper distribution channels (Google Play, Enterprise)"
        
        return 0
    else
        echo -e "${RED}❌ Some builds failed. Check logs for details.${NC}"
        echo ""
        echo -e "${BLUE}📋 Troubleshooting:${NC}"
        echo "1. Check build logs in $LOG_DIR/"
        echo "2. Verify PWA manifests are accessible online"
        echo "3. Ensure service workers are working correctly"
        echo "4. Confirm Android SDK is properly configured"
        
        return 1
    fi
}

# Run main function
main "$@"