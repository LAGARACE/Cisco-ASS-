FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=development
ENV API_PORT=4100

EXPOSE 4100

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
