FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
ENV NODE_ENV=production PORT=3001 DATABASE_PATH=/data/lote.db
VOLUME /data
EXPOSE 3001
CMD ["node", "server/index.js"]
