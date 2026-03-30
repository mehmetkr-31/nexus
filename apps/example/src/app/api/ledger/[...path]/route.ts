import type { NextRequest } from "next/server";

const CANTON_URL =
	process.env.CANTON_API_URL ?? process.env.NEXT_PUBLIC_CANTON_API_URL ?? "http://localhost:7575";

const HOP_BY_HOP = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade"]);

async function proxy(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
	const { path } = await params;
	const url = `${CANTON_URL}/${path.join("/")}${req.nextUrl.search}`;

	const headers = new Headers();
	req.headers.forEach((value, key) => {
		if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== "host") {
			headers.set(key, value);
		}
	});

	const hasBody = req.method !== "GET" && req.method !== "HEAD";
	const body = hasBody ? await req.arrayBuffer() : undefined;

	const upstream = await fetch(url, {
		method: req.method,
		headers,
		body: body && body.byteLength > 0 ? body : undefined,
	});

	const resHeaders = new Headers();
	upstream.headers.forEach((value, key) => {
		if (!HOP_BY_HOP.has(key.toLowerCase())) {
			resHeaders.set(key, value);
		}
	});

	return new Response(upstream.body, {
		status: upstream.status,
		headers: resHeaders,
	});
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
