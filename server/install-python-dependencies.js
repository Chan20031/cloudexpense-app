#!/usr/bin/env node
/**
 * Post-install script to set up Python dependencies for Prophet AI
 * This runs after npm install completes
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🐍 CloudExpense Python Dependencies Installer');
console.log('=' * 50);

// Check if we're in a build environment (App Runner, Docker, etc.)
const isBuildEnvironment = process.env.NODE_ENV === 'production' || 
                          process.env.AWS_REGION || 
                          process.env.CODEBUILD_BUILD_ID ||
                          process.env.DOCKER_CONTAINER ||
                          process.env.AWS_APP_RUNNER_SERVICE_ARN;

console.log(`Environment: ${isBuildEnvironment ? 'Production/Build' : 'Development'}`);

function runCommand(command, description, timeout = 180000) { // Increased timeout for Prophet
    try {
        console.log(`📦 ${description}...`);
        const result = execSync(command, { 
            stdio: 'inherit', 
            timeout: timeout,
            encoding: 'utf8' 
        });
        console.log(`✅ ${description} completed`);
        return true;
    } catch (error) {
        console.log(`⚠️  ${description} failed: ${error.message}`);
        return false;
    }
}

function checkPython() {
    try {
        const version = execSync('python3 --version', { encoding: 'utf8', timeout: 5000 });
        console.log(`✅ Python: ${version.trim()}`);
        return true;
    } catch (error) {
        console.log('❌ Python3 not found, trying python...');
        try {
            const version = execSync('python --version', { encoding: 'utf8', timeout: 5000 });
            console.log(`✅ Python: ${version.trim()}`);
            return 'python';
        } catch (error2) {
            console.log('❌ Python not found');
            return false;
        }
    }
}

function installSystemDependencies() {
    if (!isBuildEnvironment) {
        console.log('⏭️  Skipping system dependencies (development environment)');
        return true;
    }

    // Try different package managers
    const managers = [
        { cmd: 'yum install -y python3 python3-pip python3-devel gcc gcc-c++', name: 'YUM (Amazon Linux)' },
        { cmd: 'apt-get update && apt-get install -y python3 python3-pip python3-dev build-essential', name: 'APT (Ubuntu/Debian)' },
        { cmd: 'apk add --no-cache python3 python3-dev py3-pip gcc musl-dev', name: 'APK (Alpine)' }
    ];

    for (const manager of managers) {
        console.log(`🔧 Trying ${manager.name}...`);
        if (runCommand(manager.cmd, `Installing system dependencies with ${manager.name}`, 120000)) {
            return true;
        }
    }

    console.log('⚠️  System dependency installation failed with all package managers');
    return false;
}

function installPythonPackages() {
    const pythonCmd = checkPython();
    if (!pythonCmd) {
        console.log('❌ Python not available, skipping package installation');
        return false;
    }

    const pip = pythonCmd === 'python' ? 'python -m pip' : 'python3 -m pip';
    
    // Essential packages only
    const packages = [
        'pip --upgrade',
        'numpy==1.26.4',  // Compatible with Prophet
        'pandas==2.0.3', 
        'pystan==3.7.0',
        'prophet==1.1.5'  // Latest version with NumPy 2.0 support
    ];

    console.log(`🐍 Installing Python packages using: ${pip}`);

    for (const pkg of packages) {
        const installCmd = `${pip} install --no-cache-dir ${pkg}`;
        if (!runCommand(installCmd, `Installing ${pkg}`, 300000)) {
            // Try without version constraint
            const pkgName = pkg.split('==')[0];
            if (pkgName !== 'pip --upgrade') {
                console.log(`🔄 Retrying ${pkgName} without version constraint...`);
                const retryCmd = `${pip} install --no-cache-dir ${pkgName}`;
                runCommand(retryCmd, `Installing ${pkgName} (latest)`, 300000);
            }
        }
    }

    return true;
}

function verifyInstallation() {
    const pythonCmd = checkPython();
    if (!pythonCmd) return false;

    const python = pythonCmd === 'python' ? 'python' : 'python3';
    
    try {
        console.log('🔍 Verifying Python packages...');
        const result = execSync(`${python} -c "
import sys
print('Python:', sys.version)
try:
    import pandas as pd
    print('✅ Pandas:', pd.__version__)
except ImportError as e:
    print('❌ Pandas not found:', e)

try:
    import numpy as np
    print('✅ Numpy:', np.__version__)
except ImportError as e:
    print('❌ Numpy not found:', e)

try:
    import prophet
    print('✅ Prophet:', prophet.__version__)
except ImportError as e:
    print('❌ Prophet not found:', e)
"`, { encoding: 'utf8', timeout: 15000 });
        
        console.log(result);
        return result.includes('✅ Pandas') && result.includes('✅ Numpy');
    } catch (error) {
        console.log('❌ Package verification failed:', error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('🚀 Starting Python dependency installation...');
        
        // Step 1: Check current state
        const currentlyWorking = verifyInstallation();
        if (currentlyWorking) {
            console.log('🎉 Python packages already installed and working!');
            console.log('✅ Post-install script completed successfully');
            return;
        }

        // Step 2: Install system dependencies if needed
        if (isBuildEnvironment) {
            console.log('🔧 Installing system dependencies...');
            installSystemDependencies();
        }

        // Step 3: Install Python packages
        console.log('📦 Installing Python packages...');
        installPythonPackages();

        // Step 4: Verify installation
        console.log('🔍 Verifying installation...');
        const success = verifyInstallation();
        
        if (success) {
            console.log('🎉 Python dependencies installed successfully!');
            console.log('✅ Prophet AI will be available when the server starts');
        } else {
            console.log('⚠️  Python packages may not be fully installed');
            console.log('📊 Server will use mathematical fallback predictions');
        }

        console.log('✅ Post-install script completed');

    } catch (error) {
        console.error('💥 Post-install script error:', error.message);
        console.log('⚠️  Continuing anyway - server will use fallback predictions');
        process.exit(0); // Don't fail the npm install
    }
}

// Only run if this is the main module
if (require.main === module) {
    main();
}

module.exports = { main, verifyInstallation, checkPython };
