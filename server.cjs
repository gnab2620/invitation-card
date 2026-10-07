const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const rootDir = __dirname;
const settingsPath = path.join(rootDir, "appsettings.json");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function readSettings() {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32_000) {
        request.destroy();
        reject(new Error("Payload is too large."));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function normalizeRsvp(input) {
  const fullName = String(input.fullName || "").trim().replace(/\s+/g, " ");
  const attendance = input.attendance === true;
  const requestedGuestCount = Number.parseInt(input.guestCount, 10);
  const guestCount = attendance ? requestedGuestCount : 0;

  if (!fullName || fullName.length > 120) {
    return { error: "Vui lòng nhập họ và tên hợp lệ." };
  }

  if (attendance && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
    return { error: "Số lượng người tham dự không hợp lệ." };
  }

  return {
    value: {
      full_name: fullName,
      attendance,
      guest_count: guestCount
    }
  };
}

async function handleRsvp(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Method not allowed." });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readRequestBody(request) || "{}");
  } catch {
    sendJson(response, 400, { message: "Dữ liệu gửi lên không hợp lệ." });
    return;
  }

  const normalized = normalizeRsvp(payload);
  if (normalized.error) {
    sendJson(response, 400, { message: normalized.error });
    return;
  }

  const settings = readSettings();
  const supabase = settings.supabase || {};
  const tableName = supabase.table || "wedding_rsvps";

  const hasPlaceholder =
    String(supabase.url || "").includes("YOUR_") ||
    String(supabase.serviceRoleKey || "").includes("YOUR_");

  if (!supabase.url || !supabase.serviceRoleKey || hasPlaceholder) {
    sendJson(response, 500, { message: "Backend chưa được cấu hình Supabase." });
    return;
  }

  const endpoint = `${supabase.url.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(tableName)}`;
  const insertPayload = {
    ...normalized.value,
    user_agent: request.headers["user-agent"] || null
  };

  try {
    const supabaseResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabase.serviceRoleKey,
        "Authorization": `Bearer ${supabase.serviceRoleKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(insertPayload)
    });

    if (!supabaseResponse.ok) {
      const detail = await supabaseResponse.text();
      console.error("Supabase insert failed:", detail);
      sendJson(response, 502, { message: "Không thể lưu xác nhận vào Supabase." });
      return;
    }

    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(response, 502, { message: "Không thể kết nối Supabase." });
  }
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const decodedPath = decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(rootDir, decodedPath));
  const relativePath = path.relative(rootDir, filePath);
  const relativeSegments = relativePath.split(path.sep);
  const blockedStaticFiles = new Set([
    ".gitignore",
    "appsettings.json",
    "appsettings.example.json",
    "package.json",
    "server.cjs",
    "supabase_schema.sql",
    "SUPABASE_SETUP.md"
  ]);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    relativeSegments.some((segment) => segment.startsWith(".")) ||
    blockedStaticFiles.has(relativePath)
  ) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(data);
  });
}

const settings = readSettings();
const port = Number(process.env.PORT || settings.server?.port || 4173);

const server = http.createServer((request, response) => {
  if (request.url.startsWith("/api/rsvp")) {
    handleRsvp(request, response);
    return;
  }

  serveStatic(request, response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Wedding invitation server: http://127.0.0.1:${port}`);
});
