import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { format, parseISO, isWithinInterval, eachWeekOfInterval, startOfWeek, endOfWeek, getWeek, startOfMonth, endOfMonth, eachMonthOfInterval, getYear } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

const getMonths = (lang) => [
  { value: "01", label: lang === 'pl' ? "Styczeń" : "January" },
  { value: "02", label: lang === 'pl' ? "Luty" : "February" },
  { value: "03", label: lang === 'pl' ? "Marzec" : "March" },
  { value: "04", label: lang === 'pl' ? "Kwiecień" : "April" },
  { value: "05", label: lang === 'pl' ? "Maj" : "May" },
  { value: "06", label: lang === 'pl' ? "Czerwiec" : "June" },
  { value: "07", label: lang === 'pl' ? "Lipiec" : "July" },
  { value: "08", label: lang === 'pl' ? "Sierpień" : "August" },
  { value: "09", label: lang === 'pl' ? "Wrzesień" : "September" },
  { value: "10", label: lang === 'pl' ? "Październik" : "October" },
  { value: "11", label: lang === 'pl' ? "Listopad" : "November" },
  { value: "12", label: lang === 'pl' ? "Grudzień" : "December" },
];

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

export default function RaportyFinansowePage() {
  const { language } = useLanguage();
  const [mode, setMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()).toString());
  const [selectedWeek, setSelectedWeek] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  const locale = language === 'pl' ? pl : enUS;

  const { data: workDays = [] } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const getYearlyGoal = (year) => {
    if (!user?.yearly_goals) return 0;
    const goalForYear = user.yearly_goals.find(g => g.year === year);
    return goalForYear ? goalForYear.goal : 0;
  };

  useEffect(() => {
    if (mode === "month" && selectedMonth && selectedYear) {
      const start = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1));
      const end = endOfMonth(start);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      generateReportAuto(start, end);
    }
  }, [selectedMonth, selectedYear, mode]);

  useEffect(() => {
    if (mode === "week" && selectedWeek && selectedYear) {
      const weekNum = parseInt(selectedWeek);
      const yearStart = new Date(parseInt(selectedYear), 0, 1);
      const weeks = eachWeekOfInterval({ start: yearStart, end: new Date(parseInt(selectedYear), 11, 31) }, { weekStartsOn: 1 });
      const targetWeek = weeks.find(w => getWeek(w, { weekStartsOn: 1, locale }) === weekNum);
      if (targetWeek) {
        const start = startOfWeek(targetWeek, { weekStartsOn: 1 });
        const end = endOfWeek(targetWeek, { weekStartsOn: 1 });
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
        generateReportAuto(start, end);
      }
    }
  }, [selectedWeek, selectedYear, mode]);

  const generateReportAuto = (start, end) => {
    generateReportInternal(start, end);
  };

  const generateReport = () => {
    if (!startDate || !endDate) return;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    generateReportInternal(start, end);
  };

  const generateReportInternal = (start, end) => {

    const filteredDays = workDays.filter(wd => {
      const workDate = parseISO(wd.date);
      return isWithinInterval(workDate, { start, end });
    });

    // Dane tygodniowe
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    const weeklyData = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekNumber = getWeek(weekStart, { weekStartsOn: 1, locale });
      
      const weekDays = filteredDays.filter(wd => {
        const date = parseISO(wd.date);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });

      const totalRevenue = weekDays.reduce((sum, wd) => sum + (wd.revenue || 0), 0);
      const totalShifts = weekDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
      const totalDays = weekDays.length;

      return {
        weekNumber,
        weekStart,
        weekEnd,
        totalRevenue,
        totalDays,
        totalShifts,
        revenuePerDay: totalDays > 0 ? totalRevenue / totalDays : 0,
        revenuePerShift: totalShifts > 0 ? totalRevenue / totalShifts : 0,
      };
    });

    // Dane miesięczne
    const months = eachMonthOfInterval({ start, end });
    const monthlyData = months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      
      const monthDays = filteredDays.filter(wd => {
        const date = parseISO(wd.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const totalRevenue = monthDays.reduce((sum, wd) => sum + ((wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0)), 0);
      const totalShifts = monthDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
      const totalDays = monthDays.length;

      return {
        month: format(monthStart, 'LLLL yyyy', { locale }),
        totalRevenue,
        totalDays,
        totalShifts,
        revenuePerDay: totalDays > 0 ? totalRevenue / totalDays : 0,
        revenuePerShift: totalShifts > 0 ? totalRevenue / totalShifts : 0,
      };
    });

    // Statystyki ogólne
    const totalRevenue = filteredDays.reduce((sum, wd) => sum + ((wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0)), 0);
    const totalDays = filteredDays.length;
    const totalShifts = filteredDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
    const avgWeeklyRevenue = weeklyData.length > 0 ? weeklyData.reduce((sum, w) => sum + w.totalRevenue, 0) / weeklyData.length : 0;
    
    // Oblicz potrzebny średni obrót miesięczny do osiągnięcia celu
    const reportYear = new Date(start).getFullYear();
    const yearlyGoal = getYearlyGoal(reportYear);
    const requiredAvgMonthlyRevenue = yearlyGoal / 12;

    setReportData({
      startDate,
      endDate,
      totalRevenue,
      totalDays,
      totalShifts,
      avgWeeklyRevenue,
      requiredAvgMonthlyRevenue,
      revenuePerDay: totalDays > 0 ? totalRevenue / totalDays : 0,
      revenuePerShift: totalShifts > 0 ? totalRevenue / totalShifts : 0,
      weeklyData,
      monthlyData,
    });

    setReportGenerated(true);
  };

  const getWeeksForYear = (year) => {
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31);
    const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn: 1 });
    return weeks.map(w => {
      const weekNum = getWeek(w, { weekStartsOn: 1, locale });
      const wStart = startOfWeek(w, { weekStartsOn: 1 });
      const wEnd = endOfWeek(w, { weekStartsOn: 1 });
      return {
        value: weekNum.toString(),
        label: `${language === 'pl' ? 'Tydzień' : 'Week'} ${weekNum} (${format(wStart, 'd MMM', { locale })} - ${format(wEnd, 'd MMM', { locale })})`
      };
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://constract.pl/wp-content/uploads/2024/09/cropped-Constract_logo-2024-01-e1744010411889-2048x557.png" 
              alt="CONSTRACT Logo" 
              className="h-12 w-auto object-contain"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">{t('financialReports', language)}</h1>
              <p className="text-slate-600 mt-1">{language === 'pl' ? 'Analiza obrotów i wydajności finansowej' : 'Revenue and financial performance analysis'}</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {t('selectReportPeriod', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="month">{t('month', language)}</TabsTrigger>
                <TabsTrigger value="week">{t('week', language)}</TabsTrigger>
                <TabsTrigger value="custom">{t('customRange', language)}</TabsTrigger>
              </TabsList>

              <TabsContent value="month">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t('month', language)}</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectMonth', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonths(language).map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t('year', language)}</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
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
              </TabsContent>

              <TabsContent value="week">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t('week', language)}</Label>
                    <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectWeek', language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {getWeeksForYear(selectedYear).map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t('year', language)}</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
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
              </TabsContent>

              <TabsContent value="custom">
                <div className="grid md:grid-cols-3 gap-6 items-end">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                      {t('startDate', language)}
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
                      {t('endDate', language)}
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
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 h-10"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t('generateReport', language)}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {reportGenerated && reportData && (
          <div className="space-y-6">
            {/* Statystyki główne */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="shadow-lg border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <DollarSign className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('totalRevenue', language)}</p>
                  <p className="text-3xl font-bold">{formatCurrency(reportData.totalRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('avgWeeklyRevenue', language)}</p>
                  <p className="text-3xl font-bold">{formatCurrency(reportData.avgWeeklyRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <CardContent className="p-6">
                  <Calendar className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('requiredAvgMonthly', language)}</p>
                  <p className="text-3xl font-bold">{formatCurrency(reportData.requiredAvgMonthlyRevenue)}</p>
                  <p className="text-xs opacity-75 mt-1">{t('toGoalYear', language, { year: new Date(reportData.startDate).getFullYear() })}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-orange-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <BarChart3 className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('shiftsWorked', language)}</p>
                  <p className="text-3xl font-bold">{reportData.totalShifts}</p>
                </CardContent>
              </Card>
            </div>

            {/* Wydajność */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                <CardTitle>{t('financialPerformance', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                    <p className="text-sm text-amber-700 mb-2">{t('revenuePerDay', language)}</p>
                    <p className="text-4xl font-bold text-amber-900">{formatCurrency(reportData.revenuePerDay)}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      {t('daysWorkedCount', language, { count: reportData.totalDays })}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
                    <p className="text-sm text-orange-700 mb-2">{t('revenuePerShift', language)}</p>
                    <p className="text-4xl font-bold text-orange-900">{formatCurrency(reportData.revenuePerShift)}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      {t('shiftsWorkedCount', language, { count: reportData.totalShifts })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dane tygodniowe */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle>{t('weeklyRevenue', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left p-3 font-semibold">{t('week', language)}</th>
                        <th className="text-left p-3 font-semibold">{t('period', language)}</th>
                        <th className="text-right p-3 font-semibold">{t('revenue', language)}</th>
                        <th className="text-center p-3 font-semibold">{t('days', language)}</th>
                        <th className="text-center p-3 font-semibold">{t('shifts', language)}</th>
                        <th className="text-right p-3 font-semibold">{t('revenuePerDay', language)}</th>
                        <th className="text-right p-3 font-semibold">{t('revenuePerShift', language)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.weeklyData.map((week, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3">{t('week', language)} {week.weekNumber}</td>
                          <td className="p-3 text-sm text-slate-600">
                            {format(week.weekStart, 'd MMM', { locale })} - {format(week.weekEnd, 'd MMM', { locale })}
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-700">
                            {formatCurrency(week.totalRevenue)}
                          </td>
                          <td className="p-3 text-center">{week.totalDays}</td>
                          <td className="p-3 text-center">{week.totalShifts}</td>
                          <td className="p-3 text-right text-sm">{formatCurrency(week.revenuePerDay)}</td>
                          <td className="p-3 text-right text-sm">{formatCurrency(week.revenuePerShift)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Dane miesięczne */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle>{t('monthlyRevenue', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left p-3 font-semibold">{t('month', language)}</th>
                        <th className="text-right p-3 font-semibold">{t('revenue', language)}</th>
                        <th className="text-center p-3 font-semibold">{t('days', language)}</th>
                        <th className="text-center p-3 font-semibold">{t('shifts', language)}</th>
                        <th className="text-right p-3 font-semibold">{t('revenuePerDay', language)}</th>
                        <th className="text-right p-3 font-semibold">{t('revenuePerShift', language)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.monthlyData.map((month, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 capitalize font-medium">{month.month}</td>
                          <td className="p-3 text-right font-semibold text-purple-700">
                            {formatCurrency(month.totalRevenue)}
                          </td>
                          <td className="p-3 text-center">{month.totalDays}</td>
                          <td className="p-3 text-center">{month.totalShifts}</td>
                          <td className="p-3 text-right text-sm">{formatCurrency(month.revenuePerDay)}</td>
                          <td className="p-3 text-right text-sm">{formatCurrency(month.revenuePerShift)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}