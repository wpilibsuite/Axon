FROM python:3.9

# Python dependencies for Open Images
RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y curl python3-opencv && \
    pip3 install numpy pandas opencv-python openimages

# Node
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn

### Axon
WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY packages/client ./packages/client
COPY packages/server ./packages/server

RUN yarn install --pure-lockfile --non-interactive && \
    yarn build

COPY . .

ARG AXON_VERSION=edge
ENV AXON_VERSION=$AXON_VERSION

RUN yarn generate

EXPOSE 3000
EXPOSE 4000

CMD ["yarn", "serve"]
