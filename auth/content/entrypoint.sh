#!/bin/sh

set -e

npx prisma generate --schema=./prisma/schema.prisma

npx prisma db push --schema=./prisma/schema.prisma

npm run start