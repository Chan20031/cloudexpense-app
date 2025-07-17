# Use Node.js 18 with Python support
FROM node:18-bullseye-slim

# Install Python and Prophet dependencies properly
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libssl-dev \
    libffi-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic links
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN ln -s /usr/bin/pip3 /usr/bin/pip

# Set Python environment variables
ENV PYTHONPATH=/usr/local/lib/python3.9/site-packages:/usr/lib/python3/dist-packages
ENV PATH="/usr/local/bin:${PATH}"

# Install Python packages properly with explicit paths
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel
RUN pip3 install --no-cache-dir --target=/usr/local/lib/python3.9/site-packages \
    pandas==2.1.4 \
    numpy==1.24.3 \
    prophet==1.1.4 \
    pystan==3.3.0

# Verify installation
RUN python3 -c "import pandas; import numpy; import prophet; print('✅ All Python packages installed')"

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 5000
CMD ["npm", "start"]
