const path = require("path");
const { readUpload } = require("./upload-storage");

const PLACEHOLDER_PATH_RE = /^\/images\/photos\/photo-\d+\.svg$/i;

function isPlaceholderImage(imagePath) {
  if (!imagePath) return true;
  return PLACEHOLDER_PATH_RE.test(imagePath);
}

async function isMissingUpload(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return false;
  const filename = path.basename(imagePath);
  const found = await readUpload(filename);
  return !found;
}

async function isFillableSlot(row) {
  if (isPlaceholderImage(row.image_path)) return true;
  return isMissingUpload(row.image_path);
}

function sortGalleryRows(rows) {
  return [...rows].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

function slotSequence(row, allRows) {
  const sorted = sortGalleryRows(allRows);
  const idx = sorted.findIndex((r) => r.id === row.id);
  return idx >= 0 ? idx + 1 : sorted.length + 1;
}

async function getFillableSlots(allRows) {
  const sorted = sortGalleryRows(allRows);
  const fillable = [];
  for (const row of sorted) {
    if (await isFillableSlot(row)) fillable.push(row);
  }
  return fillable;
}

function nextSortOrder(allRows) {
  if (!allRows.length) return 0;
  return Math.max(...allRows.map((r) => r.sort_order ?? 0)) + 1;
}

module.exports = {
  isPlaceholderImage,
  isMissingUpload,
  isFillableSlot,
  sortGalleryRows,
  slotSequence,
  getFillableSlots,
  nextSortOrder,
};
