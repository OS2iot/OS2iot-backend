# Example: OS2IoT to Thingsboard.

## Step one: Create `data converter` in Thingsboard

OS2IoT will send:

```json
{
    "relative_humidity_percent": 0.55,
    "temperature_celcius": 23
}
```

Data converter:

```javascript
var payloadJson = decodeToJson(payload);

var deviceName = "os2iot-test-device";
var deviceType = "os2iot-test-device-type";
var customerName = "customer";
var groupName = "thermostat devices";

var result = {
    deviceName: deviceName,
    deviceType: deviceType,
    customerName: customerName,
    groupName: groupName,
    attributes: {
        model: "Model A",
        serialNumber: "SN111",
        integrationName: metadata["integrationName"],
    },
    telemetry: {
        // Decode the data from the payload
        temperature: payloadJson["temperature_celcius"],
        humidity: payloadJson["relative_humidity_percent"] * 100.0,
        rawData: payloadJson,
    },
};

function decodeToString(payload) {
    return String.fromCharCode.apply(String, payload);
}

function decodeToJson(payload) {
    var str = decodeToString(payload);
    var data = JSON.parse(str);
    return data;
}

return result;
```

Should give result:

```json
{
    "deviceName": "Device A",
    "deviceType": "thermostat",
    "customerName": "customer",
    "groupName": "thermostat devices",
    "attributes": {
        "model": "Model A",
        "serialNumber": "SN111",
        "integrationName": "Test integration"
    },
    "telemetry": {
        "temperature": 23,
        "humidity": 55.00000000000001,
        "rawData": {
            "relative_humidity_percent": 0.55,
            "temperature_celcius": 23
        }
    }
}
```

Note: humidity has a funny rounding because this is javascript!

## Step two: Create an integration in Thingsboard

-   Type: "HTTP"'
-   Enable debug mode for now
-   Uplink data converter: Select the one made above.
-   Copy "Http endpoint URL" (e.g. https://IoT-dataplatform.aarhuskommune.dk/api/v1/integrations/http/e1a7a88c42fa43dfe6204a9443a7554f)

## Step three: Test if the integration is setup correctly

-   Make a post request using the JSON body above to the "Http endpoint URL" you noted in step two.

-   Example using CURL in bash:

    ```sh
    curl -v -d '{ "relative_humidity_percent": 0.55, "temperature_celcius": 23 }' -H 'Content-Type:application/json' "https://IoT-dataplatform.aarhuskommune.dk/api/v1/integrations/http/e1a7a88c42fa43dfe6204a9443a7554f"
    ```

    -   Should give: `< HTTP/1.1 204` (no content)

-   In Thingsboard under the Integration made in step two, goto "Events" and press refresh.
    -   Check that the status is `OK`

## Step four: Make a device + device group

(reuse the names given in the transformer, i.e.

```javascript
var deviceName = "os2iot-test-device";
var deviceType = "os2iot-test-device-type";
```

)

-   Setup relation from integration to device. Under "Integraion" select your integration, goto "Relations".
-   Add an "Outbound relation":
    -   Type: "Manages"
    -   To entity type: "Device"
    -   To entity name: "your-device-name"

## Step five: Test again

Verify that the telemetry is sent to the device.

Under the device goto "Latest telemetry" and see that the values you post show up.

## Step six: Create HTTP Push data target in OS2IoT

...
