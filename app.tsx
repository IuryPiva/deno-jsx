/** @jsx h */
/// <reference lib="dom" />

import { render, Component, Fragment, h } from "https://deno.land/x/nano_jsx@v0.0.26/mod.ts";

export class App extends Component {
  value = 0

  changeValue(newValue: number) {
    this.value += newValue
    this.update()
  }

  render() {
    return (
      <Fragment>
        <div>Counter: {this.value}</div>
        <button onClick={() => this.changeValue(1)}>Increment</button>
        <button onClick={() => this.changeValue(-1)}>Decrement</button>
      </Fragment>
    )
  }
}

render(<App />, document.body)
