import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarDays, 
  Factory, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  Target
} from "lucide-react";
import { 
  format, 
  parseISO, 
  getDayOfYear, 
  differenceInDays, 
  startOfYear, 
  endOfYear,
  isWeekend,
  eachDayOfInterval,
  getDay
} from "date-fns";

const polishHolidays2025 = [
  "2025-01-01", "2025-01-06", "2025-04-20", "2025-04-21", 
  "2025-05-01", "2025-05-03", "2025-06-08", "2025-06-19", 
  "2025-08-15", "2025-11-01", "2025-11-11", "2025-12-25", "2025-12-26"
];

const polishHolidays2024 = [
  "2024-01-01", "2024-01-06", "2024-03-31", "2024-04-01",
  "2024-05-01", "2024-05-03", "2024-05-19", "2024-05-30",
  "2024-08-15", "2024-11-01", "2024-11-11", "2024-12-25", "2024-12-26"
];

export default function SidebarStats() {
  const { data: workDays = [] } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const stats = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const dayOfYear = getDayOfYear(today);
    const yearStart = startOfYear(today);
    const yearEnd = endOfYear(today);
    const daysInYear = differenceInDays(yearEnd, yearStart) + 1;
    const daysRemaining = daysInYear - dayOfYear;
    const yearProgress = (dayOfYear / daysInYear) * 100;

    // Dni przepracowane w tym roku (do dzisiaj)
    const thisYearDays = workDays.filter(wd => {
      const date = parseISO(wd.date);
      return date.getFullYear() === currentYear && date <= today && !wd.is_downtime;
    });

    const totalWorkDaysThisYear = thisYearDays.length;
    const totalShiftsThisYear = thisYearDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);

    // Porównanie z poprzednim rokiem (ten sam okres)
    const lastYear = currentYear - 1;
    const sameDayLastYear = new Date(lastYear, today.getMonth(), today.getDate());
    
    const lastYearDays = workDays.filter(wd => {
      const date = parseISO(wd.date);
      return date.getFullYear() === lastYear && date <= sameDayLastYear && !wd.is_downtime;
    });

    const totalWorkDaysLastYear = lastYearDays.length;
    const totalShiftsLastYear = lastYearDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);

    // Różnica procentowa
    let percentDiff = 0;
    if (totalShiftsLastYear > 0) {
      percentDiff = ((totalShiftsThisYear - totalShiftsLastYear) / totalShiftsLastYear) * 100;
    }

    // Dostępne dni robocze do końca roku
    const remainingDays = eachDayOfInterval({ start: today, end: yearEnd });
    const holidays = currentYear === 2025 ? polishHolidays2025 : polishHolidays2024;
    const remainingWorkdays = remainingDays.filter(day => {
      const dayOfWeek = getDay(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isHoliday = holidays.includes(dateStr);
      return isWeekday && !isHoliday;
    }).length;

    // Potencjalne zmiany do końca roku
    const potentialShifts = remainingWorkdays * 3;

    return {
      dayOfYear,
      daysInYear,
      daysRemaining,
      yearProgress,
      totalWorkDaysThisYear,
      totalShiftsThisYear,
      totalShiftsLastYear,
      percentDiff,
      remainingWorkdays,
      potentialShifts,
      currentYear,
      lastYear
    };
  }, [workDays]);

  return (
    <div className="border-t border-slate-200 bg-gradient-to-b from-indigo-50/50 to-white p-3">
      <div className="space-y-3">
        {/* Dzień roku */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Dzień roku</span>
              <span className="text-xs font-bold text-indigo-700">
                {stats.dayOfYear} / {stats.daysInYear}
              </span>
            </div>
            <Progress value={stats.yearProgress} className="h-1.5 mt-1" />
          </div>
        </div>

        {/* Przepracowane zmiany */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100">
            <Factory className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Zmiany {stats.currentYear}</span>
              <span className="text-xs font-bold text-emerald-700">
                {stats.totalShiftsThisYear}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {stats.totalWorkDaysThisYear} dni pracy
            </p>
          </div>
        </div>

        {/* Porównanie z poprzednim rokiem */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            stats.percentDiff > 0 ? 'bg-green-100' : 
            stats.percentDiff < 0 ? 'bg-red-100' : 'bg-slate-100'
          }`}>
            {stats.percentDiff > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : stats.percentDiff < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <Minus className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">vs {stats.lastYear}</span>
              <span className={`text-xs font-bold ${
                stats.percentDiff > 0 ? 'text-green-700' : 
                stats.percentDiff < 0 ? 'text-red-700' : 'text-slate-600'
              }`}>
                {stats.percentDiff > 0 ? '+' : ''}{stats.percentDiff.toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {stats.totalShiftsLastYear} zmian w {stats.lastYear}
            </p>
          </div>
        </div>

        {/* Potencjał do końca roku */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100">
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Do końca roku</span>
              <span className="text-xs font-bold text-amber-700">
                {stats.daysRemaining} dni
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {stats.remainingWorkdays} roboczych ({stats.potentialShifts} zmian)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}