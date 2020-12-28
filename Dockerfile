FROM node:15.2.1-alpine3.10

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY packages/client ./packages/client
COPY packages/server ./packages/server

RUN yarn install --pure-lockfile --non-interactive

COPY . .

RUN yarn generate

EXPOSE 3000
EXPOSE 4000

CMD ["yarn", "start"]
