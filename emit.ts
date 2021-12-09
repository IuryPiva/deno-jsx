const { files } = await Deno.emit(`./app.tsx`, {
  bundle: "module",
  compilerOptions: {
    sourceMap: false
  },
  check: false,
});

for (const [filename, file] of Object.entries(files)) {
  const path = "." + new URL(filename).pathname;

  console.log({path})
  await Deno.writeTextFile(path, file)

  // const p = Deno.run({
  //   cmd: ["deno", "fmt", path],
  // });

  // await p.status();
  // p.close();
}
