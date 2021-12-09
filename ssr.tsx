/** @jsx h */
import {
  h,
  Helmet,
  renderSSR,
} from "https://deno.land/x/nano_jsx@v0.0.26/mod.ts";
import { App } from "./app.tsx";

const { body, head, footer } = Helmet.SSR(renderSSR(<App />));

const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deno Nano JSX</title>
    ${head.join("\n")}
  </head>
  <body>
      ${body}
      ${footer.join("\n")}
      <script type="module" src="/bundle.js"></script>
  </body>
  </html>
`;

const path = "./index.html";
await Deno.writeTextFile(path, html);
const p = Deno.run({
  cmd: ["deno", "fmt", path],
});
