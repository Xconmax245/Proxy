"use client";

import PrivPayLoader from "@/components/shared/PrivPayLoader";

export default function AppLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <PrivPayLoader size="lg" />
    </div>
  );
}
