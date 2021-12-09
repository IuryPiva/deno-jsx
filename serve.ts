import { serve } from "https://deno.land/std@0.115.1/http/server.ts";

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  console.log({ pathname });

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deno Nano JSX</title>
    <script type="module">${await Deno.readTextFile("./bundle.js")}</script>
  </head>
  <body>
  </body>
  </html>
  `;

  return new Response(
    html,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

console.log("Listening on http://localhost:8000");
serve(handleRequest);
