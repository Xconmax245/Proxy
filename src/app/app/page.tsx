"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PrivPayLoader from "@/components/shared/PrivPayLoader";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/delegations");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <PrivPayLoader size="lg" />
    </div>
  );
}
