# restapi
git clone https://github.com/OS2iot/restapi
cd restapi
docker build -t restapi .
docker run -p 49160:8080 restapi


## test

$ curl -i localhost:49160
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    11  100    11    0     0   1100      0 --:--:-- --:--:-- --:--:--  1222HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 11
ETag: W/"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"
Date: Wed, 10 Jun 2020 08:31:12 GMT
Connection: keep-alive

Hello World
