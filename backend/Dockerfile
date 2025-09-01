FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY src ./src

EXPOSE 6000

CMD ["node", "server.js"]
