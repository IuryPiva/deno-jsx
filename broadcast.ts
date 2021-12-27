export const memory: { messages: string[] } = { messages: [] };
// Create a new broadcast channel named earth.
export const channel = new BroadcastChannel("earth");
// Set onmessage event handler.
channel.onmessage = (event: MessageEvent<string>) => {
  // Update the local state when other instances
  // send us a new message.
  memory.messages.push(event.data);
};
