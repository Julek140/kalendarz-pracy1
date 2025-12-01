import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus, Factory, Package } from "lucide-react";
import { format, parseISO, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { pl } from "date-fns/locale";

const MONTHS = [
  { value: "01", label: "Styczeń" },
  { value: "02", label: "Luty" },
  { value: "03", label: "Marzec" },
  { value: "04", label: "Kwiecień" },
  { value: "05", label: "Maj" },
  { value: "06", label: "Czerwiec" },
  { value: "07", label: "Lipiec" },
  { value: "08", label: "Sierpień" },
  { value: "09", label: "Wrzesień" },
  { value: "10", label: "Październik" },
  { value: "11", label: "Listopad" },
  { value: "12", label: "Grudzień" },
];

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

export default function ReportComparison({ workDays, holidays, polishHolidays }) {
  const [month1, setMonth1] = useState("");
  const [year1, setYear1] = useState("2025");
  const [month2, setMonth2] = useState("");
  const [year2, setYear2] = useState("2025");
  const [comparisonData, setComparisonData] = useState(null);

  const allHolidays = useMemo(() => [
    ...polishHolidays,
    ...(holidays || []).filter(h => h.is_work_free).map(h => ({ date: h.date, name: h.name }))
  ], [holidays, polishHolidays]);

  const calculateMonthStats = (month, year) => {
    const start = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
    const end = endOfMonth(start);
    const allDaysInMonth = eachDayOfInterval({ start, end });

    const monthDays = workDays.filter(wd => {
      const date = parseISO(wd.date);
      return date >= start && date <= end;
    });

    // Dostępne dni robocze Pn-Pt bez świąt
    const availableWeekdays = allDaysInMonth.filter(day => {
      const dayOfWeek = getDay(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWeekdayDate = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isHoliday = allHolidays.some(h => h.date === dateStr);
      return isWeekdayDate && !isHoliday;
    }).length;

    // Dostępne soboty bez świąt
    const availableSaturdays = allDaysInMonth.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isHoliday = allHolidays.some(h => h.date === dateStr);
      return getDay(day) === 6 && !isHoliday;
    }).length;

    const totalAvailableShifts = availableWeekdays * 3;

    const calculateDeptStats = (department) => {
      const deptDays = monthDays.filter(wd => 
        wd.department === department || wd.department === "OBA_DZIALY"
      );

      const regularDays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return !isWeekend(date) && !allHolidays.some(h => h.date === wd.date) && !wd.is_downtime;
      }).length;

      const overtimeDays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return (isWeekend(date) || allHolidays.some(h => h.date === wd.date)) && !wd.is_downtime;
      }).length;

      const downtimeDays = deptDays.filter(wd => wd.is_downtime).length;

      const usedSaturdays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isHoliday = allHolidays.some(h => h.date === dateStr);
        return getDay(date) === 6 && !wd.is_downtime && !isHoliday;
      }).length;

      const regularShifts = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return !isWeekend(date) && !allHolidays.some(h => h.date === wd.date) && !wd.is_downtime;
      }).reduce((sum, wd) => sum + (wd.shifts || 0), 0);

      const overtimeShifts = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return (isWeekend(date) || allHolidays.some(h => h.date === wd.date)) && !wd.is_downtime;
      }).reduce((sum, wd) => sum + (wd.shifts || 0), 0);

      return {
        totalWorkDays: regularDays + overtimeDays,
        regularDays,
        overtimeDays,
        downtimeDays,
        usedSaturdays,
        totalShifts: regularShifts + overtimeShifts,
        regularShifts,
        overtimeShifts,
      };
    };

    return {
      month,
      year,
      label: `${MONTHS.find(m => m.value === month)?.label} ${year}`,
      availableWeekdays,
      availableSaturdays,
      totalAvailableShifts,
      maszynownia: calculateDeptStats("MASZYNOWNIA"),
      pakownia: calculateDeptStats("PAKOWNIA"),
    };
  };

  const generateComparison = () => {
    if (!month1 || !month2) return;

    const stats1 = calculateMonthStats(month1, year1);
    const stats2 = calculateMonthStats(month2, year2);

    setComparisonData({ month1: stats1, month2: stats2 });
  };

  const renderDiff = (val1, val2, suffix = "") => {
    const diff = val2 - val1;
    if (diff === 0) return <span className="text-slate-500 flex items-center gap-1"><Minus className="w-4 h-4" /> 0{suffix}</span>;
    if (diff > 0) return <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +{diff}{suffix}</span>;
    return <span className="text-red-600 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> {diff}{suffix}</span>;
  };

  const renderPercentDiff = (val1, val2, available) => {
    const percent1 = available > 0 ? (val1 / available * 100) : 0;
    const percent2 = available > 0 ? (val2 / available * 100) : 0;
    const diff = percent2 - percent1;
    if (Math.abs(diff) < 0.1) return <span className="text-slate-500">bez zmian</span>;
    if (diff > 0) return <span className="text-green-600">+{diff.toFixed(1)}%</span>;
    return <span className="text-red-600">{diff.toFixed(1)}%</span>;
  };

  return (
    <Card className="mb-6 shadow-lg border-none print:hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-purple-600" />
          Porównanie miesięcy
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Selektory */}
        <div className="grid md:grid-cols-5 gap-4 items-end mb-6">
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">Miesiąc 1</p>
            <Select value={month1} onValueChange={setMonth1}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz miesiąc" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">Rok</p>
            <Select value={year1} onValueChange={setYear1}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-slate-400" />
          </div>

          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">Miesiąc 2</p>
            <Select value={month2} onValueChange={setMonth2}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz miesiąc" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">Rok</p>
            <Select value={year2} onValueChange={setYear2}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateComparison}
          disabled={!month1 || !month2}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mb-6"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Porównaj miesiące
        </Button>

        {/* Wyniki porównania */}
        {comparisonData && (
          <div className="space-y-6">
            {/* Nagłówek porównania */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-purple-100 rounded-xl p-4">
                <p className="text-lg font-bold text-purple-800">{comparisonData.month1.label}</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-slate-400">vs</span>
              </div>
              <div className="bg-pink-100 rounded-xl p-4">
                <p className="text-lg font-bold text-pink-800">{comparisonData.month2.label}</p>
              </div>
            </div>

            {/* Dostępne zasoby */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-3">Dostępne zasoby</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-slate-600">Metryka</div>
                <div className="text-center text-purple-700">{comparisonData.month1.label}</div>
                <div className="text-center text-pink-700">{comparisonData.month2.label}</div>
                <div className="text-center text-slate-600">Różnica</div>

                <div>Dni robocze (Pn-Pt)</div>
                <div className="text-center font-semibold">{comparisonData.month1.availableWeekdays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.availableWeekdays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.availableWeekdays, comparisonData.month2.availableWeekdays)}</div>

                <div>Soboty</div>
                <div className="text-center font-semibold">{comparisonData.month1.availableSaturdays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.availableSaturdays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.availableSaturdays, comparisonData.month2.availableSaturdays)}</div>

                <div>Dostępne zmiany</div>
                <div className="text-center font-semibold">{comparisonData.month1.totalAvailableShifts}</div>
                <div className="text-center font-semibold">{comparisonData.month2.totalAvailableShifts}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.totalAvailableShifts, comparisonData.month2.totalAvailableShifts)}</div>
              </div>
            </div>

            {/* Maszynownia */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Factory className="w-5 h-5" /> Maszynownia
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-slate-600">Metryka</div>
                <div className="text-center text-purple-700">{comparisonData.month1.label}</div>
                <div className="text-center text-pink-700">{comparisonData.month2.label}</div>
                <div className="text-center text-slate-600">Różnica</div>

                <div>Dni pracy</div>
                <div className="text-center font-semibold">{comparisonData.month1.maszynownia.totalWorkDays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.maszynownia.totalWorkDays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.maszynownia.totalWorkDays, comparisonData.month2.maszynownia.totalWorkDays)}</div>

                <div>Dni robocze (Pn-Pt)</div>
                <div className="text-center font-semibold">{comparisonData.month1.maszynownia.regularDays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.maszynownia.regularDays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.maszynownia.regularDays, comparisonData.month2.maszynownia.regularDays)}</div>

                <div>Soboty (nadgodziny)</div>
                <div className="text-center font-semibold">{comparisonData.month1.maszynownia.usedSaturdays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.maszynownia.usedSaturdays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.maszynownia.usedSaturdays, comparisonData.month2.maszynownia.usedSaturdays)}</div>

                <div>Zmiany ogółem</div>
                <div className="text-center font-semibold">{comparisonData.month1.maszynownia.totalShifts}</div>
                <div className="text-center font-semibold">{comparisonData.month2.maszynownia.totalShifts}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.maszynownia.totalShifts, comparisonData.month2.maszynownia.totalShifts)}</div>

                <div>Przestoje</div>
                <div className="text-center font-semibold">{comparisonData.month1.maszynownia.downtimeDays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.maszynownia.downtimeDays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.maszynownia.downtimeDays, comparisonData.month2.maszynownia.downtimeDays)}</div>
              </div>
            </div>

            {/* Pakownia */}
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" /> Pakownia
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-slate-600">Metryka</div>
                <div className="text-center text-purple-700">{comparisonData.month1.label}</div>
                <div className="text-center text-pink-700">{comparisonData.month2.label}</div>
                <div className="text-center text-slate-600">Różnica</div>

                <div>Dni pracy</div>
                <div className="text-center font-semibold">{comparisonData.month1.pakownia.totalWorkDays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.pakownia.totalWorkDays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.pakownia.totalWorkDays, comparisonData.month2.pakownia.totalWorkDays)}</div>

                <div>Dni robocze (Pn-Pt)</div>
                <div className="text-center font-semibold">{comparisonData.month1.pakownia.regularDays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.pakownia.regularDays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.pakownia.regularDays, comparisonData.month2.pakownia.regularDays)}</div>

                <div>Soboty (nadgodziny)</div>
                <div className="text-center font-semibold">{comparisonData.month1.pakownia.usedSaturdays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.pakownia.usedSaturdays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.pakownia.usedSaturdays, comparisonData.month2.pakownia.usedSaturdays)}</div>

                <div>Zmiany ogółem</div>
                <div className="text-center font-semibold">{comparisonData.month1.pakownia.totalShifts}</div>
                <div className="text-center font-semibold">{comparisonData.month2.pakownia.totalShifts}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.pakownia.totalShifts, comparisonData.month2.pakownia.totalShifts)}</div>

                <div>Przestoje</div>
                <div className="text-center font-semibold">{comparisonData.month1.pakownia.downtimeDays}</div>
                <div className="text-center font-semibold">{comparisonData.month2.pakownia.downtimeDays}</div>
                <div className="text-center">{renderDiff(comparisonData.month1.pakownia.downtimeDays, comparisonData.month2.pakownia.downtimeDays)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}