// Supabase Edge Function: OGP response for 3D Surface Chart shares.
//
// Deploy:
//   supabase functions deploy og-surface-3d-share --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const DEPLOY_ORIGIN = "https://3d-surface-chart.dataviz.jp";
const DEFAULT_OG_IMAGE = `${DEPLOY_ORIGIN}/images/og-default.png`;
const SHARE_TABLE = "surface_3d_shares";
const OG_IMAGE_BUCKET = "surface-3d-og-images";
const BOT_UA_PATTERN =
  /Twitterbot|facebookexternalhit|Facebot|LinkedInBot|Slackbot|Discordbot|LINE|Googlebot|bingbot/i;
const SHARE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeToAsciiHtml(str: string): string {
  let result = "";
  for (const ch of str) {
    const code = ch.codePointAt(0)!;
    if (ch === "&") result += "&amp;";
    else if (ch === '"') result += "&quot;";
    else if (ch === "<") result += "&lt;";
    else if (ch === ">") result += "&gt;";
    else if (code > 127) result += `&#x${code.toString(16)};`;
    else result += ch;
  }
  return result;
}

async function resolveOgImageUrl(id: string) {
  const shareOgImage =
    `${SUPABASE_URL}/storage/v1/object/public/${OG_IMAGE_BUCKET}/${id}.png`;

  try {
    const response = await fetch(shareOgImage, { method: "HEAD" });
    if (response.ok) return shareOgImage;
  } catch (_error) {
    // Fall through to the default image when storage probing fails.
  }

  return DEFAULT_OG_IMAGE;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id parameter", { status: 400 });
  }

  if (!SHARE_ID_PATTERN.test(id)) {
    return new Response("Invalid id parameter", { status: 400 });
  }

  const shareUrl = `${DEPLOY_ORIGIN}/share.html?id=${id}`;
  const ua = req.headers.get("user-agent") || "";

  if (!BOT_UA_PATTERN.test(ua)) {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": shareUrl,
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Vary": "User-Agent",
      },
    });
  }

  const { data: share } = await supabase
    .from(SHARE_TABLE)
    .select("title")
    .eq("id", id)
    .single();

  const ogTitle = escapeToAsciiHtml(
    share?.title || "3D Surface Chart",
  );
  const ogDesc = escapeToAsciiHtml(
    "3D Surface Chart - dataviz.jp",
  );
  const siteName = escapeToAsciiHtml("3D Surface Chart");
  const escapedShareUrl = escapeToAsciiHtml(shareUrl);
  const ogImage = await resolveOgImageUrl(id);
  const escapedOgImage = escapeToAsciiHtml(ogImage);

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:site_name" content="${siteName}">
<meta property="og:url" content="${escapedShareUrl}">
<meta property="og:image" content="${escapedOgImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDesc}">
<meta name="twitter:image" content="${escapedOgImage}">
<link rel="canonical" href="${escapedShareUrl}">
<title>${ogTitle}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;line-height:1.5;color:#111827;">
<p>Redirecting to the shared chart...</p>
<p><a href="${escapedShareUrl}">Open the shared chart</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Vary": "User-Agent",
    },
  });
});
