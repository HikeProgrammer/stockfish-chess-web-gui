import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getMimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".html": return "text/html; charset=utf-8";
    case ".js":   return "text/javascript; charset=utf-8";
    case ".css":  return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".png":  return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif":  return "image/gif";
    case ".svg":  return "image/svg+xml";
    case ".webp": return "image/webp";
    case ".ico":  return "image/x-icon";
    case ".woff": return "font/woff";
    case ".woff2":return "font/woff2";
    case ".ttf":  return "font/ttf";
    case ".mp4":  return "video/mp4";
    default:      return "application/octet-stream";
  }
}

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = __dirname;

export function activate() {
  return "success";
}

export function deactivate() {
  return "success";
}

/**
 * @param {Request} req
 * @returns {Response}
 */
export async function serve(req) {
  const url = new URL(req.url);
  let pathname = decodeURIComponent(url.pathname);

  // Normalize path
  pathname = path.normalize(pathname);

  // Prevent directory traversal
  if (pathname.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  let filePath = path.join(DIST_DIR, pathname);

  // If path is directory → serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // SPA fallback
  if (!fs.existsSync(filePath)) {
    const indexPath = path.join(DIST_DIR, "index.html");
    if (!fs.existsSync(indexPath)) {
      return new Response("Not found", { status: 404 });
    }
    filePath = indexPath;
  }

  const data = await fs.promises.readFile(filePath);
  const contentType = getMimeType(filePath) || "application/octet-stream";

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
