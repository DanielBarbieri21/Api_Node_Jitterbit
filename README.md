## API de Pedidos (Node.js + PostgreSQL)

API para gerenciamento de pedidos com itens, criada em Node.js, Express e PostgreSQL.

### Requisitos

- Node.js 18+
- PostgreSQL (banco `orders`)

### Configuração

1. Copie o arquivo `.env.example` para `.env` e ajuste as variáveis se necessário.
2. Crie o banco `orders` no PostgreSQL.
3. Execute o script SQL:

```sql
\i schema.sql
```

### Instalação

```bash
npm install
```

### Execução

- Ambiente de desenvolvimento (com `nodemon`):

```bash
npm run dev
```

- Ambiente de produção:

```bash
npm start
```

A API ficará disponível em `http://localhost:3000` (ou na porta definida em `PORT`).

### Endpoints

- **Criar pedido**
  - **POST** `/order`
  - Corpo esperado:

```json
{
  "numeroPedido": "V10089016vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.529960+00:00",
  "items": [
    {
      "idItem": 2434,
      "quantidadeItem": 1,
      "valorItem": 10000
    }
  ]
}
```

- **Buscar pedido por ID**
  - **GET** `/order/:id`

- **Listar todos os pedidos (com paginação e filtros)**
  - **GET** `/order/list`
  - Query params opcionais:
    - `page` (padrão: 1)
    - `limit` (padrão: 10, máximo: 100)
    - `minValue` (filtra pedidos com `value >= minValue`)
    - `maxValue` (filtra pedidos com `value <= maxValue`)
    - `startDate` (filtra `creationDate >= startDate`)
    - `endDate` (filtra `creationDate <= endDate`)
    - `productId` (retorna apenas pedidos que contenham um item com esse `productId`)
    - `sortBy` (campo de ordenação: `creationDate` (default), `value`, `orderId`)
    - `sortDir` (direção: `asc` ou `desc`, padrão `desc`)
  - Exemplo:

```http
GET /order/list?page=1&limit=5&minValue=1000&startDate=2023-01-01
```

  - Resposta:

```json
{
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 12,
    "totalPages": 3
  },
  "data": [
    {
      "orderid": "V10089016vdb-01",
      "value": 10000,
      "creationdate": "2023-07-19T12:24:11.529Z"
    }
  ]
}
```

- **Atualizar valor do pedido**
  - **PUT** `/order/:id`
  - Corpo:

```json
{ "value": 15000 }
```

- **Deletar pedido**
  - **DELETE** `/order/:id`

### Saúde da API

- **GET** `/health` – retorna `{ "status": "ok" }`.

