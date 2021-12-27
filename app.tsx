/** @jsx h */
import {
  Component,
  Fragment,
  h,
  render,
} from "https://deno.land/x/nano_jsx@v0.0.27/mod.ts";
import { Todos } from "./app/send.tsx";

const DISCONNECTED = "🔴 Disconnected";
const CONNECTING = "🟡 Connecting...";
const CONNECTED = "🟢 Connected";

export class App extends Component {
  messages: string[] = [];
  status = DISCONNECTED;

  setStatus(newStatus: string) {
    this.status = newStatus;
    this.update();
  }

  addMessage(message: string) {
    this.messages.push(message);
    this.update();
  }

  didMount() {
    const events = new EventSource("/api/listen");
    this.setStatus(CONNECTING);

    events.addEventListener("open", () => this.setStatus(CONNECTED));
    events.addEventListener("error", () => {
      switch (events.readyState) {
        case EventSource.OPEN:
          this.setStatus(CONNECTED);
          break;
        case EventSource.CONNECTING:
          this.setStatus(CONNECTING);
          break;
        case EventSource.CLOSED:
          this.setStatus(DISCONNECTED);
          break;
      }
    });
    events.addEventListener("message", (e) => {
      this.addMessage(JSON.parse(e.data));
    });
  }

  setMessage(message: string) {
    this.message = "";
    this.update();
  }

  message = "";

  onSubmit(e: Event) {
    e.preventDefault();
    e.stopImmediatePropagation();

    fetch("/api/send", {
      method: "POST",
      body: JSON.stringify({ body: this.message }),
    }).then(() => this.setMessage(""));
  }

  render() {
    return (
      <Fragment>
        <h1>Messages:</h1>
        {this.messages.map((message) => <li>{message}</li>)}

        <Todos />
      </Fragment>
    );
  }
}

render(<App />, document.body);
