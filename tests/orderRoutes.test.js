const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
  connect: jest.fn(() =>
    Promise.resolve({
      query: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    })
  ),
}));

const app = require("../app");
const db = require("../db");

describe("API de Pedidos", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.connect.mockResolvedValue({
      query: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    });
  });

  describe("GET /health", () => {
    it("retorna status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /order", () => {
    it("retorna lista paginada de pedidos", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/order");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meta");
      expect(res.body.meta.page).toBe(1);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /order/list", () => {
    it("retorna lista com meta e data", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            { orderId: "v1", value: 100, creationDate: "2023-01-01" },
            { orderId: "v2", value: 200, creationDate: "2023-01-02" },
          ],
        });

      const res = await request(app).get("/order/list");

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("GET /order/:id", () => {
    it("retorna 404 quando pedido não existe", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get("/order/inexistente");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("não encontrado");
    });

    it("retorna pedido e itens quando existe", async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ orderId: "v1", value: 100, creationDate: "2023-01-01" }],
        })
        .mockResolvedValueOnce({
          rows: [{ productId: 1, quantity: 2, price: 50 }],
        });

      const res = await request(app).get("/order/v1");

      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.orderId).toBe("v1");
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe("POST /order", () => {
    it("retorna 400 quando payload inválido", async () => {
      const res = await request(app)
        .post("/order")
        .send({ numeroPedido: "v1" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("retorna 201 quando pedido criado com sucesso", async () => {
      db.connect.mockResolvedValue({
        query: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      });

      const res = await request(app)
        .post("/order")
        .send({
          numeroPedido: "v10089016vdb",
          valorTotal: 10000,
          dataCriacao: "2023-07-19T12:24:11.529Z",
          items: [
            { idItem: 2434, quantidadeItem: 1, valorItem: 10000 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("sucesso");
    });
  });

  describe("PUT /order/:id", () => {
    it("retorna 400 quando value não é enviado", async () => {
      const res = await request(app).put("/order/v1").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("value");
    });

    it("retorna 404 quando pedido não existe", async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .put("/order/inexistente")
        .send({ value: 15000 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /order/:id", () => {
    it("retorna 404 quando pedido não existe", async () => {
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce({ rows: [], rowCount: 0 })
          .mockResolvedValueOnce(undefined),
        release: jest.fn(),
      };
      db.connect.mockResolvedValue(client);

      const res = await request(app).delete("/order/inexistente");

      expect(res.status).toBe(404);
    });
  });
});
