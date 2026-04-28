"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { TAB_BAR_HEIGHT } from "@/components/ui/mobile-tab-bar";

type SnapState = "closed" | "peek" | "expanded";

// Height visible above the tab bar in peek mode
const PEEK_VISIBLE = 110; // px

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  peekContent: React.ReactNode;
  children: React.ReactNode;
  bottomOffset?: number;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  peekContent,
  children,
  bottomOffset = TAB_BAR_HEIGHT,
}: MobileBottomSheetProps) {
  const [snap, setSnap] = useState<SnapState>("closed");
  // Live drag offset in px (positive = dragging down)
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const startYRef = useRef(0);
  const startSnapRef = useRef<SnapState>("closed");
  const sheetRef = useRef<HTMLDivElement>(null);

  // Sync open state → snap
  useEffect(() => {
    setSnap(isOpen ? "peek" : "closed");
  }, [isOpen]);

  // Compute translateY for each snap state
  // Sheet sits above the tab bar: bottom = TAB_BAR_HEIGHT
  const snapToTranslate = useCallback(
    (s: SnapState): number => {
      const sheetH = sheetRef.current?.offsetHeight ?? 500;
      switch (s) {
        case "closed":
          return sheetH; // fully off screen (below tab bar)
        case "peek":
          return sheetH - PEEK_VISIBLE; // only PEEK_VISIBLE px above the tab bar
        case "expanded":
          return 0; // sheet top is at the top of its container
      }
    },
    []
  );

  // ── Touch handlers ──────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startYRef.current = e.touches[0].clientY;
    startSnapRef.current = snap;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    // Allow dragging down freely; cap dragging up at the top of the sheet
    setDragOffset(Math.max(-20, delta));
  };

  const onTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragOffset < -60) {
      // Strong swipe up → expand
      setSnap("expanded");
    } else if (dragOffset > 80) {
      // Strong swipe down
      if (startSnapRef.current === "expanded") {
        setSnap("peek");
      } else {
        setSnap("closed");
        onClose();
      }
    }
    // Otherwise snap back to original position
    setDragOffset(0);
  };

  // ── Derived transform ──────────────────────────────────────────────────────
  const baseTranslate = snapToTranslate(snap);
  const totalTranslate = snap === "closed" ? baseTranslate : baseTranslate + dragOffset;
  const isAnimating = dragOffset === 0; // only animate when not actively dragging

  return (
    <>
      {/* Dim backdrop when expanded */}
      {snap === "expanded" && (
        <div
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          style={{ bottom: bottomOffset }}
          onClick={() => setSnap("peek")}
        />
      )}

      {/* Sheet — sits directly above the tab bar */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 z-40 flex flex-col rounded-t-3xl bg-white shadow-2xl md:hidden"
        style={{
          bottom: bottomOffset,
          height: `calc(100dvh - ${bottomOffset}px)`,
          transform: `translateY(${totalTranslate}px)`,
          transition: isAnimating
            ? "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)"
            : "none",
          willChange: "transform",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Handle bar ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3 cursor-grab active:cursor-grabbing select-none"
          onClick={() => {
            if (Math.abs(dragOffset) < 5)
              setSnap((s) => (s === "peek" ? "expanded" : "peek"));
          }}
        >
          {/* Drag pill */}
          <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200" />

          {/* Peek info — always visible */}
          <div className="flex-1 pt-1">{peekContent}</div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSnap("closed");
              onClose();
            }}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
          {children}
        </div>
      </div>
    </>
  );
}
