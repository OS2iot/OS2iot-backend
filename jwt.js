var uuid = require("uuid");
var nJwt = require("njwt");

var claims = {
    iss: "chirpstack-application-server", // issuer of the claim
    aud: "chirpstack-application-server", // audience for which the claim is intended
    nbf: Math.floor(new Date() / 1000), // unix time from which the token is valid
    exp: Math.floor(new Date() / 1000) + 60 * 60 * 24 * 14, // unix time when the token expires
    sub: "user", // subject of the claim (an user)
    username: "admin", // username the client claims to be
};

var jwt = nJwt.create(claims, "verysecret", "HS256");
var token = jwt.compact();
console.log(token)