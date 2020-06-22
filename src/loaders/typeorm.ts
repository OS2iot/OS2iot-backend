import "reflect-metadata";
import { createConnection } from "typeorm";

export default () => {
    // loaded from ormconfig.json
    createConnection().then(connection => {
        // here you can start to work with your entities
    }).catch(error => console.log(error));

}
