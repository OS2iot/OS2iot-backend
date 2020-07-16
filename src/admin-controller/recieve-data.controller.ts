import {
    Controller,
    Post,
    Header,
    Body,
} from "@nestjs/common";
import * as http from 'http';
import * as querystring from 'querystring';
import {
    ApiProduces,
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
} from "@nestjs/swagger";
import { RecieveDataService } from "@services/recieve-data.service";
import { RecieveData } from "@entities/recieve-data.entity";
import { CreateRecieveDataDto } from "@dto/create/create-recieve-data.dto";
import { response } from "express";


@ApiTags("RecieveData")
@Controller("recieveData")
export class RecieveDataController {
    constructor(private recieveDataService: RecieveDataService) {}
 
    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new RecieveData" })
    @ApiBadRequestResponse()
    async create(@Body() createRecieveDataDto: CreateRecieveDataDto): Promise<Object> {
        //const recieveData = this.recieveDataService.create( createRecieveDataDto );
        if (createRecieveDataDto.apiKey === null) { 
            return;
        }

        const postData = querystring.stringify({
            'data': createRecieveDataDto.data
          });
          
        const options = {
              //TODO fix address to take argument / get data from DB assosiated with application data  target
            hostname: 'www.google.com',
            port: 80,
          //  path: '/upload',
            method: 'POST',
            timeout: 3000, // Set timeout based on dataTarget
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
          };
          
          const req = http.request(options, (res) => {
            console.log("ApiKey " + createRecieveDataDto.apiKey);
            console.log("Data " + createRecieveDataDto.data);
              console.log(`STATUS: ${res.statusCode}`);
              console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
          });
          
          req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
          });
          
          // Write data to request body
          req.write(postData);
        req.end();
        

        return postData;

    }
    
}
