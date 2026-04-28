"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { TAB_BAR_HEIGHT } from "@/components/ui/mobile-tab-bar";

type SnapState = "closed" | "peek" | "expanded";

const PEEK_VISIBLE = 110; // px visible above the tab bar in peek mode

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  peekContent: React.ReactNode;
  children: React.ReactNode;
  bottomOffset?: number;
  onSnapChange?: (snap: SnapState) => void;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  peekContent,
  children,
  bottomOffset = TAB_BAR_HEIGHT,
  onSnapChange,
}: MobileBottomSheetProps) {
  const [snap, setSnap] = useState<SnapState>("closed");
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const startYRef = useRef(0);
  const startSnapRef = useRef<SnapState>("closed");
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSnap(isOpen ? "peek" : "closed");
  }, [isOpen]);

  // Notify parent whenever snap state changes
  useEffect(() => {
    onSnapChange?.(snap);
  }, [snap, onSnapChange]);

  // Native non-passive touchmove listener: allows e.preventDefault() to actually work
  // during an active drag, blocking the browser's default scroll/pan behavior.
  // React's synthetic onTouchMove is passive and silently ignores preventDefault().
  // Note: no touchstart stopPropagation here — that would break React's synthetic
  // event system since React 17+ dispatches from the root, above sheetRef.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const snapToTranslate = useCallback((s: SnapState): number => {
    const sheetH = sheetRef.current?.offsetHeight ?? 500;
    switch (s) {
      case "closed":   return sheetH;
      case "peek":     return sheetH - PEEK_VISIBLE;
      case "expanded": return 0;
    }
  }, []);

  // ── Shared drag logic ──────────────────────────────────────────────────────
  const beginDrag = (clientY: number) => {
    isDragging.current = true;
    startYRef.current = clientY;
    startSnapRef.current = snap;
  };

  const moveDrag = (clientY: number) => {
    if (!isDragging.current) return;
    const delta = clientY - startYRef.current;
    // Cap upward travel so the sheet can reach expanded (translateY=0) but not overshoot
    const startBase = snapToTranslate(startSnapRef.current);
    setDragOffset(Math.max(-startBase, delta));
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragOffset < -60) {
      setSnap("expanded");
    } else if (dragOffset > 80) {
      if (startSnapRef.current === "expanded") {
        setSnap("peek");
      } else {
        setSnap("closed");
        onClose();
      }
    }
    setDragOffset(0);
  };

  // ── Handle-bar touch handlers (always active) ──────────────────────────────
  const onHandleTouchStart = (e: React.TouchEvent) => {
    beginDrag(e.touches[0].clientY);
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    moveDrag(e.touches[0].clientY);
  };
  const onHandleTouchEnd = () => endDrag();

  // ── Scrollable-body touch handlers ────────────────────────────────────────
  // Only hijack the touch when the body is already scrolled to the top AND
  // the user is dragging downward — otherwise let normal scroll happen.
  const bodyDragActive = useRef(false);

  const onBodyTouchStart = (e: React.TouchEvent) => {
    bodyDragActive.current = false;
    startYRef.current = e.touches[0].clientY;
    startSnapRef.current = snap;
  };

  const onBodyTouchMove = (e: React.TouchEvent) => {
    const scrollEl = scrollBodyRef.current;
    if (!scrollEl) return;

    const delta = e.touches[0].clientY - startYRef.current;
    const atTop = scrollEl.scrollTop <= 0;

    // Start hijacking once we know it's a downward drag from the top
    if (!bodyDragActive.current) {
      if (atTop && delta > 5) {
        bodyDragActive.current = true;
        isDragging.current = true;
      } else {
        return; // let normal scroll handle it
      }
    }

    if (bodyDragActive.current) {
      moveDrag(e.touches[0].clientY);
    }
  };

  const onBodyTouchEnd = () => {
    if (bodyDragActive.current) {
      bodyDragActive.current = false;
      endDrag();
    }
  };

  // ── Derived transform ──────────────────────────────────────────────────────
  const baseTranslate = snapToTranslate(snap);
  const totalTranslate = snap === "closed" ? baseTranslate : baseTranslate + dragOffset;
  const isAnimating = dragOffset === 0;

  return (
    <>
      {snap === "expanded" && (
        <div
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          style={{ bottom: bottomOffset }}
          onClick={() => setSnap("peek")}
        />
      )}

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
      >
        {/* ── Handle bar — touch here always drags the sheet ─────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "none" }}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onClick={() => {
            if (Math.abs(dragOffset) < 5)
              setSnap((s) => (s === "peek" ? "expanded" : "peek"));
          }}
        >
          <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200" />
          <div className="flex-1 pt-1">{peekContent}</div>
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

        {/* ── Scrollable body — drags sheet when already at scroll top ───── */}
        <div
          ref={scrollBodyRef}
          className="flex-1 overflow-y-auto px-4 pb-6 pt-1"
          style={{ touchAction: "pan-y" }}
          onTouchStart={onBodyTouchStart}
          onTouchMove={onBodyTouchMove}
          onTouchEnd={onBodyTouchEnd}
        >
          {children}
        </div>
      </div>
    </>
  );
}
