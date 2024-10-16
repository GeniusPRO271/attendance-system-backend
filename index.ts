import api from "./api";

Bun.serve({
  port: 3001,
  fetch: api.fetch
})
