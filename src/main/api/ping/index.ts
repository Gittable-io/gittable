export function post_ping(): string {
  console.log("Main: Received Ping from Renderer");
  return "pong";
}
