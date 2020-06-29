# from: https://github.com/Saluki/nestjs-template
FROM node:12-alpine as builder

ENV NODE_ENV build

USER node

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /home/node

COPY --chown=node:node package*.json ./

RUN npm install -g eslint

RUN npm ci

COPY --chown=node:node . .

RUN npm run build


# ---

FROM node:12-alpine

ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --from=builder /home/node/package*.json /home/node/
COPY --from=builder /home/node/dist/ /home/node/dist/

RUN npm ci

CMD ["npm", "run", "start:prod"]
