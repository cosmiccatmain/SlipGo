import { supabase } from "./supabase";

// ── Owner-uploaded boat photos ───────────────────────────────────────────────
// A boat card only ever shows a photo its owner uploaded. Nothing is searched
// for, generated, or borrowed from elsewhere.
//
// Objects live at <user_id>/<boat_id>.jpg in the public `boat-photos` bucket.
// That layout is what the storage RLS policies key on: the first path segment
// must equal auth.uid(), so one user can never write over another's photo.

const BUCKET = "boat-photos";

/** Phone photos are 4–12 MP; a 1400px wide card never needs that. */
const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.85;
/** Matches the bucket's own limit, checked early for a better error. */
const MAX_BYTES = 5 * 1024 * 1024;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_ACCEPT = ACCEPTED.join(",");

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

/**
 * Downscale to MAX_EDGE and re-encode as JPEG. Also strips EXIF — phone photos
 * carry GPS coordinates, and a boat photo's location is where the boat lives.
 */
async function compress(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // No canvas — upload the original rather than fail.
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

/** Public CDN URL for a stored photo, or null when the boat has none. */
export function photoUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadBoatPhoto(
  userId: string,
  boatId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (!ACCEPTED.includes(file.type)) {
    return { error: "Please choose a JPEG, PNG, or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "That image is over 5 MB. Try a smaller one." };
  }

  let body: Blob;
  try {
    body = await compress(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not read that image." };
  }

  const path = `${userId}/${boatId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) return { error: error.message };

  const { error: rowError } = await supabase
    .from("boats")
    .update({ photo_path: path })
    .eq("id", boatId);
  if (rowError) return { error: rowError.message };

  return { path };
}

export async function removeBoatPhoto(
  boatId: string,
  path: string,
): Promise<{ error?: string }> {
  // Clear the row first: a boat pointing at a deleted object renders broken,
  // whereas an orphaned object is merely wasted bytes.
  const { error: rowError } = await supabase
    .from("boats")
    .update({ photo_path: null })
    .eq("id", boatId);
  if (rowError) return { error: rowError.message };

  await supabase.storage.from(BUCKET).remove([path]);
  return {};
}

/**
 * Storage serves the same URL after a re-upload, so browsers show the old
 * photo from cache. A version marker on the URL forces a refetch.
 */
export function bust(url: string, version: number): string {
  return version === 0 ? url : `${url}?v=${version}`;
}
