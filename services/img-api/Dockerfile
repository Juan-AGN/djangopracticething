FROM node:20-bookworm

WORKDIR /app

COPY ./services/img-api/package*.json ./

COPY packages ./packages

RUN npm install

COPY ./services/img-api/. .

RUN npm run build

EXPOSE 9998

CMD ["node", "dist/index.js"]