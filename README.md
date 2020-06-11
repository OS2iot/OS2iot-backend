# restapi

### Build image
```bash
git clone https://github.com/OS2iot/restapi
cd os2iot-api
docker build -t os2iot-api .
```
### Start container
```bash
docker run --name os2iot-api -d -p 49160:8080 os2iot-api
```

```bash
docker-compose build os2iot-api
docker-compose up --remove-orphans
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
