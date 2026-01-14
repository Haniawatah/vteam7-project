FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy the backend source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Keep it explicit (avoids relying on scripts that might differ)
CMD ["node", "index.js"]
