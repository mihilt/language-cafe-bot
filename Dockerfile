FROM node:16.20.0

EXPOSE 4000

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD npm run start