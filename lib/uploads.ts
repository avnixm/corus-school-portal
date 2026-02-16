import path from "path";
import { access } from "fs/promises";

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

export async function requirementFileExists(storageKey: string): Promise<boolean> {
  try {
    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, storageKey);
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
