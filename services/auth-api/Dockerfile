FROM node:20-bookworm

WORKDIR /app

COPY ./services/auth-api/package*.json ./

COPY packages ./packages

RUN npm install

COPY ./services/auth-api/. .

RUN apt-get update -y && apt-get install -y openssl

RUN npx prisma generate

RUN chmod +x entrypoint.sh

RUN npm run build

EXPOSE 9999

CMD ["bash", "entrypoint.sh"]