FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app /app
RUN npm install pm2 -g
EXPOSE 7575
CMD ["sh", "runner.sh"]
