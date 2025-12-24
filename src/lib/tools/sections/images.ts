import exifr from "exifr";
import jsQR from "jsqr";
import QRCode from "qrcode";
import type { ImageResultData, ToolDefinition } from "../types";

export const imageTools: ToolDefinition[] = [
  {
    slug: "media-suite",
    name: "Media Suite",
    description: "Image resize/convert/compress and QR tools",
    section: "images",
    aliases: ["image", "qr", "media"],
    inputType: "text",
    outputType: "preview",
    acceptsFile: true,
    fileAccept: "image/*",
    useWorker: "image",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "image-compress",
        options: [
          { value: "image-compress", label: "Compress image" },
          { value: "image-resize", label: "Resize image" },
          { value: "image-convert", label: "Convert format" },
          { value: "image-strip", label: "Strip metadata" },
          { value: "image-metadata", label: "Read metadata" },
          { value: "qr-generate", label: "QR generate" },
          { value: "qr-read", label: "QR read" },
        ],
      },
      {
        id: "quality",
        label: "Quality (%)",
        type: "number",
        default: 80,
        min: 1,
        max: 100,
        visibleWhen: { optionId: "mode", equals: "image-compress" },
      },
      {
        id: "format",
        label: "Format",
        type: "select",
        default: "jpeg",
        options: [
          { value: "jpeg", label: "JPEG" },
          { value: "png", label: "PNG" },
          { value: "webp", label: "WebP" },
        ],
        visibleWhen: {
          optionId: "mode",
          equals: [
            "image-compress",
            "image-convert",
            "image-resize",
            "image-strip",
          ],
        },
      },
      {
        id: "width",
        label: "Width",
        type: "number",
        default: 800,
        min: 1,
        max: 10000,
        visibleWhen: { optionId: "mode", equals: "image-resize" },
      },
      {
        id: "height",
        label: "Height",
        type: "number",
        default: 600,
        min: 1,
        max: 10000,
        visibleWhen: { optionId: "mode", equals: "image-resize" },
      },
      {
        id: "keepAspect",
        label: "Keep aspect ratio",
        type: "toggle",
        default: true,
        visibleWhen: { optionId: "mode", equals: "image-resize" },
      },
    ],
    transform: async (input, opts) => {
      const mode = String(opts.mode);

      if (mode === "qr-generate") {
        if (input instanceof File) {
          return { type: "error", message: "Enter text to generate a QR code" };
        }
        if (!input) return "";
        const dataUrl = await QRCode.toDataURL(String(input));
        return { type: "image", data: dataUrl };
      }

      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      if (mode === "image-metadata") {
        try {
          const metadata = await exifr.parse(input, { translateValues: true });
          return JSON.stringify(metadata, null, 2);
        } catch {
          return { type: "error", message: "Failed to read metadata" };
        }
      }

      if (mode === "qr-read") {
        const image = await loadImage(input);
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return { type: "error", message: "Canvas unavailable" };
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        return code ? code.data : "No QR code detected";
      }

      const img = await loadImage(input);
      if (mode === "image-resize") {
        let targetWidth = Number(opts.width) || img.width;
        let targetHeight = Number(opts.height) || img.height;
        if (opts.keepAspect) {
          const ratio = img.width / img.height;
          if (targetWidth / targetHeight > ratio) {
            targetWidth = Math.round(targetHeight * ratio);
          } else {
            targetHeight = Math.round(targetWidth / ratio);
          }
        }
        const format = String(opts.format || "png");
        return resizeImage(img, targetWidth, targetHeight, input, format);
      }

      if (mode === "image-compress") {
        const quality = Number(opts.quality) / 100;
        const format = String(opts.format || "jpeg");
        return convertImage(img, input, format, quality);
      }

      if (mode === "image-convert") {
        const format = String(opts.format || "jpeg");
        return convertImage(img, input, format, 0.9);
      }

      if (mode === "image-strip") {
        const format = String(opts.format || "jpeg");
        return convertImage(img, input, format, 0.92);
      }

      return "";
    },
  },
  {
    slug: "image-to-ico",
    name: "Image to ICO",
    description: "Convert any image into a multi-size .ico file",
    section: "images",
    aliases: ["ico", "icon", "favicon", "image to ico"],
    inputType: "file",
    outputType: "download",
    acceptsFile: true,
    fileAccept: "image/*",
    runPolicy: "manual",
    options: [
      {
        id: "sizes",
        label: "Icon sizes",
        type: "select",
        default: "standard",
        options: [
          { value: "favicon", label: "Favicon (16, 32, 48)" },
          { value: "standard", label: "Standard (16, 32, 48, 64, 128, 256)" },
          { value: "large", label: "Large (64, 128, 256)" },
        ],
      },
      {
        id: "fit",
        label: "Fit",
        type: "select",
        default: "contain",
        options: [
          { value: "contain", label: "Contain (pad)" },
          { value: "cover", label: "Cover (crop)" },
        ],
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const preset = String(opts.sizes || "standard");
      const fit = String(opts.fit || "contain");
      const sizes = resolveIcoSizes(preset);
      const icoData = await buildIcoFromImage(img, sizes, fit);
      const baseName = input.name?.replace(/\.[^.]+$/, "") || "icon";

      return {
        type: "download",
        data: icoData,
        filename: `${baseName}.ico`,
        mime: "image/x-icon",
      };
    },
  },
];

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}

const ICO_PRESETS: Record<string, number[]> = {
  favicon: [16, 32, 48],
  standard: [16, 32, 48, 64, 128, 256],
  large: [64, 128, 256],
};

function resolveIcoSizes(preset: string): number[] {
  const sizes = ICO_PRESETS[preset] ?? ICO_PRESETS.standard;
  return Array.from(new Set(sizes)).sort((a, b) => a - b);
}

async function buildIcoFromImage(
  img: HTMLImageElement,
  sizes: number[],
  fit: string,
): Promise<Uint8Array> {
  const fitMode = fit === "cover" ? "cover" : "contain";
  const images = await Promise.all(
    sizes.map(async (size) => ({
      size,
      data: await renderPngBytes(img, size, fitMode),
    })),
  );

  const headerSize = 6;
  const dirSize = 16 * images.length;
  const dataSize = images.reduce(
    (sum, imgData) => sum + imgData.data.length,
    0,
  );
  const buffer = new ArrayBuffer(headerSize + dirSize + dataSize);
  const view = new DataView(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let dirOffset = headerSize;
  let dataOffset = headerSize + dirSize;

  for (const icon of images) {
    const size = icon.size;
    const width = size === 256 ? 0 : size;
    const height = size === 256 ? 0 : size;

    view.setUint8(dirOffset, width);
    view.setUint8(dirOffset + 1, height);
    view.setUint8(dirOffset + 2, 0);
    view.setUint8(dirOffset + 3, 0);
    view.setUint16(dirOffset + 4, 1, true);
    view.setUint16(dirOffset + 6, 32, true);
    view.setUint32(dirOffset + 8, icon.data.length, true);
    view.setUint32(dirOffset + 12, dataOffset, true);

    new Uint8Array(buffer, dataOffset, icon.data.length).set(icon.data);
    dirOffset += 16;
    dataOffset += icon.data.length;
  }

  return new Uint8Array(buffer);
}

async function renderPngBytes(
  img: HTMLImageElement,
  size: number,
  fit: "contain" | "cover",
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  const scale =
    fit === "cover"
      ? Math.max(size / img.width, size / img.height)
      : Math.min(size / img.width, size / img.height);
  const drawWidth = Math.round(img.width * scale);
  const drawHeight = Math.round(img.height * scale);
  const dx = Math.round((size - drawWidth) / 2);
  const dy = Math.round((size - drawHeight) / 2);

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Failed to encode PNG");
  }

  return new Uint8Array(await blob.arrayBuffer());
}

function resizeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  file: File,
  format: string,
): Promise<ImageResultData> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.resolve({
      type: "image-result",
      resultUrl: "",
      resultSize: 0,
    });
  }
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve({ type: "image-result", resultUrl: "", resultSize: 0 });
        return;
      }
      const resultUrl = URL.createObjectURL(blob);
      resolve({
        type: "image-result",
        resultUrl,
        originalSize: file.size,
        resultSize: blob.size,
        originalDimensions: { width: img.width, height: img.height },
        resultDimensions: { width, height },
        filename: `resized.${format === "jpeg" ? "jpg" : format}`,
      });
    }, `image/${format}`);
  });
}

function convertImage(
  img: HTMLImageElement,
  file: File,
  format: string,
  quality: number,
): Promise<ImageResultData> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.resolve({
      type: "image-result",
      resultUrl: "",
      resultSize: 0,
    });
  }
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  const mimeType = `image/${format}`;
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve({ type: "image-result", resultUrl: "", resultSize: 0 });
          return;
        }
        const resultUrl = URL.createObjectURL(blob);
        resolve({
          type: "image-result",
          resultUrl,
          originalSize: file.size,
          resultSize: blob.size,
          originalDimensions: { width: img.width, height: img.height },
          resultDimensions: { width: img.width, height: img.height },
          filename: `converted.${format === "jpeg" ? "jpg" : format}`,
        });
      },
      mimeType,
      quality,
    );
  });
}
