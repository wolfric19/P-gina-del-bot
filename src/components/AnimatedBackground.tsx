import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#07080c] select-none">
      {/* Top Ambient Light Cones - Optimized with soft radial gradients instead of heavy GPU blurs */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-60 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 40%, transparent 75%)',
        }}
      />
      <div
        className="absolute top-1/4 -left-32 w-[550px] h-[550px] opacity-40 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[550px] h-[550px] opacity-35 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(circle at 60% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 65%)',
        }}
      />

      {/* Subtle Precision Cyber Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 30%, #000 35%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, #000 35%, transparent 85%)',
        }}
      />

      {/* Subtle Vignette Edge Mask */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07080c]/90 pointer-events-none" />
    </div>
  );
}
