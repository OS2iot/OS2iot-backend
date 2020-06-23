# Os2iot-backend

## Development mode (without docker)

Before starting, create a file called `.env`, this can be copied from `.env.example`.

### Install dependencies
Global dependencies:
```
npm install -g nodemon eslint ts-node
```
Projekct dependencies:
```
npm install
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

