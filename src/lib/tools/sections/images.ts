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
];

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
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
