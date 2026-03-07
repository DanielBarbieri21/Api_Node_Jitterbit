const express = require("express");
const router = express.Router();
const db = require("../db");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const buildListQuery = (query) => {
  const {
    page,
    limit,
    minValue,
    maxValue,
    startDate,
    endDate,
    sortBy,
    sortDir,
    productId,
  } = query;

  const conditions = [];
  const values = [];

  if (minValue != null) {
    values.push(Number(minValue));
    conditions.push(`value >= $${values.length}`);
  }

  if (maxValue != null) {
    values.push(Number(maxValue));
    conditions.push(`value <= $${values.length}`);
  }

  if (startDate) {
    values.push(startDate);
    conditions.push(`creationDate >= $${values.length}`);
  }

  if (endDate) {
    values.push(endDate);
    conditions.push(`creationDate <= $${values.length}`);
  }

  if (productId != null) {
    values.push(Number(productId));
    conditions.push(
      `EXISTS (SELECT 1 FROM items i WHERE i.orderId = orders.orderId AND i.productId = $${values.length})`
    );
  }

  const sortableFields = {
    orderId: "orderId",
    value: "value",
    creationDate: "creationDate",
  };

  const sortField = sortableFields[sortBy] || "creationDate";
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const currentLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const offset = (currentPage - 1) * currentLimit;

  const listParams = [...values, currentLimit, offset];
  const countParams = [...values];

  const listSql = `SELECT * FROM orders ${whereClause} ORDER BY ${sortField} ${sortDirection} LIMIT $${
    values.length + 1
  } OFFSET $${values.length + 2}`;
  const countSql = `SELECT COUNT(*) AS total FROM orders ${whereClause}`;

  return {
    listSql,
    listParams,
    countSql,
    countParams,
    page: currentPage,
    limit: currentLimit,
  };
};

const validateOrderPayload = (body) => {
  const { numeroPedido, valorTotal, dataCriacao, items } = body;

  if (!numeroPedido || !valorTotal || !dataCriacao) {
    return "Campos obrigatórios: numeroPedido, valorTotal, dataCriacao.";
  }

  if (!Array.isArray(items) || items.length === 0) {
    return "O pedido deve conter ao menos um item.";
  }

  const invalidItem = items.find(
    (item) =>
      !item.idItem || item.quantidadeItem == null || item.valorItem == null
  );

  if (invalidItem) {
    return "Cada item deve conter idItem, quantidadeItem e valorItem.";
  }

  return null;
};

// Alias para /order/list (primeira página padrão)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    req.query.page = req.query.page || "1";
    req.query.limit = req.query.limit || "10";

    const { listSql, listParams, countSql, countParams, page, limit } =
      buildListQuery(req.query);

    const [countResult, dataResult] = await Promise.all([
      db.query(countSql, countParams),
      db.query(listSql, listParams),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    res.json({
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      data: dataResult.rows,
    });
  })
);

// Lista todos os pedidos com paginação e filtros
router.get(
  "/list",
  asyncHandler(async (req, res) => {
    const { listSql, listParams, countSql, countParams, page, limit } =
      buildListQuery(req.query);

    const [countResult, dataResult] = await Promise.all([
      db.query(countSql, countParams),
      db.query(listSql, listParams),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    res.json({
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      data: dataResult.rows,
    });
  })
);

// Cria um novo pedido
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const validationError = validateOrderPayload(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { numeroPedido, valorTotal, dataCriacao, items } = req.body;

    const orderId = numeroPedido;
    const value = valorTotal;
    const creationDate = dataCriacao;

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "INSERT INTO orders(orderId,value,creationDate) VALUES($1,$2,$3)",
        [orderId, value, creationDate]
      );

      for (const item of items) {
        await client.query(
          "INSERT INTO items(orderId,productId,quantity,price) VALUES($1,$2,$3,$4)",
          [orderId, item.idItem, item.quantidadeItem, item.valorItem]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({ message: "Pedido criado com sucesso" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

// Busca um pedido específico
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await db.query("SELECT * FROM orders WHERE orderId=$1", [id]);

    if (order.rows.length === 0) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const items = await db.query("SELECT * FROM items WHERE orderId=$1", [id]);

    res.json({
      order: order.rows[0],
      items: items.rows,
    });
  })
);

// Atualiza o valor de um pedido
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;

    if (value == null) {
      return res
        .status(400)
        .json({ error: "Campo 'value' é obrigatório para atualização." });
    }

    const result = await db.query(
      "UPDATE orders SET value=$1 WHERE orderId=$2 RETURNING *",
      [value, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    res.json({ message: "Pedido atualizado", order: result.rows[0] });
  })
);

// Remove um pedido
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM items WHERE orderId=$1", [id]);
      const orderResult = await client.query(
        "DELETE FROM orders WHERE orderId=$1 RETURNING *",
        [id]
      );

      await client.query("COMMIT");

      if (orderResult.rowCount === 0) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      res.json({ message: "Pedido deletado" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })
);

module.exports = router;


