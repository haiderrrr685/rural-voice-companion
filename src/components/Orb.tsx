import { motion } from "motion/react";

export function Orb({
  size = 220,
  active = false,
  onClick,
}: {
  size?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Talk to the assistant"
      className="relative grid place-items-center rounded-full outline-none"
      style={{ width: size, height: size }}
      animate={{ scale: active ? [1, 1.06, 1] : [0.98, 1.02, 0.98] }}
      transition={{
        duration: active ? 1.6 : 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileTap={{ scale: 0.94 }}
    >
      <span
        className="absolute inset-[-28%] rounded-full opacity-70 blur-2xl"
        style={{ background: "var(--gradient-halo)" }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "var(--gradient-orb)",
          boxShadow: "var(--shadow-orb)",
        }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-[14%] overflow-visible opacity-80"
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        {[0, 36, 72, 108, 144].map((r, i) => (
          <motion.ellipse
            key={r}
            cx="50"
            cy="50"
            rx="38"
            ry="16"
            fill="none"
            stroke="var(--accent-line)"
            strokeWidth={1.1}
            opacity={0.55 - i * 0.06}
            transform={`rotate(${r} 50 50)`}
            animate={{ ry: [16, 26, 16] }}
            transition={{
              duration: 7 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.svg>
      <span
        className="absolute rounded-full blur-md"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          top: size * 0.16,
          left: size * 0.2,
          background: "var(--gradient-sheen)",
        }}
      />
    </motion.button>
  );
}
