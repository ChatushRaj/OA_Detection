import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { useEffect, useState } from 'react';

// ── Components ──────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const MotionCard = ({ children, delay = 0, className = "", onClick, style }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className={`motion-card ${className}`}
    onClick={onClick}
    style={{ 
      cursor: onClick ? 'pointer' : 'default',
      background: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 20px -10px rgba(0,0,0,0.1)',
      padding: '24px',
      ...style 
    }}
  >
    {children}
  </motion.div>
);

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export const MotionButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = "", 
  style = {},
  id,
  type = "button",
  ...props
}: ButtonProps) => (
  <motion.button
    id={id}
    type={type}
    whileHover={{ scale: disabled ? 1 : 1.01, translateY: -1 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    transition={{ type: "spring", stiffness: 500, damping: 30 }}
    onClick={onClick}
    disabled={disabled}
    className={className}
    style={{
      borderRadius: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      padding: '12px 20px',
      fontWeight: '600',
      fontSize: '0.95rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background 0.2s, box-shadow 0.2s',
      ...style
    }}
    {...props}
  >
    {children}
  </motion.button>
);

/* ── Floating Bubble Shapes (matches mobile AnimatedShapes) ── */
export const AnimatedShapes = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Bubble 1 – top-right, primary-container tint */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'var(--bubble-1, var(--primary-container))',
          top: '-100px',
          right: '-100px',
          opacity: 'var(--bubble-op-1, 0.12)',
        }}
      />

      {/* Bubble 2 – bottom-left, secondary-container tint */}
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'var(--bubble-2, var(--secondary-container))',
          bottom: '-180px',
          left: '-180px',
          opacity: 'var(--bubble-op-2, 0.08)',
        }}
      />

      {/* Bubble 3 – center-right accent, smaller for depth */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -35, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'var(--bubble-3, var(--tertiary-container))',
          top: '40%',
          right: '-60px',
          opacity: 'var(--bubble-op-3, 0.06)',
        }}
      />
    </div>
  );
};

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);
