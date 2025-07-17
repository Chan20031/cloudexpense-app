# Use Node.js 18 LTS with Python support
FROM node:18-bullseye-slim

# Install Python and required system dependencies for Prophet
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libssl-dev \
    libffi-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for python command
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN ln -s /usr/bin/pip3 /usr/bin/pip

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Pre-install Python dependencies for better App Runner compatibility
RUN pip install --no-cache-dir \
    pandas==2.1.4 \
    numpy==1.24.3 \
    prophet==1.1.4 \
    pystan==3.3.0 \
    cmdstanpy==1.2.0 \
    holidays==0.34 \
    convertdate==2.4.0 \
    python-dateutil==2.8.2

# Create app directory and user for security
RUN groupadd -g 1001 nodejs
RUN useradd -u 1001 -g nodejs nodeuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Python requirements and installation scripts
COPY requirements.txt ./
COPY install-python-dependencies.js ./
COPY install-python-runtime.js ./

# Install Node.js dependencies (this will trigger postinstall script)
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R nodeuser:nodejs uploads

# Set environment variables
ENV NODE_ENV=production
ENV TZ=Asia/Kuala_Lumpur
ENV PORT=5000

# Change to non-root user
USER nodeuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
