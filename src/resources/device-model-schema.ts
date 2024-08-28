// From: https://github.com/smart-data-models/dataModel.Device/blob/master/DeviceModel/schema.json
export const deviceModelSchema = {
  $schema: "http://json-schema.org/schema#",
  $schemaVersion: "0.0",
  $id: "https://smart-data-models.github.io/dataModel.Device/DeviceModel/schema.json",
  title: " - Device Model schema",
  description: "This entity captures the static properties of a Device. ",
  type: "object",
  allOf: [
    {
      $ref: "https://smart-data-models.github.io/data-models/common-schema.json#/definitions/GSMA-Commons",
    },
    {
      $ref: "https://smart-data-models.github.io/data-models/common-schema.json#/definitions/PhysicalObject-Commons",
    },
    {
      $ref: "https://smart-data-models.github.io/dataModel.Device/device-schema.json",
    },
    {
      properties: {
        type: {
          type: "string",
          enum: ["DeviceModel"],
          description: "Property. NGSI Entity type. it has to be DeviceModel",
        },
        deviceClass: {
          type: "string",
          enum: ["C0", "C1", "C2"],
          description:
            "Property. Model:'https://schema.org/Text'. Class of constrained device as specified by RFC 7228. If the device is not a constrained device this property shall not be present. Normative References: [RFC7228](https://tools.ietf.org/html/rfc7228#section-3). Enum:'C0, C1, C2'",
        },
        controlledProperty: {
          type: "array",
          description:
            "Property. Model:'https://schema.org/DateTime'. Enum:'temperature, humidity, light, motion, fillingLevel,occupancy, power, pressure, smoke, energy, airPollution, noiseLevel, weatherConditions, precipitation, windSpeed, windDirection, atmosphericPressure, solarRadiation, depth, pH,conductivity, conductance, tss, tds, turbidity, salinity,orp, cdom, waterPollution, location, speed, heading,weight, waterConsumption, gasComsumption, electricityConsumption, soilMoisture, trafficFlow,eatingActivity, milking, movementActivity'.",
          items: {
            type: "string",
            enum: [
              "temperature",
              "humidity",
              "light",
              "motion",
              "fillingLevel",
              "occupancy",
              "power",
              "pressure",
              "smoke",
              "energy",
              "airPollution",
              "noiseLevel",
              "weatherConditions",
              "precipitation",
              "windSpeed",
              "windDirection",
              "atmosphericPressure",
              "solarRadiation",
              "depth",
              "pH",
              "conductivity",
              "conductance",
              "tss",
              "tds",
              "turbidity",
              "salinity",
              "orp",
              "cdom",
              "waterPollution",
              "location",
              "speed",
              "heading",
              "weight",
              "waterConsumption",
              "gasComsumption",
              "electricityConsumption",
              "soilMoisture",
              "trafficFlow",
              "eatingActivity",
              "milking",
              "movementActivity",
            ],
          },
        },
        function: {
          type: "array",
          description:
            "Property. Model:'https://schema.org/Text'. The functionality necessary to accomplish the task for which a Device is designed. A device can be designed to perform more than one function. Defined by [SAREF](https://w3id.org/saref#Function). Enum:'levelControl, sensing, onOff, openClose, metering, eventNotification",
          items: {
            type: "string",
            enum: ["levelControl", "sensing", "onOff", "openClose", "metering", "eventNotification"],
          },
        },
        supportedUnits: {
          type: "array",
          description:
            "Property. Model:'https://schema.org/Text'. Units of measurement supported by the device. The unit code (text) of measurement given using the [UN/CEFACT Common Code](http://wiki.goodrelations-vocabulary.org/Documentation/UN/CEFACT_Common_Codes) (max. 3 characters).",
          items: {
            type: "string",
          },
        },
        energyLimitationClass: {
          type: "string",
          description:
            "Property. Model:'https://schema.org/Text'. Device's class of energy limitation as per RFC 7228. Normative References: [RFC7228](https://tools.ietf.org/html/rfc7228#page-11). Enum:'E0, E1, E2, E9'",
          enum: ["E0", "E1", "E2", "E9"],
        },
        documentation: {
          type: "string",
          format: "uri",
          description: "Property. Model:'https://schema.org/URL'. A link to device's documentation.",
        },
        brandName: {
          type: "string",
          description: "Property. Model:'https://schema.org/Text'. Device's brand name.",
        },
        modelName: {
          type: "string",
          description: "Property. Model:'https://schema.org/Text. Device's model name.",
        },
        manufacturerName: {
          type: "string",
          description: "Property. Model:'https://schema.org/Text'. Device's manufacturer name.",
        },
        name: {
          type: "string",
          description: "Property. Model:'https://schema.org/Text'. Device's model name in Portal",
        },
      },
    },
  ],
  required: ["id", "type", "category", "controlledProperty", "manufacturerName", "brandName", "modelName", "name"],
};
