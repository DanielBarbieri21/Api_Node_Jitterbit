const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Pedidos",
      version: "1.0.0",
      description: "API para gerenciamento de pedidos com itens",
    },
    servers: [{ url: "http://localhost:3000", description: "Desenvolvimento" }],
    paths: {
      "/order": {
        get: {
          summary: "Lista pedidos (primeira página)",
          tags: ["Pedidos"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "Lista paginada de pedidos" } },
        },
        post: {
          summary: "Cria um novo pedido",
          tags: ["Pedidos"],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["numeroPedido", "valorTotal", "dataCriacao", "items"],
                  properties: {
                    numeroPedido: { type: "string" },
                    valorTotal: { type: "number" },
                    dataCriacao: { type: "string", format: "date-time" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          idItem: { type: "integer" },
                          quantidadeItem: { type: "integer" },
                          valorItem: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Pedido criado" } },
        },
      },
      "/order/list": {
        get: {
          summary: "Lista pedidos com paginação e filtros",
          tags: ["Pedidos"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "minValue", in: "query", schema: { type: "number" } },
            { name: "maxValue", in: "query", schema: { type: "number" } },
            { name: "startDate", in: "query", schema: { type: "string" } },
            { name: "endDate", in: "query", schema: { type: "string" } },
            { name: "productId", in: "query", schema: { type: "integer" } },
            { name: "sortBy", in: "query", schema: { type: "string", enum: ["orderId", "value", "creationDate"] } },
            { name: "sortDir", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: { 200: { description: "Lista paginada" } },
        },
      },
      "/order/{id}": {
        get: {
          summary: "Busca pedido por ID",
          tags: ["Pedidos"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Pedido encontrado" }, 404: { description: "Não encontrado" } },
        },
        put: {
          summary: "Atualiza valor do pedido",
          tags: ["Pedidos"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["value"],
                  properties: { value: { type: "number" } },
                },
              },
            },
          },
          responses: { 200: { description: "Pedido atualizado" } },
        },
        delete: {
          summary: "Remove pedido",
          tags: ["Pedidos"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Pedido removido" } },
        },
      },
      "/health": {
        get: {
          summary: "Saúde da API",
          tags: ["Sistema"],
          responses: { 200: { description: "OK" } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
