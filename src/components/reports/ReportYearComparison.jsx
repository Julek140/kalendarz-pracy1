import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus, Factory, Package, CalendarDays } from "lucide-react";
import { format, parseISO, isWeekend, startOfYear, endOfYear, eachDayOfInterval, getDay } from "date-fns";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

export default function ReportYearComparison({ workDays, holidays, polishHolidays }) {
  const { language } = useLanguage();
  const [year1, setYear1] = useState("2024");
  const [year2, setYear2] = useState("2025");
  const [comparisonData, setComparisonData] = useState(null);

  const allHolidays = useMemo(() => [
    ...polishHolidays,
    ...(holidays || []).filter(h => h.is_work_free).map(h => ({ date: h.date, name: h.name }))
  ], [holidays, polishHolidays]);

  const calculateYearStats = (year) => {
    const start = startOfYear(new Date(parseInt(year), 0));
    const end = endOfYear(start);
    const allDaysInYear = eachDayOfInterval({ start, end });

    const yearDays = workDays.filter(wd => {
      const date = parseISO(wd.date);
      return date >= start && date <= end;
    });

    // Dostępne dni robocze Pn-Pt bez świąt
    const availableWeekdays = allDaysInYear.filter(day => {
      const dayOfWeek = getDay(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWeekdayDate = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isHoliday = allHolidays.some(h => h.date === dateStr);
      return isWeekdayDate && !isHoliday;
    }).length;

    // Dostępne soboty bez świąt
    const availableSaturdays = allDaysInYear.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isHoliday = allHolidays.some(h => h.date === dateStr);
      return getDay(day) === 6 && !isHoliday;
    }).length;

    const totalAvailableShifts = availableWeekdays * 3;

    const calculateDeptStats = (department) => {
      const deptDays = yearDays.filter(wd => 
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
      year,
      label: language === 'pl' ? `Rok ${year}` : `Year ${year}`,
      availableWeekdays,
      availableSaturdays,
      totalAvailableShifts,
      maszynownia: calculateDeptStats("MASZYNOWNIA"),
      pakownia: calculateDeptStats("PAKOWNIA"),
    };
  };

  const generateComparison = () => {
    if (!year1 || !year2) return;

    const stats1 = calculateYearStats(year1);
    const stats2 = calculateYearStats(year2);

    setComparisonData({ year1: stats1, year2: stats2 });
  };

  const renderDiff = (val1, val2) => {
    const diff = val2 - val1;
    if (diff === 0) return <span className="text-slate-500 flex items-center gap-1"><Minus className="w-4 h-4" /> 0</span>;
    if (diff > 0) return <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +{diff}</span>;
    return <span className="text-red-600 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> {diff}</span>;
  };

  return (
    <Card className="mb-6 shadow-lg border-none print:hidden">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-amber-600" />
          {t('yearComparison', language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Selektory */}
        <div className="grid md:grid-cols-3 gap-4 items-end mb-6">
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">{t('year1', language)}</p>
            <Select value={year1} onValueChange={setYear1}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectYear', language)} />
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
            <p className="text-sm font-medium mb-2 text-slate-700">{t('year2', language)}</p>
            <Select value={year2} onValueChange={setYear2}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectYear', language)} />
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
          disabled={!year1 || !year2}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 mb-6"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          {t('compareYears', language)}
        </Button>

        {/* Wyniki porównania */}
        {comparisonData && (
          <div className="space-y-6">
            {/* Nagłówek porównania */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-amber-100 rounded-xl p-4">
                <p className="text-lg font-bold text-amber-800">{comparisonData.year1.label}</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-slate-400">vs</span>
              </div>
              <div className="bg-orange-100 rounded-xl p-4">
                <p className="text-lg font-bold text-orange-800">{comparisonData.year2.label}</p>
              </div>
            </div>

            {/* Dostępne zasoby */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-3">{t('availableResources', language)}</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-slate-600">{t('metric', language)}</div>
                <div className="text-center text-amber-700">{comparisonData.year1.label}</div>
                <div className="text-center text-orange-700">{comparisonData.year2.label}</div>
                <div className="text-center text-slate-600">{t('difference', language)}</div>

                <div>{t('weekdaysMonFri', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.availableWeekdays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.availableWeekdays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.availableWeekdays, comparisonData.year2.availableWeekdays)}</div>

                <div>{t('saturdaysLabel', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.availableSaturdays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.availableSaturdays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.availableSaturdays, comparisonData.year2.availableSaturdays)}</div>

                <div>{t('availableShiftsLabel', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.totalAvailableShifts}</div>
                <div className="text-center font-semibold">{comparisonData.year2.totalAvailableShifts}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.totalAvailableShifts, comparisonData.year2.totalAvailableShifts)}</div>
              </div>
            </div>

            {/* Maszynownia */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Factory className="w-5 h-5" /> {t('maszynownia', language)}
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-slate-600">{t('metric', language)}</div>
                <div className="text-center text-amber-700">{comparisonData.year1.label}</div>
                <div className="text-center text-orange-700">{comparisonData.year2.label}</div>
                <div className="text-center text-slate-600">{t('difference', language)}</div>

                <div>{t('workDaysLabel', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.maszynownia.totalWorkDays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.maszynownia.totalWorkDays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.maszynownia.totalWorkDays, comparisonData.year2.maszynownia.totalWorkDays)}</div>

                <div>{t('weekdaysMonFri', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.maszynownia.regularDays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.maszynownia.regularDays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.maszynownia.regularDays, comparisonData.year2.maszynownia.regularDays)}</div>

                <div>{t('saturdaysOvertime', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.maszynownia.usedSaturdays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.maszynownia.usedSaturdays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.maszynownia.usedSaturdays, comparisonData.year2.maszynownia.usedSaturdays)}</div>

                <div>{t('shiftsTotal', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.maszynownia.totalShifts}</div>
                <div className="text-center font-semibold">{comparisonData.year2.maszynownia.totalShifts}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.maszynownia.totalShifts, comparisonData.year2.maszynownia.totalShifts)}</div>

                <div>{t('downtimeLabel', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.maszynownia.downtimeDays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.maszynownia.downtimeDays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.maszynownia.downtimeDays, comparisonData.year2.maszynownia.downtimeDays)}</div>
              </div>
            </div>

            {/* Pakownia */}
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" /> {t('pakownia', language)}
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-slate-600">{t('metric', language)}</div>
                <div className="text-center text-amber-700">{comparisonData.year1.label}</div>
                <div className="text-center text-orange-700">{comparisonData.year2.label}</div>
                <div className="text-center text-slate-600">{t('difference', language)}</div>

                <div>{t('workDaysLabel', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.pakownia.totalWorkDays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.pakownia.totalWorkDays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.pakownia.totalWorkDays, comparisonData.year2.pakownia.totalWorkDays)}</div>

                <div>{t('weekdaysMonFri', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.pakownia.regularDays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.pakownia.regularDays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.pakownia.regularDays, comparisonData.year2.pakownia.regularDays)}</div>

                <div>{t('saturdaysOvertime', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.pakownia.usedSaturdays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.pakownia.usedSaturdays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.pakownia.usedSaturdays, comparisonData.year2.pakownia.usedSaturdays)}</div>

                <div>{t('shiftsTotal', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.pakownia.totalShifts}</div>
                <div className="text-center font-semibold">{comparisonData.year2.pakownia.totalShifts}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.pakownia.totalShifts, comparisonData.year2.pakownia.totalShifts)}</div>

                <div>{t('downtimeLabel', language)}</div>
                <div className="text-center font-semibold">{comparisonData.year1.pakownia.downtimeDays}</div>
                <div className="text-center font-semibold">{comparisonData.year2.pakownia.downtimeDays}</div>
                <div className="text-center">{renderDiff(comparisonData.year1.pakownia.downtimeDays, comparisonData.year2.pakownia.downtimeDays)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}