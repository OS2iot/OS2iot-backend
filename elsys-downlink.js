// raw: 3E0A14000000461700000002 from https://www.elsys.se/en/downlink-generator/

let raw = "3E0A14000000461700000002";
let asd = "3E051400000045";

// Convert hex to base64 bytes
var base64String = Buffer.from(raw, "hex").toString("base64");
console.log(base64String); // PgoUAAAAQRcAAAAD


/* 
Procedure:
1. Scan Elsys med app for at få info
2. Lav ønsket payload
3. Insæt: confirmed, port 6 (eller andet hvis konfigureret til det i elsys app)
4. enqueue downlink
5. vent på at den modtager downlink og confirmer (den vil joine igen)
*/