import { Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">Tool not found</p>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 size-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
