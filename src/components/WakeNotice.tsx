"use client";

import { useEffect, useState } from "react";
import { wakeApi } from "@/lib/api";

/** Shows a short note only if the free server is asleep and takes more than a few seconds to answer. */
export default function WakeNotice() {
  const [state, setState] = useState<"checking" | "slow" | "ready">("checking");

  useEffect(() => {
    const timer = setTimeout(() => setState((s) => (s === "checking" ? "slow" : s)), 3000);
    wakeApi().then(() => setState("ready"));
    return () => clearTimeout(timer);
  }, []);

  if (state !== "slow") return null;
  return (
    <p role="status" className="wake-notice">
      Waking up the server. On the free plan this can take up to a minute after a quiet spell.
    </p>
  );
}
