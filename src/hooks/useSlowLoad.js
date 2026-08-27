import { useEffect, useState } from "react";

const DEFAULT_THRESHOLD_MS = 3000;

export default function useSlowLoad(active = true, thresholdMs = DEFAULT_THRESHOLD_MS) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), thresholdMs);
    return () => clearTimeout(timer);
  }, [active, thresholdMs]);

  return slow;
}
