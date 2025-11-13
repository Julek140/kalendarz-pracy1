import React from "react";
import { Card } from "@/components/ui/card";
import { format, isSameMonth, isWeekend } from "date-fns";
import { pl } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

export default function CalendarGrid({
  calendarDays,
  currentMonth,
  getWorkDayForDate,
  getHolidayForDate,
  onDayClick,
  isLoading,
}) {
  const getDayStyle = (day) => {
    const workDay = getWorkDayForDate(day);
    const holiday = getHolidayForDate(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isWeekendDay = isWeekend(day);

    if (!isCurrentMonth) return "bg-slate-50 text-slate-400";
    if (holiday) return "bg-red-50 border-2 border-red-300 text-red-900 font-semibold";
    if (workDay?.is_downtime) return "bg-gray-200 text-gray-600 border-2 border-gray-400";
    
    if (workDay) {
      if (workDay.department === "MASZYNOWNIA") return "bg-blue-100 border-2 border-blue-500 text-blue-900 font-semibold";
      if (workDay.department === "PAKOWNIA") return "bg-green-100 border-2 border-green-500 text-green-900 font-semibold";
      if (workDay.department === "OBA_DZIALY") return "bg-purple-100 border-2 border-purple-500 text-purple-900 font-semibold";
    }

    if (isWeekendDay) return "bg-orange-50 text-slate-700";
    return "bg-white hover:bg-slate-50 text-slate-900";
  };

  const getDayBadge = (day) => {
    const workDay = getWorkDayForDate(day);
    const holiday = getHolidayForDate(day);

    if (holiday) return <div className="text-xs mt-1 font-medium">🎉 {holiday.name}</div>;
    if (workDay?.is_downtime) return <div className="text-xs mt-1">⏸️ Przestój</div>;
    if (workDay) {
      if (workDay.department === "MASZYNOWNIA") return <div className="text-xs mt-1">🏭 Maszynownia</div>;
      if (workDay.department === "PAKOWNIA") return <div className="text-xs mt-1">📦 Pakownia</div>;
      if (workDay.department === "OBA_DZIALY") return <div className="text-xs mt-1">🏭📦 Oba działy</div>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg">
        <div className="grid grid-cols-7 gap-2">
          {Array(35).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg border-none bg-white">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-bold text-slate-700 text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => onDayClick(day)}
            className={`
              min-h-[100px] p-3 rounded-xl transition-all duration-200
              hover:shadow-md hover:scale-105 border
              ${getDayStyle(day)}
            `}
          >
            <div className="text-lg font-bold mb-1">
              {format(day, 'd')}
            </div>
            {getDayBadge(day)}
          </button>
        ))}
      </div>
    </Card>
  );
}