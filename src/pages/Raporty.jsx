import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, Clock, AlertCircle } from "lucide-react";
import { format, isWeekend, parseISO, isWithinInterval } from "date-fns";
import { pl } from "date-fns/locale";

import ReportSummary from "../components/reports/ReportSummary";
import ReportDetails from "../components/reports/ReportDetails";

const polishHolidays = [
  "2025-01-01", "2025-01-06", "2025-04-20", "2025-04-21", "2025-05-01",
  "2025-05-03", "2025-06-08", "2025-06-19", "2025-08-15", "2025-11-01",
  "2025-11-11", "2025-12-25", "2025-12-26"
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

  const generateReport = () => {
    if (!startDate || !endDate) return;

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const filteredDays = workDays.filter(wd => {
      const workDate = parseISO(wd.date);
      return isWithinInterval(workDate, { start, end });
    });

    const calculateStats = (department) => {
      const deptDays = filteredDays.filter(wd => 
        wd.department === department || wd.department === "OBA_DZIALY"
      );

      const regularDays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return !isWeekend(date) && 
               !polishHolidays.includes(wd.date) && 
               !wd.is_downtime;
      }).length;

      const overtimeDays = deptDays.filter(wd => {
        const date = parseISO(wd.date);
        return (isWeekend(date) || polishHolidays.includes(wd.date)) && 
               !wd.is_downtime;
      }).length;

      const downtimeDays = deptDays.filter(wd => wd.is_downtime).length;

      const totalWorkDays = regularDays + overtimeDays;

      return {
        totalWorkDays,
        regularDays,
        overtimeDays,
        downtimeDays,
        details: deptDays,
      };
    };

    setReportData({
      startDate,
      endDate,
      maszynownia: calculateStats("MASZYNOWNIA"),
      pakownia: calculateStats("PAKOWNIA"),
      allDays: filteredDays,
    });

    setReportGenerated(true);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Raporty Pracy</h1>
          </div>
          <p className="text-slate-600">Generuj szczegółowe raporty pracy działów</p>
        </div>

        {/* Date Range Selection */}
        <Card className="mb-6 shadow-lg border-none">
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

        {/* Report Results */}
        {reportGenerated && reportData && (
          <>
            <ReportSummary reportData={reportData} />
            <ReportDetails reportData={reportData} />
          </>
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