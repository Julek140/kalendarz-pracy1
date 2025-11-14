import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, Clock } from "lucide-react";
import { format, isWeekend, parseISO, isWithinInterval, eachDayOfInterval, getDay, getWeek } from "date-fns";
import { pl } from "date-fns/locale";

import ReportSummary from "../components/reports/ReportSummary";
import ReportDetails from "../components/reports/ReportDetails";
import ReportBalance from "../components/reports/ReportBalance";
import ReportCharts from "../components/reports/ReportCharts";
import ReportExport from "../components/reports/ReportExport";

const polishHolidays = [
  // 2025
  { date: "2025-01-01", name: "Nowy Rok" },
  { date: "2025-01-06", name: "Trzech Króli" },
  { date: "2025-04-20", name: "Wielkanoc" },
  { date: "2025-04-21", name: "Poniedziałek Wielkanocny" },
  { date: "2025-05-01", name: "Święto Pracy" },
  { date: "2025-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2025-06-08", name: "Zielone Świątki" },
  { date: "2025-06-19", name: "Boże Ciało" },
  { date: "2025-08-15", name: "Wniebowzięcie NMP" },
  { date: "2025-11-01", name: "Wszystkich Świętych" },
  { date: "2025-11-11", name: "Święto Niepodległości" },
  { date: "2025-12-25", name: "Boże Narodzenie" },
  { date: "2025-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2026
  { date: "2026-01-01", name: "Nowy Rok" },
  { date: "2026-01-06", name: "Trzech Króli" },
  { date: "2026-04-05", name: "Wielkanoc" },
  { date: "2026-04-06", name: "Poniedziałek Wielkanocny" },
  { date: "2026-05-01", name: "Święto Pracy" },
  { date: "2026-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2026-05-24", name: "Zielone Świątki" },
  { date: "2026-06-04", name: "Boże Ciało" },
  { date: "2026-08-15", name: "Wniebowzięcie NMP" },
  { date: "2026-11-01", name: "Wszystkich Świętych" },
  { date: "2026-11-11", name: "Święto Niepodległości" },
  { date: "2026-12-25", name: "Boże Narodzenie" },
  { date: "2026-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2027
  { date: "2027-01-01", name: "Nowy Rok" },
  { date: "2027-01-06", name: "Trzech Króli" },
  { date: "2027-03-28", name: "Wielkanoc" },
  { date: "2027-03-29", name: "Poniedziałek Wielkanocny" },
  { date: "2027-05-01", name: "Święto Pracy" },
  { date: "2027-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2027-05-16", name: "Zielone Świątki" },
  { date: "2027-05-27", name: "Boże Ciało" },
  { date: "2027-08-15", name: "Wniebowzięcie NMP" },
  { date: "2027-11-01", name: "Wszystkich Świętych" },
  { date: "2027-11-11", name: "Święto Niepodległości" },
  { date: "2027-12-25", name: "Boże Narodzenie" },
  { date: "2027-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2028
  { date: "2028-01-01", name: "Nowy Rok" },
  { date: "2028-01-06", name: "Trzech Króli" },
  { date: "2028-04-16", name: "Wielkanoc" },
  { date: "2028-04-17", name: "Poniedziałek Wielkanocny" },
  { date: "2028-05-01", name: "Święto Pracy" },
  { date: "2028-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2028-06-04", name: "Zielone Świątki" },
  { date: "2028-06-15", name: "Boże Ciało" },
  { date: "2028-08-15", name: "Wniebowzięcie NMP" },
  { date: "2028-11-01", name: "Wszystkich Świętych" },
  { date: "2028-11-11", name: "Święto Niepodległości" },
  { date: "2028-12-25", name: "Boże Narodzenie" },
  { date: "2028-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2029
  { date: "2029-01-01", name: "Nowy Rok" },
  { date: "2029-01-06", name: "Trzech Króli" },
  { date: "2029-04-01", name: "Wielkanoc" },
  { date: "2029-04-02", name: "Poniedziałek Wielkanocny" },
  { date: "2029-05-01", name: "Święto Pracy" },
  { date: "2029-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2029-05-20", name: "Zielone Świątki" },
  { date: "2029-05-31", name: "Boże Ciało" },
  { date: "2029-08-15", name: "Wniebowzięcie NMP" },
  { date: "2029-11-01", name: "Wszystkich Świętych" },
  { date: "2029-11-11", name: "Święto Niepodległości" },
  { date: "2029-12-25", name: "Boże Narodzenie" },
  { date: "2029-12-26", name: "Drugi Dzień Bożego Narodzenia" },
];

export default function RaportyPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);

  const { data: workDays = [] } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const { data: customHolidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list(),
    initialData: [],
  });

  const generateReport = () => {
    if (!startDate || !endDate) return;

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Połącz wbudowane święta i niestandardowe
    const allHolidays = [
      ...polishHolidays,
      ...customHolidays.filter(h => h.is_work_free).map(h => ({ date: h.date, name: h.name, isCustom: true }))
    ];

    const filteredDays = workDays.filter(wd => {
      const workDate = parseISO(wd.date);
      return isWithinInterval(workDate, { start, end });
    });

    // Policz święta w zakresie dat
    const holidaysInRange = allHolidays.filter(holiday => {
      const holidayDate = parseISO(holiday.date);
      return isWithinInterval(holidayDate, { start, end });
    });

    // Oblicz dostępne dni i zmiany w okresie
    const allDaysInRange = eachDayOfInterval({ start, end });
    
    // Dni robocze (Pn-Pt) MINUS święta
    const availableWeekdays = allDaysInRange.filter(day => {
      const dayOfWeek = getDay(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWeekdayDate = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isHoliday = allHolidays.some(h => h.date === dateStr);
      return isWeekdayDate && !isHoliday;
    }).length;

    // Dostępne soboty (bez świąt)
    const availableSaturdays = allDaysInRange.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isHoliday = allHolidays.some(h => h.date === dateStr);
      return getDay(day) === 6 && !isHoliday;
    }).length;

    const availableWeekendDays = allDaysInRange.filter(day => {
      return isWeekend(day);
    }).length;

    const totalAvailableDays = allDaysInRange.length;
    
    // Dostępne zmiany = (dni robocze bez świąt * 3) + (weekendy * 1)
    const totalAvailableShifts = (availableWeekdays * 3) + (availableWeekendDays * 1);

    const calculateStats = (department) => {
      const deptDays = filteredDays.filter(wd => 
        wd.department === department || wd.department === "OBA_DZIALY"
      );

      const regularDays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return !isWeekend(date) && 
               !allHolidays.some(h => h.date === wd.date) && 
               !wd.is_downtime;
      }).length;

      const overtimeDays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return (isWeekend(date) || allHolidays.some(h => h.date === wd.date)) && 
               !wd.is_downtime;
      }).length;

      const downtimeDays = deptDays.filter(wd => wd.is_downtime).length;

      // Wykorzystane soboty (bez świąt)
      const usedSaturdays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isHoliday = allHolidays.some(h => h.date === dateStr);
        return getDay(date) === 6 && !wd.is_downtime && !isHoliday;
      }).length;

      const totalWorkDays = regularDays + overtimeDays;

      // Oblicz zmiany
      const totalShifts = deptDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
      const regularShifts = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return !isWeekend(date) && !allHolidays.some(h => h.date === wd.date) && !wd.is_downtime;
      }).reduce((sum, wd) => sum + (wd.shifts || 0), 0);

      const overtimeShifts = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return (isWeekend(date) || allHolidays.some(h => h.date === wd.date)) && !wd.is_downtime;
      }).reduce((sum, wd) => sum + (wd.shifts || 0), 0);

      return {
        totalWorkDays,
        regularDays,
        overtimeDays,
        downtimeDays,
        usedSaturdays,
        totalShifts,
        regularShifts,
        overtimeShifts,
        details: deptDays,
      };
    };

    const maszynowniaStats = calculateStats("MASZYNOWNIA");
    const pakowniaStats = calculateStats("PAKOWNIA");

    setReportData({
      startDate,
      endDate,
      maszynownia: maszynowniaStats,
      pakownia: pakowniaStats,
      allDays: filteredDays,
      holidaysCount: holidaysInRange.length,
      holidays: holidaysInRange,
      balance: {
        totalAvailableDays,
        availableWeekdays,
        availableSaturdays,
        availableWeekendDays,
        totalAvailableShifts,
        holidaysCount: holidaysInRange.length,
        usedDaysMaszynownia: maszynowniaStats.totalWorkDays,
        usedDaysPakownia: pakowniaStats.totalWorkDays,
        usedWeekdaysMaszynownia: maszynowniaStats.regularDays,
        usedWeekdaysPakownia: pakowniaStats.regularDays,
        usedSaturdaysMaszynownia: maszynowniaStats.usedSaturdays,
        usedSaturdaysPakownia: pakowniaStats.usedSaturdays,
        usedShiftsMaszynownia: maszynowniaStats.totalShifts,
        usedShiftsPakownia: pakowniaStats.totalShifts,
      },
    });

    setReportGenerated(true);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 print:shadow-none print:rounded-none">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop" 
              alt="CONSTRACT Logo" 
              className="w-20 h-20 object-contain rounded-lg"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Kalendarz Pracy Zakładu CONSTRACT</h1>
              <p className="text-slate-600 mt-1">System zarządzania harmonogramem pracy</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 shadow-lg border-none print:hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Wybierz zakres dat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                  Data początkowa
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                {startDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    Tydzień {getWeek(parseISO(startDate), { weekStartsOn: 1, locale: pl })}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                  Data końcowa
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
                {endDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    Tydzień {getWeek(parseISO(endDate), { weekStartsOn: 1, locale: pl })}
                  </p>
                )}
              </div>
              <Button
                onClick={generateReport}
                disabled={!startDate || !endDate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generuj raport
              </Button>
            </div>
          </CardContent>
        </Card>

        {reportGenerated && reportData && (
          <div className="print-area">
            <div className="mb-6 print:hidden">
              <ReportExport reportData={reportData} />
            </div>
            
            <ReportBalance reportData={reportData} />
            <ReportCharts reportData={reportData} />
            <ReportSummary reportData={reportData} />
            <ReportDetails reportData={reportData} />
          </div>
        )}

        {!reportGenerated && (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">
                Wybierz zakres dat i wygeneruj raport, aby zobaczyć szczegółowe statystyki
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}