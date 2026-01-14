import React from "react";
import { Card } from "@/components/ui/card";
import { format, isSameMonth, isWeekend, getWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/components/translations";

export default function CalendarGrid({
  calendarDays,
  currentMonth,
  getWorkDayForDate,
  getHolidayForDate,
  onDayClick,
  isLoading,
  language = 'pl',
  locale,
}) {
  const weekDays = language === 'pl' 
    ? ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
    if (workDay?.is_downtime) return <div className="text-xs mt-1">⏸️ {t('downtime', language)}</div>;
    if (workDay) {
      if (workDay.department === "MASZYNOWNIA") return <div className="text-xs mt-1">🏭 {t('maszynownia', language)}</div>;
      if (workDay.department === "PAKOWNIA") return <div className="text-xs mt-1">📦 {t('pakownia', language)}</div>;
      if (workDay.department === "OBA_DZIALY") return <div className="text-xs mt-1">🏭📦 {t('bothDepartments', language)}</div>;
    }
    return null;
  };

  // Grupuj dni według tygodni
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

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
      <div className="grid grid-cols-8 gap-2 mb-4">
        <div className="text-center font-bold text-slate-500 text-xs py-2">{t('week', language)}</div>
        {weekDays.map((day) => (
          <div key={day} className="text-center font-bold text-slate-700 text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      {weeks.map((week, weekIndex) => {
        const weekNumber = getWeek(week[0], { weekStartsOn: 1, locale });
        return (
          <div key={weekIndex} className="grid grid-cols-8 gap-2 mb-2">
            {/* Week number */}
            <div className="flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg font-bold text-slate-600 text-sm">
                {weekNumber}
              </div>
            </div>
            
            {/* Days of the week */}
            {week.map((day, dayIndex) => (
              <button
                key={dayIndex}
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
        );
      })}
    </Card>
  );
}