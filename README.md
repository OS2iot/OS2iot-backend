# restapi
git clone https://github.com/OS2iot/restapi
cd restapi
docker build -t restapi .
docker run --name os2iot-api -d -p 49160:8080 restapi


## test

curl -X GET http://localhost:49160

Hello World

curl -X POST http://localhost:49160

POST request to the homepage
