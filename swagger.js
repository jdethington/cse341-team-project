import { writeFileSync } from "node:fs";
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kizuna Rail API",
      version: "1.0.0",
      description: "API for the Kizuna Rail application",
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // path to files with @openapi comments
};

const swaggerSpec = swaggerJSDoc(options);

writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("Swagger documentation generated successfully!");
