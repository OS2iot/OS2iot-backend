# Os2iot-backend

### Build image
```bash
git clone https://github.com/OS2iot/Os2iot-backend
cd Os2iot-backend
docker build -t Os2iot-backend .
```
### Start container
```bash
docker run --name os2iot-api -d -p 49160:8080 Os2iot-backend
```

```bash
docker-compose build rest-service
docker-compose up --remove-orphans

docker-compose up --build --remove-orphans
```

### Test
#### Get
```bash
curl -X GET http://localhost:49160
```
#### Post
```bash
curl -X POST http://localhost:49160
```
#### Put
```bash
curl -X PUT http://localhost:49160
```
#### Delete
```bash
curl -X PUT http://localhost:49160
```
