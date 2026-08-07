// Supabase Edge Function: publish a saved 3D Surface Chart project to a public share row.
//
// Deploy:
//   supabase functions deploy publish-surface-3d-share --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DATAVIZ_API_URL = Deno.env.get("DATAVIZ_API_URL") ||
  "https://api.dataviz.jp";
const SHARE_TABLE = "surface_3d_shares";
const CHART_TYPE = "3d-surface-chart";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-dataviz-authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function serializeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: "Error",
      message: error.message,
      stack: error.stack || null,
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      type: "Object",
      message: typeof record.message === "string"
        ? record.message
        : String(error),
      code: typeof record.code === "string" ? record.code : null,
      details: typeof record.details === "string" ? record.details : null,
      hint: typeof record.hint === "string" ? record.hint : null,
      status: typeof record.status === "number" ? record.status : null,
      name: typeof record.name === "string" ? record.name : null,
    };
  }

  return {
    type: typeof error,
    message: String(error),
  };
}

function readDatavizAccessToken(req: Request) {
  const raw = req.headers.get("x-dataviz-authorization") || "";
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function decodeJwtSubject(token: string | null) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    return typeof parsed?.sub === "string" ? parsed.sub : null;
  } catch (_error) {
    return null;
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function extractProjectPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("invalid_project_payload");
  }

  const projectData = payload as Record<string, unknown>;
  const settings = projectData.settings;

  if (
    projectData.chartType !== CHART_TYPE ||
    projectData.data == null ||
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings)
  ) {
    throw new Error("invalid_project_payload");
  }

  return cloneJson(projectData);
}

function resolveShareTitle(
  chartConfig: Record<string, unknown>,
  fallbackTitle: string,
) {
  const settings =
    chartConfig.settings && typeof chartConfig.settings === "object"
      ? chartConfig.settings as Record<string, unknown>
      : null;

  const candidates = [
    typeof chartConfig.annotateTitle === "string"
      ? chartConfig.annotateTitle
      : "",
    typeof settings?.annotateTitle === "string" ? settings.annotateTitle : "",
    fallbackTitle,
    "3D Surface Chart",
  ];

  return candidates.map((value) => String(value || "").trim()).find(Boolean) ||
    "3D Surface Chart";
}

async function loadSavedProject(projectId: string, accessToken: string) {
  const response = await fetch(
    `${DATAVIZ_API_URL}/api/projects/${encodeURIComponent(projectId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorPayload = await response.json().catch(async () => ({
      error: await response.text().catch(() => ""),
    }));
    const message = errorPayload?.error || errorPayload?.detail ||
      `Project API error: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

async function saveShare(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(SHARE_TABLE)
    .insert(payload)
    .select("id, title")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const accessToken = readDatavizAccessToken(req);
  if (!accessToken) {
    return jsonResponse({ error: "Login required" }, 401);
  }

  const body = await req.json().catch(() => null) as
    | Record<string, unknown>
    | null;
  const projectId = String(body?.projectId || "").trim();
  const fallbackTitle = String(body?.fallbackTitle || "").trim();
  if (!projectId) {
    return jsonResponse({ error: "projectId is required" }, 400);
  }

  try {
    const savedProjectResponse = await loadSavedProject(projectId, accessToken);
    const chartConfig = extractProjectPayload(savedProjectResponse);
    const title = resolveShareTitle(chartConfig, fallbackTitle);
    const createdBy = decodeJwtSubject(accessToken);

    const payload: Record<string, unknown> = {
      title,
      chart_config: chartConfig,
    };
    if (createdBy) payload.created_by = createdBy;

    const data = await saveShare(payload);

    return jsonResponse({
      shareId: data.id,
      title: data.title,
    });
  } catch (error) {
    const serializedError = serializeUnknownError(error);
    console.error("[publish-surface-3d-share] failed", {
      projectId,
      serializedError,
    });
    return jsonResponse({ error: "publish_failed" }, 500);
  }
});
