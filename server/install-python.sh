#!/bin/bash
# App Runner Python Dependencies Installation Script

echo "🐍 Installing Python dependencies for CloudExpense AI..."

# Update package manager
apt-get update

# Install Python and build dependencies
apt-get install -y python3 python3-pip python3-dev build-essential libssl-dev libffi-dev pkg-config

# Create symbolic links
ln -sf /usr/bin/python3 /usr/bin/python
ln -sf /usr/bin/pip3 /usr/bin/pip

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install Prophet and dependencies with specific versions for stability
pip install --no-cache-dir \
    pandas==2.1.4 \
    numpy==1.24.3 \
    prophet==1.1.4 \
    pystan==3.3.0 \
    cmdstanpy==1.2.0 \
    holidays==0.34 \
    convertdate==2.4.0 \
    python-dateutil==2.8.2 \
    setuptools-git==1.2

echo "✅ Python dependencies installation completed!"
