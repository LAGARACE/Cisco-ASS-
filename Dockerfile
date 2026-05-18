FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV API_PORT=4100

EXPOSE 4100

CMD ["npx", "tsx", "server/index.ts"]
