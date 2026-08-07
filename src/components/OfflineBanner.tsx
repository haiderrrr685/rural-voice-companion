import { motion, AnimatePresence } from "motion/react";
import { WifiOff } from "lucide-react";
import { useNexusState } from "@/lib/state-engine";

/**
 * Offline banner — shown globally when the device loses connectivity.
 * Clear, plain message per spec: "No internet — try again when connected"
 */
export function OfflineBanner() {
  const { isOnline } = useNexusState();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
        >
          <WifiOff className="size-4" />
          No internet — try again when connected
        </motion.div>
      )}
    </AnimatePresence>
  );
}
