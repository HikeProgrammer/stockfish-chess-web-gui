import fs from "fs";
import path from "path";
import mime from "mime-types";
import { fileURLToPath } from "url";

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
  const contentType = mime.lookup(filePath) || "application/octet-stream";

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
