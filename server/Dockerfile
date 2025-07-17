# Use Node.js 18 with Python support
FROM node:18-bullseye-slim

# Install Python and Prophet dependencies
RUN apt-get update && apt-get install -y python3 python3-pip build-essential && \
    pip3 install pandas numpy prophet && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 5000
CMD ["npm", "start"]
