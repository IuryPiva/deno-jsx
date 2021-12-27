/** @jsx h */
import { h } from "https://deno.land/x/nano_jsx@v0.0.27/mod.ts";

export const Todos = () => (
  <div x-data="{ message: '' }">
    <input type="text" x-model="message" />

    Message: <span x-text="message"></span>
  </div>
);
