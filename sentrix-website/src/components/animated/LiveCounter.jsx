import { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function LiveCounter({ end, duration = 2, prefix = '', suffix = '', decimals = 0, increment = 0 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isInView || hasStarted) return;
    setHasStarted(true);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);
      if (progress >= 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [isInView, end, duration, hasStarted]);

  // Continuous live increment after initial animation
  useEffect(() => {
    if (!hasStarted || !increment) return;
    const liveIv = setInterval(() => {
      setValue(v => v + Math.random() * increment);
    }, 1500);
    return () => clearInterval(liveIv);
  }, [hasStarted, increment]);

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
