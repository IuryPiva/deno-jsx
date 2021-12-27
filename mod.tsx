import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
import { html } from "./ssr.tsx";

function handler(_req: Request): Response {
  // const { pathname, searchParams } = new URL(req.url);

  return new Response(html, {
    headers: {
      "content-type": "text/html",
    },
  });
}

console.log("Listening on http://localhost:8000");
serve(handler);
