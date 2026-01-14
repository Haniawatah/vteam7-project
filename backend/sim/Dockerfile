FROM node:20-alpine

WORKDIR /app

# deps (simulatorn använder bara built-in fetch, men installera ändå om du har shared utils)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# copy only simulator code (minimalt)
COPY sim ./sim

ENV NODE_ENV=production
CMD ["node", "./sim/simulator.mjs"]
