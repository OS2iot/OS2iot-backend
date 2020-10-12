// Byte 0: 00 0 0 0 0 0 0
let b0 = 0x0;

// Byte 1: 00 01 1110
let b1 = 0x1e;

// Byte 2: 00 01 1001
let b2 = 0x19;

// Byte 3: 0000 0010
let b3 = 0x02;

// Byte 4: 0 0000010
let b4 = 0x80 | 0x0f;

// Byte 5
let b5 = 0x10;

// Byte 6
let b6 = 0x10 | 0x02;

let b7 = 0x70 | 0x2;

let res = [b0, b1, b2, b3, b4, b5, b6, b7];

console.log(res.map(x => x.toString(16).padStart(2, "0")).join(""));
