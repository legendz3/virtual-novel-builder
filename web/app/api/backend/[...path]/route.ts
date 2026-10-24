// Server-side proxy to the backend's story and account routes: keeps the backend URL off the browser and avoids CORS.
const BACKEND = process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024";
const ALLOWED = new Set(["stories", "account"]);

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(request: Request, { params }: Ctx) {
  const { path } = await params;
  if (!ALLOWED.has(path[0])) return new Response("Not found", { status: 404 });
  const url = `${BACKEND}/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  try {
    const res = await fetch(url, { method: request.method, cache: "no-store" });
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
    });
  } catch {
    return Response.json({ error: "The backend isn't reachable. Is it running?" }, { status: 502 });
  }
}

export { forward as GET, forward as POST };
