FROM node:20-bookworm

WORKDIR /app

COPY content/package*.json ./

RUN npm install

COPY content/prisma ./prisma

RUN apt-get update -y && apt-get install -y openssl

COPY content/. ./

RUN npx prisma generate

RUN chmod +x entrypoint.sh

RUN npm run build

EXPOSE 9999

CMD ["bash", "entrypoint.sh"]