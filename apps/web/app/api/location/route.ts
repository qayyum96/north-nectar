/**
 * The visitor's approximate city and province from their connection, used only to show the right
 * free-delivery amount before they choose a city. Netlify adds the location (from the IP address)
 * to each request in the "x-nf-geo" header; nothing is stored and no other service is called.
 * Returns nulls outside Pakistan or when the location is unknown (e.g. when running locally).
 */
export const dynamic = "force-dynamic";

const PROVINCES: Record<string, string> = {
  islamabad: "Islamabad Capital Territory",
  "islamabad capital territory": "Islamabad Capital Territory",
  punjab: "Punjab",
  sindh: "Sindh",
  "khyber pakhtunkhwa": "Khyber Pakhtunkhwa",
  balochistan: "Balochistan",
  "gilgit-baltistan": "Gilgit-Baltistan",
  "gilgit baltistan": "Gilgit-Baltistan",
  "azad kashmir": "Azad Kashmir",
};

interface NetlifyGeo {
  city?: string;
  country?: { code?: string };
  subdivision?: { code?: string; name?: string };
}

function readGeo(request: Request): NetlifyGeo | null {
  const raw = request.headers.get("x-nf-geo");
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as NetlifyGeo;
  } catch {
    try {
      return JSON.parse(raw) as NetlifyGeo;
    } catch {
      return null;
    }
  }
}

export function GET(request: Request) {
  const geo = readGeo(request);
  const inPakistan = geo?.country?.code === "PK";
  const city = inPakistan && geo?.city ? geo.city.trim() : null;
  const sub = inPakistan ? geo?.subdivision?.name?.trim().toLowerCase() : undefined;
  const province = sub ? (PROVINCES[sub] ?? null) : null;
  return Response.json({ city, province }, { headers: { "Cache-Control": "private, no-store" } });
}
