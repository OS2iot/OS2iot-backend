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
## Docker

Use docker-compose, see: https://github.com/OS2iot/OS2IoT-docker

### Build image
```bash
git clone https://github.com/OS2iot/OS2IoT-backend
cd OS2IoT-backend
docker build -t os2iot-backend .
```
### Start container
Start container:
```bash
docker run --name os2iot-backend -d -p 3000:3000 OS2IoT-backend
```
