import type { ImageResultData, ToolDefinition } from "../types";

export const imageTools: ToolDefinition[] = [
  {
    slug: "image-compress",
    name: "Image Compressor",
    description: "Compress images with quality control",
    section: "images",
    aliases: ["compress", "optimize-image"],
    inputType: "file",
    outputType: "image-result",
    useWorker: "image",
    options: [
      {
        id: "quality",
        label: "Quality (%)",
        type: "number",
        default: 80,
        min: 1,
        max: 100,
      },
      {
        id: "format",
        label: "Output format",
        type: "select",
        default: "jpeg",
        options: [
          { value: "jpeg", label: "JPEG" },
          { value: "webp", label: "WebP" },
          { value: "png", label: "PNG" },
        ],
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, 0, 0);

      const quality = Number(opts.quality) / 100;
      const format = String(opts.format);
      const mimeType = `image/${format === "jpeg" ? "jpeg" : format}`;

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ type: "error", message: "Compression failed" });
              return;
            }
            const resultUrl = URL.createObjectURL(blob);
            const originalSize = input.size;
            const resultSize = blob.size;
            const savings = (1 - resultSize / originalSize) * 100;

            const result: ImageResultData = {
              type: "image-result",
              resultUrl,
              originalSize,
              resultSize,
              originalDimensions: { width: img.width, height: img.height },
              resultDimensions: { width: img.width, height: img.height },
              savings,
              filename: `compressed.${format === "jpeg" ? "jpg" : format}`,
            };
            resolve(result);
          },
          mimeType,
          quality,
        );
      });
    },
  },
  {
    slug: "image-resize",
    name: "Image Resizer",
    description: "Resize images to specific dimensions",
    section: "images",
    aliases: ["resize", "scale-image"],
    inputType: "file",
    outputType: "image-result",
    useWorker: "image",
    options: [
      {
        id: "width",
        label: "Width (px)",
        type: "number",
        default: 800,
        min: 1,
        max: 10000,
      },
      {
        id: "height",
        label: "Height (px)",
        type: "number",
        default: 600,
        min: 1,
        max: 10000,
      },
      {
        id: "keepAspect",
        label: "Keep aspect ratio",
        type: "toggle",
        default: true,
      },
      {
        id: "format",
        label: "Output format",
        type: "select",
        default: "png",
        options: [
          { value: "png", label: "PNG" },
          { value: "jpeg", label: "JPEG" },
          { value: "webp", label: "WebP" },
        ],
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      let targetWidth = Number(opts.width);
      let targetHeight = Number(opts.height);

      if (opts.keepAspect) {
        const ratio = img.width / img.height;
        if (targetWidth / targetHeight > ratio) {
          targetWidth = Math.round(targetHeight * ratio);
        } else {
          targetHeight = Math.round(targetWidth / ratio);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const format = String(opts.format);
      const mimeType = `image/${format}`;

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ type: "error", message: "Resize failed" });
            return;
          }
          const resultUrl = URL.createObjectURL(blob);

          const result: ImageResultData = {
            type: "image-result",
            resultUrl,
            originalSize: input.size,
            resultSize: blob.size,
            originalDimensions: { width: img.width, height: img.height },
            resultDimensions: { width: targetWidth, height: targetHeight },
            filename: `resized.${format === "jpeg" ? "jpg" : format}`,
          };
          resolve(result);
        }, mimeType);
      });
    },
  },
  {
    slug: "image-convert",
    name: "Image Format Converter",
    description: "Convert between PNG, JPEG, and WebP",
    section: "images",
    aliases: ["png-to-jpg", "jpg-to-png", "webp"],
    inputType: "file",
    outputType: "image-result",
    options: [
      {
        id: "format",
        label: "Output format",
        type: "select",
        default: "webp",
        options: [
          { value: "png", label: "PNG" },
          { value: "jpeg", label: "JPEG" },
          { value: "webp", label: "WebP" },
        ],
      },
      {
        id: "quality",
        label: "Quality (%)",
        type: "number",
        default: 90,
        min: 1,
        max: 100,
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      if (opts.format === "jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const quality = Number(opts.quality) / 100;
      const format = String(opts.format);
      const mimeType = `image/${format}`;

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ type: "error", message: "Conversion failed" });
              return;
            }
            const resultUrl = URL.createObjectURL(blob);
            const ext = format === "jpeg" ? "jpg" : format;
            const savings = (1 - blob.size / input.size) * 100;

            const result: ImageResultData = {
              type: "image-result",
              resultUrl,
              originalSize: input.size,
              resultSize: blob.size,
              originalDimensions: { width: img.width, height: img.height },
              resultDimensions: { width: img.width, height: img.height },
              savings,
              filename: `converted.${ext}`,
            };
            resolve(result);
          },
          mimeType,
          quality,
        );
      });
    },
  },
  {
    slug: "image-crop",
    name: "Image Cropper",
    description: "Crop images to specific dimensions",
    section: "images",
    aliases: ["crop"],
    inputType: "file",
    outputType: "image-result",
    options: [
      { id: "x", label: "X offset", type: "number", default: 0, min: 0 },
      { id: "y", label: "Y offset", type: "number", default: 0, min: 0 },
      { id: "width", label: "Width", type: "number", default: 100, min: 1 },
      { id: "height", label: "Height", type: "number", default: 100, min: 1 },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const x = Number(opts.x);
      const y = Number(opts.y);
      const width = Math.min(Number(opts.width), img.width - x);
      const height = Math.min(Number(opts.height), img.height - y);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ type: "error", message: "Crop failed" });
            return;
          }
          const resultUrl = URL.createObjectURL(blob);

          const result: ImageResultData = {
            type: "image-result",
            resultUrl,
            originalSize: input.size,
            resultSize: blob.size,
            originalDimensions: { width: img.width, height: img.height },
            resultDimensions: { width, height },
            filename: "cropped.png",
          };
          resolve(result);
        }, "image/png");
      });
    },
  },
  {
    slug: "image-rotate",
    name: "Image Rotator / Flipper",
    description: "Rotate or flip images",
    section: "images",
    aliases: ["rotate", "flip", "mirror"],
    inputType: "file",
    outputType: "image-result",
    options: [
      {
        id: "operation",
        label: "Operation",
        type: "select",
        default: "90",
        options: [
          { value: "90", label: "Rotate 90° clockwise" },
          { value: "180", label: "Rotate 180°" },
          { value: "270", label: "Rotate 90° counter-clockwise" },
          { value: "flipH", label: "Flip horizontal" },
          { value: "flipV", label: "Flip vertical" },
        ],
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const isRotate90 = opts.operation === "90" || opts.operation === "270";

      const canvas = document.createElement("canvas");
      canvas.width = isRotate90 ? img.height : img.width;
      canvas.height = isRotate90 ? img.width : img.height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);

      switch (opts.operation) {
        case "90":
          ctx.rotate(Math.PI / 2);
          break;
        case "180":
          ctx.rotate(Math.PI);
          break;
        case "270":
          ctx.rotate(-Math.PI / 2);
          break;
        case "flipH":
          ctx.scale(-1, 1);
          break;
        case "flipV":
          ctx.scale(1, -1);
          break;
      }

      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ type: "error", message: "Operation failed" });
            return;
          }
          const resultUrl = URL.createObjectURL(blob);

          const result: ImageResultData = {
            type: "image-result",
            resultUrl,
            originalSize: input.size,
            resultSize: blob.size,
            originalDimensions: { width: img.width, height: img.height },
            resultDimensions: { width: canvas.width, height: canvas.height },
            filename: "transformed.png",
          };
          resolve(result);
        }, "image/png");
      });
    },
  },
  {
    slug: "color-picker",
    name: "Color Picker from Image",
    description: "Click on an image to sample pixel colors",
    section: "images",
    aliases: ["eyedropper", "pick-color"],
    inputType: "file",
    outputType: "preview",
    transform: async (input) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, 0, 0);

      // Sample center pixel as example
      const centerX = Math.floor(img.width / 2);
      const centerY = Math.floor(img.height / 2);
      const pixel = ctx.getImageData(centerX, centerY, 1, 1).data;

      const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
      const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

      const dataUrl = canvas.toDataURL();

      return [
        `Image loaded: ${img.width}×${img.height}`,
        "",
        `Center pixel (${centerX}, ${centerY}):`,
        `  Hex: ${hex}`,
        `  RGB: ${rgb}`,
        "",
        `Preview: ${dataUrl}`,
      ].join("\n");
    },
  },
  {
    slug: "palette-extractor",
    name: "Palette Extractor",
    description: "Extract dominant colors from an image",
    section: "images",
    aliases: ["extract-colors", "dominant-colors"],
    inputType: "file",
    outputType: "text",
    options: [
      {
        id: "colors",
        label: "Number of colors",
        type: "number",
        default: 5,
        min: 2,
        max: 20,
      },
    ],
    transform: async (input, opts) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const canvas = document.createElement("canvas");
      const size = 100; // Sample at lower resolution
      canvas.width = size;
      canvas.height = size;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;

      // Simple color quantization
      const colorCounts = new Map<string, number>();

      for (let i = 0; i < pixels.length; i += 4) {
        // Quantize to reduce colors
        const r = Math.round(pixels[i] / 32) * 32;
        const g = Math.round(pixels[i + 1] / 32) * 32;
        const b = Math.round(pixels[i + 2] / 32) * 32;
        const key = `${r},${g},${b}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }

      const sortedColors = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, Number(opts.colors));

      const results = sortedColors.map(([rgb], i) => {
        const [r, g, b] = rgb.split(",").map(Number);
        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        return `${i + 1}. ${hex} - rgb(${r}, ${g}, ${b})`;
      });

      return [`Extracted ${opts.colors} dominant colors:`, "", ...results].join(
        "\n",
      );
    },
  },
  {
    slug: "qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes from text or URLs",
    section: "images",
    aliases: ["qrcode", "qr"],
    inputType: "text",
    outputType: "image",
    inputPlaceholder: "Enter text or URL...",
    options: [
      {
        id: "size",
        label: "Size (px)",
        type: "number",
        default: 256,
        min: 64,
        max: 1024,
      },
      {
        id: "errorCorrection",
        label: "Error correction",
        type: "select",
        default: "M",
        options: [
          { value: "L", label: "Low (7%)" },
          { value: "M", label: "Medium (15%)" },
          { value: "Q", label: "Quartile (25%)" },
          { value: "H", label: "High (30%)" },
        ],
      },
    ],
    transform: async (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const QRCode = await import("qrcode");
      const size = Number(opts.size) || 256;

      try {
        const dataUrl = await QRCode.toDataURL(str, {
          width: size,
          margin: 2,
          errorCorrectionLevel: String(opts.errorCorrection) as
            | "L"
            | "M"
            | "Q"
            | "H",
        });
        return { type: "image", data: dataUrl };
      } catch (e) {
        return { type: "error", message: (e as Error).message };
      }
    },
  },
  {
    slug: "qr-reader",
    name: "QR Code Reader",
    description: "Read QR codes from images",
    section: "images",
    aliases: ["decode-qr", "scan-qr"],
    inputType: "file",
    outputType: "text",
    transform: async (input) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop a QR code image" };
      }

      // Note: This requires a QR reader library, showing structure
      const img = await loadImage(input);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, 0, 0);

      // Would need jsQR or similar library for actual decoding
      return [
        "QR Code reading requires the jsQR library.",
        "Image loaded successfully.",
        `Dimensions: ${img.width}×${img.height}`,
        "",
        "To enable QR reading, install: bun add jsqr",
      ].join("\n");
    },
  },
  {
    slug: "favicon-generator",
    name: "Favicon Generator",
    description: "Generate favicon.ico and various sizes from an image",
    section: "images",
    aliases: ["ico", "favicon"],
    inputType: "file",
    outputType: "download",
    transform: async (input) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const sizes = [16, 32, 48, 64, 128, 256];
      const results: string[] = [
        `Original: ${img.width}×${img.height}`,
        "",
        "Generated sizes:",
      ];

      for (const size of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = getCanvasContext(canvas);
        if (!ctx) {
          return { type: "error", message: "Canvas context unavailable" };
        }
        ctx.drawImage(img, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/png");
        results.push(`  ${size}×${size}: ${dataUrl.slice(0, 50)}...`);
      }

      // Create main 32x32 as downloadable
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      canvas.getContext("2d")?.drawImage(img, 0, 0, 32, 32);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ type: "error", message: "Generation failed" });
            return;
          }
          const url = URL.createObjectURL(blob);
          results.push("", `Download 32×32: ${url}`);
          resolve(results.join("\n"));
        }, "image/png");
      });
    },
  },
  {
    slug: "image-metadata",
    name: "Image Metadata Viewer",
    description: "View basic image metadata (dimensions, size, type)",
    section: "images",
    aliases: ["exif", "image-info"],
    inputType: "file",
    outputType: "text",
    transform: async (input) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);

      return [
        "Image Metadata:",
        "",
        `Filename: ${input.name}`,
        `MIME Type: ${input.type}`,
        `File Size: ${formatBytes(input.size)}`,
        `Dimensions: ${img.width}×${img.height} pixels`,
        `Aspect Ratio: ${(img.width / img.height).toFixed(3)}`,
        `Last Modified: ${new Date(input.lastModified).toISOString()}`,
        "",
        "Note: Full EXIF extraction requires additional libraries.",
      ].join("\n");
    },
  },
  {
    slug: "strip-metadata",
    name: "Strip Image Metadata",
    description: "Remove EXIF and other metadata from images",
    section: "images",
    aliases: ["remove-exif", "clean-image"],
    inputType: "file",
    outputType: "image-result",
    transform: async (input) => {
      if (!(input instanceof File)) {
        return { type: "error", message: "Please drop an image file" };
      }

      const img = await loadImage(input);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = getCanvasContext(canvas);
      if (!ctx) {
        return { type: "error", message: "Canvas context unavailable" };
      }
      ctx.drawImage(img, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ type: "error", message: "Processing failed" });
            return;
          }
          const resultUrl = URL.createObjectURL(blob);
          const savings = (1 - blob.size / input.size) * 100;

          const result: ImageResultData = {
            type: "image-result",
            resultUrl,
            originalSize: input.size,
            resultSize: blob.size,
            originalDimensions: { width: img.width, height: img.height },
            resultDimensions: { width: img.width, height: img.height },
            savings,
            filename: "cleaned.png",
          };
          resolve(result);
        }, input.type || "image/png");
      });
    },
  },
];

// Helper functions
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function getCanvasContext(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D | null {
  return canvas.getContext("2d");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
