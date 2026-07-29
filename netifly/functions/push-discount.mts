import type { Context, Config } from "@netlify/functions";

const DB2_DATA_SOURCE_ID = "67d0119b-5fbf-4a79-860f-f7d3c04867de"; // Discount Guidelines
const NOTION_VERSION = "2025-09-03";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = Netlify.env.get("NOTION_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "NOTION_TOKEN not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { data_source_id: DB2_DATA_SOURCE_ID },
      properties: {
        "Item No": { title: [{ text: { content: String(payload["Item No"] ?? "") } }] },
        "Item Name": { rich_text: [{ text: { content: String(payload["Item Name"] ?? "") } }] },
        "# of Items": { number: payload["# of Items"] },
        "Wholesale Price": { number: payload["Wholesale Price"] },
        "Discount": { number: payload["Discount"] },
        "Discounted Price": { number: payload["Discounted Price"] },
        "SRP": { number: payload["SRP"] },
        "SRP Margin": { number: payload["SRP Margin"] },
        "Available for": { rich_text: [{ text: { content: String(payload["Available for"] ?? "") } }] },
        "Notes": { rich_text: [{ text: { content: String(payload["Notes"] ?? "") } }] },
        "Status": { select: { name: payload["Status"] } },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(JSON.stringify({ error: `Notion error ${res.status}`, detail }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ success: true, url: data.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/push-discount",
};
