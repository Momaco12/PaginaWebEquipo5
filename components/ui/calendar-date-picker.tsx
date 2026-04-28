"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, X } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toDate, formatInTimeZone } from "date-fns-tz";
import { DateRange } from "react-day-picker";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const hours12 = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const ampm = ["AM", "PM"];

const multiSelectVariants = cva(
  "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground text-background",
        link: "text-primary underline-offset-4 hover:underline text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CalendarDatePickerProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  id?: string;
  className?: string;
  date: DateRange;
  closeOnSelect?: boolean;
  numberOfMonths?: 1 | 2;
  yearsRange?: number;
  onDateSelect: (range: { from: Date; to: Date }) => void;
}

export const CalendarDatePicker = React.forwardRef<
  HTMLButtonElement,
  CalendarDatePickerProps
>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      closeOnSelect = false,
      numberOfMonths = 2,
      yearsRange = 10,
      onDateSelect,
      variant,
      ...props
    },
    ref
  ) => {
    // ── Desktop state ─────────────────────────────────────────────────────────
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      numberOfMonths === 2 ? "This Year" : "Today"
    );
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(date?.from);
    const [yearFrom, setYearFrom] = React.useState<number | undefined>(date?.from?.getFullYear());
    const [monthTo, setMonthTo] = React.useState<Date | undefined>(
      numberOfMonths === 2 ? date?.to : date?.from
    );
    const [yearTo, setYearTo] = React.useState<number | undefined>(
      numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear()
    );
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(null);

    // ── Mobile state ──────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = React.useState(false);
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);
    const [pendingDate, setPendingDate] = React.useState<DateRange>(date);

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatWithTz = (d: Date, fmt: string) => formatInTimeZone(d, timeZone, fmt);

    React.useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 768);
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);

    React.useEffect(() => {
      if (!isMobileOpen) return;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }, [isMobileOpen]);

    // ── Desktop handlers ──────────────────────────────────────────────────────
    const handleClose = () => setIsPopoverOpen(false);
    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const selectDateRange = (from: Date, to: Date, range: string) => {
      const startDate = startOfDay(toDate(from, { timeZone }));
      const endDate =
        numberOfMonths === 2 ? endOfDay(toDate(to, { timeZone })) : startDate;
      onDateSelect({ from: startDate, to: endDate });
      setSelectedRange(range);
      setMonthFrom(from);
      setYearFrom(from.getFullYear());
      setMonthTo(to);
      setYearTo(to.getFullYear());
      closeOnSelect && setIsPopoverOpen(false);
    };

    const handleDateSelect = (range: DateRange | undefined) => {
      if (range) {
        let from = toDate(range.from as Date, { timeZone });
        if (date?.from) {
          from.setHours(date.from.getHours(), date.from.getMinutes(), 0, 0);
        } else {
          from = startOfDay(from);
        }

        let to = range.to ? toDate(range.to, { timeZone }) : from;
        if (range.to) {
          if (date?.to) {
            to.setHours(date.to.getHours(), date.to.getMinutes(), 59, 999);
          } else {
            to = endOfDay(to);
          }
        }

        if (numberOfMonths === 1) {
          if (range.from !== date.from) {
            to = from;
          } else {
            from = toDate(range.to as Date, { timeZone });
            if (date?.from) {
              from.setHours(date.from.getHours(), date.from.getMinutes(), 0, 0);
            } else {
              from = startOfDay(from);
            }
          }
        }

        onDateSelect({ from, to });
        setMonthFrom(from);
        setYearFrom(from.getFullYear());
        setMonthTo(to);
        setYearTo(to.getFullYear());
      }
      setSelectedRange(null);
    };

    const handleMonthChange = (newMonthIndex: number, part: string) => {
      setSelectedRange(null);
      if (part === "from") {
        if (yearFrom !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return;
          const newMonth = new Date(yearFrom, newMonthIndex, 1);
          const from =
            numberOfMonths === 2
              ? startOfMonth(toDate(newMonth, { timeZone }))
              : date?.from
              ? new Date(date.from.getFullYear(), newMonth.getMonth(), date.from.getDate())
              : newMonth;
          const to =
            numberOfMonths === 2
              ? date.to
                ? endOfDay(toDate(date.to, { timeZone }))
                : endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setMonthFrom(newMonth);
            setMonthTo(date.to);
          }
        }
      } else {
        if (yearTo !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return;
          const newMonth = new Date(yearTo, newMonthIndex, 1);
          const from = date.from
            ? startOfDay(toDate(date.from, { timeZone }))
            : startOfMonth(toDate(newMonth, { timeZone }));
          const to =
            numberOfMonths === 2
              ? endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setMonthTo(newMonth);
            setMonthFrom(date.from);
          }
        }
      }
    };

    const handleYearChange = (newYear: number, part: string) => {
      setSelectedRange(null);
      if (part === "from") {
        if (years.includes(newYear)) {
          const newMonth = monthFrom
            ? new Date(newYear, monthFrom.getMonth(), 1)
            : new Date(newYear, 0, 1);
          const from =
            numberOfMonths === 2
              ? startOfMonth(toDate(newMonth, { timeZone }))
              : date.from
              ? new Date(newYear, newMonth.getMonth(), date.from.getDate())
              : newMonth;
          const to =
            numberOfMonths === 2
              ? date.to
                ? endOfDay(toDate(date.to, { timeZone }))
                : endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setYearFrom(newYear);
            setMonthFrom(newMonth);
            setYearTo(date.to?.getFullYear());
            setMonthTo(date.to);
          }
        }
      } else {
        if (years.includes(newYear)) {
          const newMonth = monthTo
            ? new Date(newYear, monthTo.getMonth(), 1)
            : new Date(newYear, 0, 1);
          const from = date.from
            ? startOfDay(toDate(date.from, { timeZone }))
            : startOfMonth(toDate(newMonth, { timeZone }));
          const to =
            numberOfMonths === 2
              ? endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setYearTo(newYear);
            setMonthTo(newMonth);
            setYearFrom(date.from?.getFullYear());
            setMonthFrom(date.from);
          }
        }
      }
    };

    const today = new Date();

    const years = Array.from(
      { length: yearsRange + 1 },
      (_, i) => today.getFullYear() - yearsRange / 2 + i
    );

    const dateRanges = [
      { label: "Today", start: today, end: today },
      { label: "Yesterday", start: subDays(today, 1), end: subDays(today, 1) },
      {
        label: "This Week",
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      },
      {
        label: "Last Week",
        start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
        end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7),
      },
      { label: "Last 7 Days", start: subDays(today, 6), end: today },
      { label: "This Month", start: startOfMonth(today), end: endOfMonth(today) },
      {
        label: "Last Month",
        start: startOfMonth(subDays(today, today.getDate())),
        end: endOfMonth(subDays(today, today.getDate())),
      },
      { label: "This Year", start: startOfYear(today), end: endOfYear(today) },
      {
        label: "Last Year",
        start: startOfYear(subDays(today, 365)),
        end: endOfYear(subDays(today, 365)),
      },
    ];

    const handleMouseOver = (part: string) => setHighlightedPart(part);
    const handleMouseLeave = () => setHighlightedPart(null);

    const handleWheel = (event: React.WheelEvent, part: string) => {
      event.preventDefault();
      setSelectedRange(null);
      if (highlightedPart === "firstDay") {
        const newDate = new Date(date.from as Date);
        const increment = event.deltaY > 0 ? -1 : 1;
        newDate.setDate(newDate.getDate() + increment);
        if (newDate <= (date.to as Date)) {
          numberOfMonths === 2
            ? onDateSelect({ from: newDate, to: new Date(date.to as Date) })
            : onDateSelect({ from: newDate, to: newDate });
          setMonthFrom(newDate);
        } else if (newDate > (date.to as Date) && numberOfMonths === 1) {
          onDateSelect({ from: newDate, to: newDate });
          setMonthFrom(newDate);
        }
      } else if (highlightedPart === "firstMonth") {
        const currentMonth = monthFrom ? monthFrom.getMonth() : 0;
        handleMonthChange(currentMonth + (event.deltaY > 0 ? -1 : 1), "from");
      } else if (highlightedPart === "firstYear" && yearFrom !== undefined) {
        handleYearChange(yearFrom + (event.deltaY > 0 ? -1 : 1), "from");
      } else if (highlightedPart === "secondDay") {
        const newDate = new Date(date.to as Date);
        const increment = event.deltaY > 0 ? -1 : 1;
        newDate.setDate(newDate.getDate() + increment);
        if (newDate >= (date.from as Date)) {
          onDateSelect({ from: new Date(date.from as Date), to: newDate });
          setMonthTo(newDate);
        }
      } else if (highlightedPart === "secondMonth") {
        const currentMonth = monthTo ? monthTo.getMonth() : 0;
        handleMonthChange(currentMonth + (event.deltaY > 0 ? -1 : 1), "to");
      } else if (highlightedPart === "secondYear" && yearTo !== undefined) {
        handleYearChange(yearTo + (event.deltaY > 0 ? -1 : 1), "to");
      }
    };

    React.useEffect(() => {
      const ids = [
        `firstDay-${id}`, `firstMonth-${id}`, `firstYear-${id}`,
        `secondDay-${id}`, `secondMonth-${id}`, `secondYear-${id}`,
      ];
      const elements = ids.map((eid) => document.getElementById(eid));

      const addListener = (el: HTMLElement | null) => {
        el?.addEventListener("wheel", handleWheel as unknown as EventListener, { passive: false });
      };
      elements.forEach(addListener);

      return () => {
        elements.forEach((el) => {
          el?.removeEventListener("wheel", handleWheel as unknown as EventListener);
        });
      };
    }, [highlightedPart, date]);

    // ── Mobile handlers ───────────────────────────────────────────────────────
    const handleMobileOpen = () => {
      setPendingDate(date);
      setIsMobileOpen(true);
    };

    const handleMobileApply = () => {
      if (pendingDate?.from) {
        onDateSelect({ from: pendingDate.from, to: pendingDate.to ?? pendingDate.from });
      }
      setIsMobileOpen(false);
    };

    const handleMobileDateSelect = (range: DateRange | undefined) => {
      if (!range?.from) return;
      let from = toDate(range.from, { timeZone });
      if (pendingDate?.from) {
        from.setHours(pendingDate.from.getHours(), pendingDate.from.getMinutes(), 0, 0);
      } else {
        from = startOfDay(from);
      }
      let to = range.to ? toDate(range.to, { timeZone }) : from;
      if (range.to && pendingDate?.to) {
        to.setHours(pendingDate.to.getHours(), pendingDate.to.getMinutes(), 59, 999);
      } else if (range.to) {
        to = endOfDay(to);
      }
      setPendingDate({ from, to });
    };

    // ── Mobile time picker helpers ────────────────────────────────────────────
    const MobileTimePicker = ({
      label,
      value,
      onHourChange,
      onMinuteChange,
      onAmPmChange,
    }: {
      label: string;
      value: Date;
      onHourChange: (h: string) => void;
      onMinuteChange: (m: string) => void;
      onAmPmChange: (p: string) => void;
    }) => (
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-xs font-semibold uppercase text-slate-500">{label}</span>
        <Select
          value={((value.getHours() % 12) || 12).toString().padStart(2, "0")}
          onValueChange={onHourChange}
        >
          <SelectTrigger className="h-10 flex-1 text-sm focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[200px] z-[300]">
            {hours12.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-slate-400 font-bold text-sm">:</span>
        <Select
          value={value.getMinutes().toString().padStart(2, "0")}
          onValueChange={onMinuteChange}
        >
          <SelectTrigger className="h-10 flex-1 text-sm focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[200px] z-[300]">
            {minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={value.getHours() >= 12 ? "PM" : "AM"}
          onValueChange={onAmPmChange}
        >
          <SelectTrigger className="h-10 w-[72px] text-sm focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[300]">
            {ampm.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );

    // ── Mobile overlay ────────────────────────────────────────────────────────
    const mobileOverlay =
      isMobileOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex flex-col bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 shrink-0">
                <h2 className="text-base font-semibold text-slate-900">Seleccionar período</h2>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick presets — horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto px-4 py-3 shrink-0 border-b border-slate-100 scrollbar-hide">
                {dateRanges.map(({ label, start, end }) => {
                  const isActive =
                    pendingDate?.from?.toDateString() === startOfDay(start).toDateString() &&
                    pendingDate?.to?.toDateString() === endOfDay(end).toDateString();
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setPendingDate({ from: startOfDay(start), to: endOfDay(end) })
                      }
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition",
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable body: calendar only — time pickers moved outside to avoid overflow clipping */}
              <div className="flex-1 overflow-y-auto">
                <Calendar
                  mode="range"
                  defaultMonth={pendingDate?.from ?? new Date()}
                  selected={pendingDate}
                  onSelect={handleMobileDateSelect}
                  numberOfMonths={1}
                  showOutsideDays={false}
                  className="w-full"
                />
              </div>

              {/* Time pickers outside the scroll container so SelectContent is never clipped */}
              {pendingDate?.from && (
                <div className="shrink-0 space-y-3 border-t border-slate-100 px-4 py-4">
                  <MobileTimePicker
                    label="Inicio"
                    value={pendingDate.from}
                    onHourChange={(val) => {
                      const d = new Date(pendingDate.from as Date);
                      const isPM = d.getHours() >= 12;
                      let h = parseInt(val);
                      if (h === 12) h = 0;
                      if (isPM) h += 12;
                      d.setHours(h, d.getMinutes(), 0, 0);
                      setPendingDate({ ...pendingDate, from: d });
                    }}
                    onMinuteChange={(val) => {
                      const d = new Date(pendingDate.from as Date);
                      d.setMinutes(parseInt(val), 0, 0);
                      setPendingDate({ ...pendingDate, from: d });
                    }}
                    onAmPmChange={(val) => {
                      const d = new Date(pendingDate.from as Date);
                      const h = d.getHours();
                      if (val === "AM" && h >= 12) d.setHours(h - 12);
                      if (val === "PM" && h < 12) d.setHours(h + 12);
                      setPendingDate({ ...pendingDate, from: d });
                    }}
                  />
                  {pendingDate?.to && (
                    <MobileTimePicker
                      label="Fin"
                      value={pendingDate.to}
                      onHourChange={(val) => {
                        const d = new Date(pendingDate.to as Date);
                        const isPM = d.getHours() >= 12;
                        let h = parseInt(val);
                        if (h === 12) h = 0;
                        if (isPM) h += 12;
                        d.setHours(h, d.getMinutes(), 59, 999);
                        setPendingDate({ ...pendingDate, to: d });
                      }}
                      onMinuteChange={(val) => {
                        const d = new Date(pendingDate.to as Date);
                        d.setMinutes(parseInt(val), 59, 999);
                        setPendingDate({ ...pendingDate, to: d });
                      }}
                      onAmPmChange={(val) => {
                        const d = new Date(pendingDate.to as Date);
                        const h = d.getHours();
                        if (val === "AM" && h >= 12) d.setHours(h - 12);
                        if (val === "PM" && h < 12) d.setHours(h + 12);
                        setPendingDate({ ...pendingDate, to: d });
                      }}
                    />
                  )}
                </div>
              )}

              {/* Action bar */}
              <div
                className="flex gap-3 px-4 pt-3 pb-4 border-t border-slate-100 shrink-0"
                style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
              >
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMobileApply}
                  className="flex-1 h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Aplicar
                </button>
              </div>
            </div>,
            document.body
          )
        : null;

    // ── Shared trigger label ──────────────────────────────────────────────────
    const triggerLabel = date?.from ? (
      date.to ? (
        `${formatWithTz(date.from, "dd LLL y")} – ${formatWithTz(date.to, "dd LLL y HH:mm")}`
      ) : (
        formatWithTz(date.from, "dd LLL y")
      )
    ) : (
      "Pick a date"
    );

    // ── Desktop trigger label (with hover/wheel spans) ────────────────────────
    const desktopTriggerContent = date?.from ? (
      date.to ? (
        <>
          <span
            id={`firstDay-${id}`}
            className={cn("date-part", highlightedPart === "firstDay" && "underline font-bold")}
            onMouseOver={() => handleMouseOver("firstDay")}
            onMouseLeave={handleMouseLeave}
          >
            {formatWithTz(date.from, "dd")}
          </span>{" "}
          <span
            id={`firstMonth-${id}`}
            className={cn("date-part", highlightedPart === "firstMonth" && "underline font-bold")}
            onMouseOver={() => handleMouseOver("firstMonth")}
            onMouseLeave={handleMouseLeave}
          >
            {formatWithTz(date.from, "LLL")}
          </span>
          ,{" "}
          <span
            id={`firstYear-${id}`}
            className={cn("date-part", highlightedPart === "firstYear" && "underline font-bold")}
            onMouseOver={() => handleMouseOver("firstYear")}
            onMouseLeave={handleMouseLeave}
          >
            {formatWithTz(date.from, "y")}
          </span>
          {numberOfMonths === 2 && (
            <>
              {" - "}
              <span
                id={`secondDay-${id}`}
                className={cn("date-part", highlightedPart === "secondDay" && "underline font-bold")}
                onMouseOver={() => handleMouseOver("secondDay")}
                onMouseLeave={handleMouseLeave}
              >
                {formatWithTz(date.to, "dd")}
              </span>{" "}
              <span
                id={`secondMonth-${id}`}
                className={cn("date-part", highlightedPart === "secondMonth" && "underline font-bold")}
                onMouseOver={() => handleMouseOver("secondMonth")}
                onMouseLeave={handleMouseLeave}
              >
                {formatWithTz(date.to, "LLL")}
              </span>
              ,{" "}
              <span
                id={`secondYear-${id}`}
                className={cn("date-part", highlightedPart === "secondYear" && "underline font-bold")}
                onMouseOver={() => handleMouseOver("secondYear")}
                onMouseLeave={handleMouseLeave}
              >
                {formatWithTz(date.to, "y HH:mm")}
              </span>
            </>
          )}
        </>
      ) : (
        <>
          <span
            id="day"
            className={cn("date-part", highlightedPart === "day" && "underline font-bold")}
            onMouseOver={() => handleMouseOver("day")}
            onMouseLeave={handleMouseLeave}
          >
            {formatWithTz(date.from, "dd")}
          </span>{" "}
          <span
            id="month"
            className={cn("date-part", highlightedPart === "month" && "underline font-bold")}
            onMouseOver={() => handleMouseOver("month")}
            onMouseLeave={handleMouseLeave}
          >
            {formatWithTz(date.from, "LLL")}
          </span>
          ,{" "}
          <span
            id="year"
            className={cn("date-part", highlightedPart === "year" && "underline font-bold")}
            onMouseOver={() => handleMouseOver("year")}
            onMouseLeave={handleMouseLeave}
          >
            {formatWithTz(date.from, "y")}
          </span>
        </>
      )
    ) : (
      <span>Pick a date</span>
    );

    return (
      <>
        <style>{`.date-part { touch-action: none; }`}</style>
        {mobileOverlay}

        {isMobile ? (
          // ── Mobile trigger ──────────────────────────────────────────────────
          <Button
            id="date"
            ref={ref}
            {...props}
            className={cn("w-auto", multiSelectVariants({ variant, className }))}
            onClick={handleMobileOpen}
            suppressHydrationWarning
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{triggerLabel}</span>
          </Button>
        ) : (
          // ── Desktop popover (unchanged) ─────────────────────────────────────
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date"
                ref={ref}
                {...props}
                className={cn("w-auto", multiSelectVariants({ variant, className }))}
                onClick={handleTogglePopover}
                suppressHydrationWarning
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{desktopTriggerContent}</span>
              </Button>
            </PopoverTrigger>
            {isPopoverOpen && (
              <PopoverContent
                className="w-auto"
                align="center"
                avoidCollisions={false}
                onInteractOutside={handleClose}
                onEscapeKeyDown={handleClose}
                style={{
                  maxHeight: "var(--radix-popover-content-available-height)",
                  overflowY: "auto",
                }}
              >
                <div className="flex">
                  {numberOfMonths === 2 && (
                    <div className="hidden md:flex flex-col gap-1 pr-4 text-left border-r border-foreground/10">
                      {dateRanges.map(({ label, start, end }) => (
                        <Button
                          key={label}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "justify-start hover:bg-primary/90 hover:text-background",
                            selectedRange === label &&
                              "bg-primary text-background hover:bg-primary/90 hover:text-background"
                          )}
                          onClick={() => {
                            selectDateRange(start, end, label);
                            setMonthFrom(start);
                            setYearFrom(start.getFullYear());
                            setMonthTo(end);
                            setYearTo(end.getFullYear());
                          }}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 ml-3">
                        <Select
                          onValueChange={(value) => {
                            handleMonthChange(months.indexOf(value), "from");
                            setSelectedRange(null);
                          }}
                          value={monthFrom ? months[monthFrom.getMonth()] : undefined}
                        >
                          <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={month}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          onValueChange={(value) => {
                            handleYearChange(Number(value), "from");
                            setSelectedRange(null);
                          }}
                          value={yearFrom ? yearFrom.toString() : undefined}
                        >
                          <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year, idx) => (
                              <SelectItem key={idx} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {numberOfMonths === 2 && (
                        <div className="flex gap-2">
                          <Select
                            onValueChange={(value) => {
                              handleMonthChange(months.indexOf(value), "to");
                              setSelectedRange(null);
                            }}
                            value={monthTo ? months[monthTo.getMonth()] : undefined}
                          >
                            <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month, idx) => (
                                <SelectItem key={idx} value={month}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            onValueChange={(value) => {
                              handleYearChange(Number(value), "to");
                              setSelectedRange(null);
                            }}
                            value={yearTo ? yearTo.toString() : undefined}
                          >
                            <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year, idx) => (
                                <SelectItem key={idx} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <Calendar
                        mode="range"
                        defaultMonth={monthFrom}
                        month={monthFrom}
                        onMonthChange={setMonthFrom}
                        selected={date}
                        onSelect={handleDateSelect}
                        numberOfMonths={numberOfMonths}
                        showOutsideDays={false}
                      />
                      {date?.from && (
                        <div className="flex items-center gap-2 px-3 pb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] uppercase text-slate-400">Inicio</span>
                            <div className="flex items-center gap-1">
                              <Select
                                value={((date.from.getHours() % 12) || 12).toString().padStart(2, "0")}
                                onValueChange={(value) => {
                                  const newFrom = new Date(date.from as Date);
                                  const isPM = newFrom.getHours() >= 12;
                                  let h = parseInt(value);
                                  if (h === 12) h = 0;
                                  if (isPM) h += 12;
                                  newFrom.setHours(h, newFrom.getMinutes(), 0, 0);
                                  onDateSelect({ from: newFrom, to: date.to ?? newFrom });
                                }}
                              >
                                <SelectTrigger className="w-[55px] h-7 px-2 py-1 text-xs focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                                  <SelectValue placeholder="HH" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="max-h-[160px]">
                                  {hours12.map((hour) => (
                                    <SelectItem key={hour} value={hour} className="text-xs">{hour}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-slate-400 font-bold">:</span>
                              <Select
                                value={date.from.getMinutes().toString().padStart(2, "0")}
                                onValueChange={(value) => {
                                  const newFrom = new Date(date.from as Date);
                                  newFrom.setMinutes(parseInt(value), 0, 0);
                                  onDateSelect({ from: newFrom, to: date.to ?? newFrom });
                                }}
                              >
                                <SelectTrigger className="w-[55px] h-7 px-2 py-1 text-xs focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="max-h-[160px]">
                                  {minutes.map((minute) => (
                                    <SelectItem key={minute} value={minute} className="text-xs">{minute}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={date.from.getHours() >= 12 ? "PM" : "AM"}
                                onValueChange={(value) => {
                                  const newFrom = new Date(date.from as Date);
                                  const currentHour = newFrom.getHours();
                                  if (value === "AM" && currentHour >= 12) newFrom.setHours(currentHour - 12);
                                  if (value === "PM" && currentHour < 12) newFrom.setHours(currentHour + 12);
                                  onDateSelect({ from: newFrom, to: date.to ?? newFrom });
                                }}
                              >
                                <SelectTrigger className="w-[70px] h-7 px-2 py-1 text-xs focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                                  <SelectValue placeholder="AM/PM" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="max-h-[160px]">
                                  {ampm.map((period) => (
                                    <SelectItem key={period} value={period} className="text-xs">{period}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {date?.to && (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[10px] uppercase text-slate-400">Fin</span>
                              <div className="flex items-center gap-1">
                                <Select
                                  value={((date.to.getHours() % 12) || 12).toString().padStart(2, "0")}
                                  onValueChange={(value) => {
                                    const newTo = new Date(date.to as Date);
                                    const isPM = newTo.getHours() >= 12;
                                    let h = parseInt(value);
                                    if (h === 12) h = 0;
                                    if (isPM) h += 12;
                                    newTo.setHours(h, newTo.getMinutes(), 59, 999);
                                    onDateSelect({ from: date.from as Date, to: newTo });
                                  }}
                                >
                                  <SelectTrigger className="w-[55px] h-7 px-2 py-1 text-xs focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                                    <SelectValue placeholder="HH" />
                                  </SelectTrigger>
                                  <SelectContent position="popper" className="max-h-[160px]">
                                    {hours12.map((hour) => (
                                      <SelectItem key={hour} value={hour} className="text-xs">{hour}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-slate-400 font-bold">:</span>
                                <Select
                                  value={date.to.getMinutes().toString().padStart(2, "0")}
                                  onValueChange={(value) => {
                                    const newTo = new Date(date.to as Date);
                                    newTo.setMinutes(parseInt(value), 59, 999);
                                    onDateSelect({ from: date.from as Date, to: newTo });
                                  }}
                                >
                                  <SelectTrigger className="w-[55px] h-7 px-2 py-1 text-xs focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                                    <SelectValue placeholder="MM" />
                                  </SelectTrigger>
                                  <SelectContent position="popper" className="max-h-[160px]">
                                    {minutes.map((minute) => (
                                      <SelectItem key={minute} value={minute} className="text-xs">{minute}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={date.to.getHours() >= 12 ? "PM" : "AM"}
                                  onValueChange={(value) => {
                                    const newTo = new Date(date.to as Date);
                                    const currentHour = newTo.getHours();
                                    if (value === "AM" && currentHour >= 12) newTo.setHours(currentHour - 12);
                                    if (value === "PM" && currentHour < 12) newTo.setHours(currentHour + 12);
                                    onDateSelect({ from: date.from as Date, to: newTo });
                                  }}
                                >
                                  <SelectTrigger className="w-[70px] h-7 px-2 py-1 text-xs focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                                    <SelectValue placeholder="AM/PM" />
                                  </SelectTrigger>
                                  <SelectContent position="popper" className="max-h-[160px]">
                                    {ampm.map((period) => (
                                      <SelectItem key={period} value={period} className="text-xs">{period}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            )}
          </Popover>
        )}
      </>
    );
  }
);

CalendarDatePicker.displayName = "CalendarDatePicker";
