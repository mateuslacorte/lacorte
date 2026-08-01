'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface RouletteItem {
  id: string;
  text: string;
  color: string;
}

export interface RouletteWheelHandle {
  spin: () => void;
}

interface RouletteWheelProps {
  items: RouletteItem[];
  onSpinEnd?: (winner: RouletteItem) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  size?: number;
}

const SPIN_DURATION = 5000;
const MIN_ROTATIONS = 5;
const MAX_ROTATIONS = 8;

const RouletteWheel = forwardRef<RouletteWheelHandle, RouletteWheelProps>(function RouletteWheel({
  items,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
  size = 320,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const segmentAngle = (2 * Math.PI) / items.length;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Save state and rotate
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw segments
    items.forEach((item, index) => {
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Truncate long text
      let text = item.text;
      if (text.length > 12) {
        text = text.substring(0, 10) + '...';
      }

      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(text, radius - 20, 0);
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    ctx.restore();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw center emoji
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', centerX, centerY);
  }, [items, rotation, size]);

  // Spin function
  const spin = useCallback(() => {
    if (isSpinning || items.length < 2) return;

    setIsSpinning(true);

    const rotations = MIN_ROTATIONS + Math.random() * (MAX_ROTATIONS - MIN_ROTATIONS);
    const extraDegrees = Math.random() * 360;
    const targetRotation = rotationRef.current + rotations * 360 + extraDegrees;

    const startTime = Date.now();
    const startRotation = rotationRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + (targetRotation - startRotation) * eased;
      rotationRef.current = currentRotation;
      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Calculate winner
        const normalizedRotation = ((currentRotation % 360) + 360) % 360;
        const segmentAngle = 360 / items.length;
        // Pointer is at top (0 degrees), wheel rotates clockwise
        const winningIndex = Math.floor(((360 - normalizedRotation + segmentAngle / 2) % 360) / segmentAngle) % items.length;

        setIsSpinning(false);
        if (onSpinEnd) {
          onSpinEnd(items[winningIndex]);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, items, onSpinEnd, setIsSpinning]);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  return (
    <div className="relative inline-block">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div
          className="w-0 h-0 drop-shadow-lg"
          style={{
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '30px solid #ef4444',
          }}
        />
      </div>

      {/* Wheel */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onClick={spin}
        className={`cursor-pointer ${isSpinning ? 'pointer-events-none' : ''}`}
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
        }}
      />
    </div>
  );
});

export default RouletteWheel;
