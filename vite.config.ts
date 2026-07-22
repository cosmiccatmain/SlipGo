import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// In `vite dev` there is no serverless runtime, so any request to /api/* would
// otherwise be resolved to the raw function source in /api and fail to transform.
// Short-circuit it to a 404 so the client's enrichment fetch degrades gracefully.
// On Vercel, /api/* is handled by real Serverless Functions and never reaches Vite.
function ignoreApiInDev(): Plugin {
  return {
    name: "ignore-api-in-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/api/")) {
          res.statusCode = 404;
          res.end("Not found — /api runs as a Vercel function in production.");
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ignoreApiInDev()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
