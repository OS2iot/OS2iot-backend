# from: https://github.com/Saluki/nestjs-template
FROM node:12 as builder

ENV NODE_ENV build

RUN npm install -g nest eslint jest

USER node

# ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
# ENV PATH=$PATH:/home/node/.npm-global/bin

RUN mkdir -p /tmp/os2iot/backend
WORKDIR /tmp/os2iot/backend

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

CMD ["npm", "run", "start:dev"]
