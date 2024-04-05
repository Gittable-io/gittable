export type PingResponse = { status: "success"; message: "pong" };

export async function ping(): Promise<PingResponse> {
  console.log("Main: Received Ping from Renderer");
  return { status: "success", message: "pong" };
}
