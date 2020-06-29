# OS2IoT-backend

## Development mode (without docker)

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
Use `nodemon` to start the code and automatically reload on changes. `nodemon` is configured by `nodemon.json`.
```
nodemon
```

## Docker

### Build image
```bash
git clone https://github.com/OS2iot/OS2IoT-backend
cd OS2IoT-backend
docker build -t OS2IoT-backend .
```
### Start container
```bash
docker run --name os2iot-api -d -p 49160:8080 OS2IoT-backend
```

```bash
docker-compose build rest-service
docker-compose up --remove-orphans

docker-compose up --build --remove-orphans
```

