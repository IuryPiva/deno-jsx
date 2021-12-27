/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { h, renderSSR } from "https://deno.land/x/nano_jsx@v0.0.27/mod.ts";

const { files } = await Deno.emit(`./app.tsx`, {
  bundle: "module",
  compilerOptions: {
    sourceMap: false,
  },
  check: false,
});

export const html = renderSSR(() => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Nano JSX SSR</title>
      <meta
        name="description"
        content="Server Side Rendered Nano JSX Application"
      />
      <script src="//unpkg.com/alpinejs" defer></script>
    </head>
    <body>
      <script type="module">{files["deno:///bundle.js"]}</script>
    </body>
  </html>
));

Deno.writeTextFileSync("./index.html", html)