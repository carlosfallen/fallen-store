FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN mkdir -p /app/public/apks
RUN chmod 755 /app/public/apks

EXPOSE 5176

CMD ["npm", "start"]