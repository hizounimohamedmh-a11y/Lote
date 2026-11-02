FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
ENV NODE_ENV=production PORT=3002 DATABASE_PATH=/data/greenlight.db
VOLUME /data
EXPOSE 3002
CMD ["node", "server/index.js"]
