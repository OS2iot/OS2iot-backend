import "reflect-metadata";
import { createConnection } from "typeorm";

export default (): void => {
    // loaded from ormconfig.json
    createConnection().then(() => {
        // here you can start to work with your entities
    }).catch(error => console.log(error));

}
