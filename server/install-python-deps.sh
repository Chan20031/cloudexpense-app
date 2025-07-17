#!/bin/bash

# Python dependency installer for App Runner
echo "=== CloudExpense Python Dependency Setup ==="

# Check if packages are already installed
if python3 -c "import pandas, prophet" 2>/dev/null; then
    echo "✅ Python dependencies already installed"
    exit 0
fi

echo "📦 Installing Python dependencies..."

# Install system packages
yum update -y > /dev/null 2>&1
yum install -y python3-pip python3-devel gcc gcc-c++ make > /dev/null 2>&1

# Install Python packages
pip3 install --user --no-cache-dir numpy==1.24.3 > /dev/null 2>&1
pip3 install --user --no-cache-dir pandas==2.0.3 > /dev/null 2>&1
pip3 install --user --no-cache-dir pystan==2.19.1.1 > /dev/null 2>&1
pip3 install --user --no-cache-dir prophet==1.1.4 > /dev/null 2>&1

# Verify installation
if python3 -c "import pandas, prophet" 2>/dev/null; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi
