#!/usr/bin/env node
/**
 * Runtime Python dependency installer for App Runner
 * Installs Python packages needed for Prophet AI predictions
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CloudExpense Prophet AI Runtime Installer');
console.log('='.repeat(50));

// Check if we're in App Runner or local environment
const isAppRunner = process.env.AWS_REGION && process.env.PORT;
console.log(`Environment: ${isAppRunner ? 'AWS App Runner' : 'Local Development'}`);

async function checkPython() {
    try {
        const version = execSync('python3 --version', { encoding: 'utf8', timeout: 5000 });
        console.log(`✅ Python: ${version.trim()}`);
        return true;
    } catch (error) {
        console.log('❌ Python3 not found');
        return false;
    }
}

async function installSystemPackages() {
    if (!isAppRunner) {
        console.log('⏭️  Skipping system packages (local environment)');
        return true;
    }
    
    try {
        console.log('📦 Installing system packages...');
        execSync('yum update -y && yum install -y python3 python3-pip python3-devel gcc gcc-c++ make', 
                { stdio: 'inherit', timeout: 120000 });
        console.log('✅ System packages installed');
        return true;
    } catch (error) {
        console.log('⚠️  System package installation failed:', error.message);
        return false;
    }
}

async function checkPackage(packageName) {
    try {
        execSync(`python3 -c "import ${packageName}; print('${packageName} OK')"`, 
                { encoding: 'utf8', timeout: 10000 });
        return true;
    } catch (error) {
        return false;
    }
}

async function installPythonPackages() {
    const packages = [
        { name: 'numpy', import: 'numpy', version: '1.24.3' },
        { name: 'pandas', import: 'pandas', version: '2.0.3' },
        { name: 'pystan', import: 'stan', version: '3.7.0' },
        { name: 'prophet', import: 'prophet', version: '1.1.4' }
    ];
    
    console.log('🐍 Checking Python packages...');
    
    // Upgrade pip first
    try {
        execSync('python3 -m pip install --upgrade pip', { stdio: 'inherit', timeout: 30000 });
        console.log('✅ Pip upgraded');
    } catch (error) {
        console.log('⚠️  Pip upgrade failed, continuing...');
    }
    
    for (const pkg of packages) {
        const isInstalled = await checkPackage(pkg.import);
        
        if (isInstalled) {
            console.log(`✅ ${pkg.name} already installed`);
            continue;
        }
        
        console.log(`📥 Installing ${pkg.name}==${pkg.version}...`);
        try {
            execSync(`python3 -m pip install --no-cache-dir ${pkg.name}==${pkg.version}`, 
                    { stdio: 'inherit', timeout: 180000 });
            console.log(`✅ ${pkg.name} installed successfully`);
        } catch (error) {
            console.log(`❌ Failed to install ${pkg.name}:`, error.message);
            
            // Try without version for critical packages
            if (pkg.name === 'pandas' || pkg.name === 'numpy') {
                try {
                    console.log(`🔄 Retrying ${pkg.name} without version...`);
                    execSync(`python3 -m pip install --no-cache-dir ${pkg.name}`, 
                            { stdio: 'inherit', timeout: 180000 });
                    console.log(`✅ ${pkg.name} installed (latest version)`);
                } catch (retryError) {
                    console.log(`❌ ${pkg.name} installation failed completely`);
                    return false;
                }
            }
        }
    }
    
    return true;
}

async function verifyInstallation() {
    console.log('🔍 Verifying installation...');
    
    try {
        const result = execSync(`python3 -c "
import pandas as pd
import numpy as np
import prophet
print('✅ All packages imported successfully')
print(f'Pandas: {pd.__version__}')
print(f'Numpy: {np.__version__}')
print(f'Prophet: {prophet.__version__}')
"`, { encoding: 'utf8', timeout: 15000 });
        
        console.log(result);
        return true;
    } catch (error) {
        console.log('❌ Package verification failed:', error.message);
        return false;
    }
}

async function startMainApplication() {
    console.log('🎯 Starting CloudExpense server...');
    console.log('='.repeat(50));
    
    // Start the main application
    const child = spawn('node', ['index.js'], {
        stdio: 'inherit',
        env: { ...process.env }
    });
    
    child.on('error', (error) => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
    
    child.on('exit', (code) => {
        console.log(`🔄 Server exited with code ${code}`);
        process.exit(code);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('📴 Received SIGTERM, shutting down gracefully...');
        child.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
        console.log('📴 Received SIGINT, shutting down gracefully...');
        child.kill('SIGINT');
    });
}

async function main() {
    try {
        // Step 1: Check Python
        const hasPython = await checkPython();
        if (!hasPython && isAppRunner) {
            await installSystemPackages();
        }
        
        // Step 2: Install Python packages
        const packagesOK = await installPythonPackages();
        if (!packagesOK) {
            console.log('⚠️  Some packages failed to install, but continuing...');
        }
        
        // Step 3: Verify installation
        const verified = await verifyInstallation();
        if (verified) {
            console.log('🎉 Prophet AI dependencies ready!');
        } else {
            console.log('⚠️  Verification failed, but starting server anyway...');
        }
        
        // Step 4: Start main application
        await startMainApplication();
        
    } catch (error) {
        console.error('💥 Runtime installer failed:', error);
        console.log('🔄 Starting server without Prophet AI...');
        await startMainApplication();
    }
}

// Run the installer
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
