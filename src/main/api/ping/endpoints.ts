export async function ping(): Promise<string> {
  console.log("Main: Received Ping from Renderer");
  return "pong";
}
