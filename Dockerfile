FROM node:15.2.1-alpine3.10

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
EXPOSE [4000/tcp, 3000/tcp]

