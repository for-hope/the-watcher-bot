# stage 1 build the bot
FROM node:16.13-alpine
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npm run build
RUN run run deploy
EXPOSE 5000
CMD ["npm", "start"]

