FROM node:14.17

WORKDIR /app/back

COPY yarn.lock ./
COPY tsconfig.json ./

RUN yarn

COPY . .