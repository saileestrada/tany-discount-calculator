import type { Context, Config } from "@netlify/functions";

const DB1_DATA_SOURCE_ID = "3ac36b37-e15c-80a2-bc45-000bb956d227"; // Item List
const NOTION_VERSION = "2025-09-03";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const itemNo = url.searchParams.get("itemNo");

  if (!itemNo) {
    return new Response(JSON.stringify({ error: "Missing itemNo parameter" }), {
      status: 400,
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

  const res = await fetch(`https://api.notion.com/v1/data_sources/${DB1_DATA_SOURCE_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { property: "Item No", title: { equals: itemNo } },
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
  if (!data.results || data.results.length === 0) {
    return new Response(JSON.stringify({ found: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const props = data.results[0].properties;
  return new Response(
    JSON.stringify({
      found: true,
      itemName: props["Item Name"]?.rich_text?.[0]?.plain_text || "",
      itemsPerCase: props["Items"]?.number ?? 1,
      wholesalePrice: props["Wholesale Price (EA)"]?.number ?? 0,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const config: Config = {
  path: "/api/lookup-item",
};
