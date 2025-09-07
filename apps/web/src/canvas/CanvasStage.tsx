import { useEffect, useRef, useCallback } from "react";
import { useViewportStore } from "../store/canvas-store";

interface CanvasStageProps {
  width: number;
  height: number;
}

export function CanvasStage({ width, height }: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const viewport = useViewportStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.fillStyle = "#12151c";
    ctx.fillRect(0, 0, width, height);

    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    const gridSize = 24;
    const startX = Math.floor(-viewport.x / viewport.zoom / gridSize) * gridSize - gridSize * 4;
    const startY = Math.floor(-viewport.y / viewport.zoom / gridSize) * gridSize - gridSize * 4;
    const endX = startX + width / viewport.zoom + gridSize * 8;
    const endY = startY + height / viewport.zoom + gridSize * 8;

    ctx.strokeStyle = "#1e2430";
    ctx.lineWidth = 1 / viewport.zoom;
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.restore();
  }, [height, viewport.x, viewport.y, viewport.zoom, width]);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    viewport.zoomAt(factor, anchorX, anchorY);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    dragging.current = true;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging.current) {
      return;
    }
    const dx = event.clientX - lastPoint.current.x;
    const dy = event.clientY - lastPoint.current.y;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    viewport.panBy(dx, dy);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="canvas-stage"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
