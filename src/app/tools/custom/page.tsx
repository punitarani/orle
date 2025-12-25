export const dynamic = "error";
export const revalidate = false;
export const fetchCache = "force-cache";

import { Suspense } from "react";
import { CustomToolPageClient } from "./custom-page-client";

export default function CustomToolPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <CustomToolPageClient />
    </Suspense>
  );
}
