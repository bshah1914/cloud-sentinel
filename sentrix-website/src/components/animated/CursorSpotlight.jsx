import { useEffect, useState } from 'react';

export default function CursorSpotlight() {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(99, 102, 241, 0.06), transparent 40%)`,
        transition: 'background 0.15s ease',
      }}
    />
  );
}
