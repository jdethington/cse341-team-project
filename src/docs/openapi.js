//src/docs/openapi.js — OpenAPI 3 spec

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Kizuna Rail API",
    description:
      "Web services for the Kizuna Rail scenic railway booking site. Ticket classes endpoints (Feature Set 4).",
    version: "1.0.0",
  },
  paths: {
    "/api/ticket-classes": {
      get: {
        summary: "List ticket classes",
        description:
          "Returns every ticket class. Optionally filter to the classes available on a specific day with the `day` query parameter.",
        parameters: [
          {
            name: "day",
            in: "query",
            required: false,
            description: "Day of week to filter by (e.g. monday). Invalid values return 400.",
            schema: {
              type: "string",
              enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            },
          },
        ],
        responses: {
          200: {
            description: "Ticket classes (all, or filtered by day).",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ticketClasses: {
                      type: "array",
                      items: { $ref: "#/components/schemas/TicketClass" },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "The `day` query parameter was missing or invalid.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Something went wrong on the server.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TicketClass: {
        type: "object",
        properties: {
          class: { type: "string", example: "premium" },
          name: { type: "string", example: "Premium Class" },
          pricePerKm: { type: "number", example: 150 },
          amenities: {
            type: "array",
            items: { type: "string" },
            example: ["Panoramic windows", "Meal service"],
          },
          description: { type: "string" },
          availableDays: {
            type: "array",
            items: { type: "string" },
            example: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          },
        },
      },
    },
  },
};

export default openapi;
