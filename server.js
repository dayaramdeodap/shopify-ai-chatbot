import { createRequestHandler } from "@react-router/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS middleware — must be first so OPTIONS preflight is handled before React Router
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, X-Shopify-Shop-Id, X-CSRF-Token, X-Requested-With, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Serve static assets from build
app.use(
  "/assets",
  express.static(path.join(__dirname, "build/client/assets"), {
    immutable: true,
    maxAge: "1y",
  })
);
app.use(
  express.static(path.join(__dirname, "build/client"), { maxAge: "1h" })
);

// React Router request handler
app.all(
  "*",
  createRequestHandler({
    build: () => import("./build/server/index.js"),
  })
);

const port = parseInt(process.env.PORT || "3000");
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
