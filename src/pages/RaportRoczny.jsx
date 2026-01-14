import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, TrendingUp, Calendar, Loader2, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

export default function RaportRocznyPage() {
  const { language } = useLanguage();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [reportData, setReportData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const locale = language === 'pl' ? pl : enUS;

  const { data: workDays = [] } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const generateReport = async () => {
    setIsGenerating(true);
    const year = parseInt(selectedYear);

    // Filtruj dane dla wybranego roku
    const yearWorkDays = workDays.filter(wd => {
      const date = new Date(wd.date);
      return date.getFullYear() === year;
    });

    // Agregacja miesięczna
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      
      const monthDays = yearWorkDays.filter(wd => {
        const date = parseISO(wd.date);
        return date >= monthStart && date <= monthEnd;
      });

      const revenueIkea = monthDays.reduce((sum, wd) => sum + (wd.revenue_ikea || 0), 0);
      const revenueIkeaIndustry = monthDays.reduce((sum, wd) => sum + (wd.revenue_ikea_industry || 0), 0);
      const revenueOthers = monthDays.reduce((sum, wd) => sum + (wd.revenue_others || 0), 0);
      const totalRevenue = revenueIkea + revenueIkeaIndustry + revenueOthers;
      const totalShifts = monthDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
      const totalDays = monthDays.length;
      const avgDailyRevenue = totalDays > 0 ? totalRevenue / totalDays : 0;

      const monthNames = {
        pl: ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      };

      monthlyData.push({
        month: monthNames[language][month],
        monthNum: month + 1,
        totalRevenue,
        revenueIkea,
        revenueIkeaIndustry,
        revenueOthers,
        totalDays,
        totalShifts,
        avgDailyRevenue,
      });
    }

    // Statystyki roczne
    const totalYearRevenue = monthlyData.reduce((sum, m) => sum + m.totalRevenue, 0);
    const avgMonthlyRevenue = totalYearRevenue / 12;
    const totalYearDays = monthlyData.reduce((sum, m) => sum + m.totalDays, 0);
    const totalYearShifts = monthlyData.reduce((sum, m) => sum + m.totalShifts, 0);

    // Najlepszy i najsłabszy miesiąc
    const bestMonth = monthlyData.reduce((max, m) => m.totalRevenue > max.totalRevenue ? m : max, monthlyData[0]);
    const worstMonth = monthlyData.filter(m => m.totalDays > 0).reduce((min, m) => m.totalRevenue < min.totalRevenue ? m : min, monthlyData.find(m => m.totalDays > 0) || monthlyData[0]);

    // Miesiące powyżej i poniżej średniej
    const aboveAverage = monthlyData.filter(m => m.totalRevenue > avgMonthlyRevenue);
    const belowAverage = monthlyData.filter(m => m.totalRevenue < avgMonthlyRevenue && m.totalDays > 0);

    // Agregacja kwartalna
    const quarterlyData = [
      {
        quarter: "Q1",
        months: monthlyData.slice(0, 3),
        totalRevenue: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalRevenue, 0),
        revenueIkea: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenueIkea, 0),
        revenueIkeaIndustry: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0),
        revenueOthers: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenueOthers, 0),
      },
      {
        quarter: "Q2",
        months: monthlyData.slice(3, 6),
        totalRevenue: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.totalRevenue, 0),
        revenueIkea: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenueIkea, 0),
        revenueIkeaIndustry: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0),
        revenueOthers: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenueOthers, 0),
      },
      {
        quarter: "Q3",
        months: monthlyData.slice(6, 9),
        totalRevenue: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.totalRevenue, 0),
        revenueIkea: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.revenueIkea, 0),
        revenueIkeaIndustry: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0),
        revenueOthers: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.revenueOthers, 0),
      },
      {
        quarter: "Q4",
        months: monthlyData.slice(9, 12),
        totalRevenue: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.totalRevenue, 0),
        revenueIkea: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.revenueIkea, 0),
        revenueIkeaIndustry: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0),
        revenueOthers: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.revenueOthers, 0),
      },
    ];

    const bestQuarter = quarterlyData.reduce((max, q) => q.totalRevenue > max.totalRevenue ? q : max, quarterlyData[0]);
    const worstQuarter = quarterlyData.reduce((min, q) => q.totalRevenue < min.totalRevenue ? q : min, quarterlyData[0]);

    setReportData({
      year,
      monthlyData,
      totalYearRevenue,
      avgMonthlyRevenue,
      totalYearDays,
      totalYearShifts,
      bestMonth,
      worstMonth,
      aboveAverage,
      belowAverage,
      quarterlyData,
      bestQuarter,
      worstQuarter,
    });

    // Generuj analizę AI
    try {
      const prompt = `Jesteś ekspertem analityki biznesowej specjalizującym się w produkcji kontraktowej.

      KONTEKST FIRMY:
      CONSTRACT to zakład produkcji kontraktowej, który wytwarza wyroby dla dużych korporacji (m.in. IKEA). 
      Firma NIE ma własnych produktów i NIE prowadzi działań marketingowych konsumenckich.
      Obroty zależą od zamówień od klientów B2B, ich sezonowości i cykli produkcyjnych.

      DANE ROCZNE ${year}:
      - Całkowity obrót: ${formatCurrency(totalYearRevenue)}
      - Średni obrót miesięczny: ${formatCurrency(avgMonthlyRevenue)}
      - Przepracowane dni: ${totalYearDays}
      - Przepracowane zmiany: ${totalYearShifts}

      DANE MIESIĘCZNE:
      ${monthlyData.map(m => `${m.month}: ${formatCurrency(m.totalRevenue)} (${m.totalDays} dni, ${m.totalShifts} zmian)`).join('\n')}

      NAJLEPSZY MIESIĄC: ${bestMonth.month} - ${formatCurrency(bestMonth.totalRevenue)}
      NAJSŁABSZY MIESIĄC: ${worstMonth.month} - ${formatCurrency(worstMonth.totalRevenue)}

      KWARTAŁY:
      Q1: ${formatCurrency(quarterlyData[0].totalRevenue)}
      Q2: ${formatCurrency(quarterlyData[1].totalRevenue)}
      Q3: ${formatCurrency(quarterlyData[2].totalRevenue)}
      Q4: ${formatCurrency(quarterlyData[3].totalRevenue)}

      Wygeneruj PROFESJONALNY RAPORT DLA ZARZĄDU zawierający:

      1. PODSUMOWANIE ROKU (3-4 zdania):
      - Ocena realizacji produkcji i wykorzystania mocy wytwórczych
      - Porównanie dynamiki zamówień między pierwszą a drugą połową roku
      - Wpływ sezonowości klientów i okresów przestojowych
      - Ogólna wydajność operacyjna zakładu

      2. ANALIZA MIESIĘCZNA (1-2 zwięzłe zdania dla każdego miesiąca):
      - Ocena poziomu produkcji względem średniej
      - Związek z sezonowością zamówień od klientów B2B
      - Ewentualne przestoje lub okresy intensywnej produkcji

      3. TREND ROCZNY:
      - Określ charakterystykę roku: wzrostowy, spadkowy, stabilny, sezonowy
      - Powiąż z cyklami zamówień od głównych klientów
      - Ocena przewidywalności wolumenu produkcji

      4. WNIOSKI I REKOMENDACJE (5-6 punktów):
      - Konkretne wnioski operacyjne dotyczące wykorzystania mocy produkcyjnych
      - Rekomendacje dotyczące planowania produkcji i zarządzania personelem
      - Propozycje optymalizacji w relacjach z klientami B2B
      - Obszary do poprawy w zakresie efektywności produkcji
      - NIE PROPONUJ akcji marketingowych ani rozwoju własnych produktów

      Styl komunikacji: biznesowy, merytoryczny, skoncentrowany na produkcji kontraktowej i relacjach B2B.

      Format odpowiedzi jako JSON:
      {
      "podsumowanie_roku": "tekst",
      "analiza_miesieczna": {
      "styczeń": "tekst",
      "luty": "tekst",
      ...
      },
      "trend": "tekst",
      "wnioski": ["punkt 1", "punkt 2", ...]
      }`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            podsumowanie_roku: { type: "string" },
            analiza_miesieczna: {
              type: "object",
              properties: {
                styczeń: { type: "string" },
                luty: { type: "string" },
                marzec: { type: "string" },
                kwiecień: { type: "string" },
                maj: { type: "string" },
                czerwiec: { type: "string" },
                lipiec: { type: "string" },
                sierpień: { type: "string" },
                wrzesień: { type: "string" },
                październik: { type: "string" },
                listopad: { type: "string" },
                grudzień: { type: "string" },
              }
            },
            trend: { type: "string" },
            wnioski: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Błąd generowania analizy AI:", error);
    }

    setIsGenerating(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://constract.pl/wp-content/uploads/2024/09/cropped-Constract_logo-2024-01-e1744010411889-2048x557.png" 
              alt="CONSTRACT Logo" 
              className="h-12 w-auto object-contain"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">{t('annualReport', language)}</h1>
              <p className="text-slate-600 mt-1">{t('businessAnalysisSummary', language)}</p>
            </div>
          </div>
        </div>

        {/* Selektor roku */}
        <Card className="mb-6 shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {t('selectYearToAnalyze', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
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
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('generating', language)}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {t('generateAnnualReport', language)}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Raport */}
        {reportData && (
          <div className="space-y-6">
            {/* Statystyki główne */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="shadow-lg border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('totalYearRevenue', language, { year: reportData.year })}</p>
                  <p className="text-3xl font-bold">{formatCurrency(reportData.totalYearRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <FileText className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('avgMonthlyRevenue', language)}</p>
                  <p className="text-3xl font-bold">{formatCurrency(reportData.avgMonthlyRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <CardContent className="p-6">
                  <Calendar className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('daysWorked', language)}</p>
                  <p className="text-3xl font-bold">{reportData.totalYearDays}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-orange-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">{t('shiftsWorked', language)}</p>
                  <p className="text-3xl font-bold">{reportData.totalYearShifts}</p>
                </CardContent>
              </Card>
            </div>

            {/* Podsumowanie AI */}
            {aiAnalysis && (
              <Card className="shadow-lg border-none border-l-4 border-l-indigo-600">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle>{t('yearSummary', language, { year: reportData.year })}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-slate-700 leading-relaxed text-lg">{aiAnalysis.podsumowanie_roku}</p>
                </CardContent>
              </Card>
            )}

            {/* Wykresy */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Wykres liniowy - Łączny obrót */}
              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle>{t('monthlyTrendTotal', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                      <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="totalRevenue" stroke="#4F46E5" strokeWidth={3} name={t('totalRevenue', language)} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Wykres słupkowy - Łączny obrót */}
              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                  <CardTitle>{t('monthComparisonTotal', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                      <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="totalRevenue" fill="#10B981" name={t('totalRevenue', language)} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Wykresy z podziałem na źródła */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Wykres liniowy - Podział źródeł */}
              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle>{t('monthlyTrendBreakdown', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                      <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenueIkea" stroke="#3B82F6" strokeWidth={2} name="IKEA SUPPLY" />
                      <Line type="monotone" dataKey="revenueIkeaIndustry" stroke="#9333EA" strokeWidth={2} name="IKEA INDUSTRY" />
                      <Line type="monotone" dataKey="revenueOthers" stroke="#10B981" strokeWidth={2} name="POZOSTALI" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Wykres słupkowy - Podział źródeł */}
              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardTitle>{t('monthComparisonBreakdown', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                      <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenueIkea" fill="#3B82F6" name="IKEA SUPPLY" />
                      <Bar dataKey="revenueIkeaIndustry" fill="#9333EA" name="IKEA INDUSTRY" />
                      <Bar dataKey="revenueOthers" fill="#10B981" name="POZOSTALI" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Wykres kwartalny - Łączny */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle>{t('quarterlyAnalysisTotal', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.quarterlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalRevenue" fill="#9333EA" name={t('totalRevenue', language)} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-1">{t('bestQuarter', language)}</p>
                    <p className="text-2xl font-bold text-green-900">{reportData.bestQuarter.quarter}</p>
                    <p className="text-sm text-green-600">{formatCurrency(reportData.bestQuarter.totalRevenue)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 mb-1">{t('worstQuarter', language)}</p>
                    <p className="text-2xl font-bold text-red-900">{reportData.worstQuarter.quarter}</p>
                    <p className="text-sm text-red-600">{formatCurrency(reportData.worstQuarter.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wykres kwartalny - Podział źródeł */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50">
                <CardTitle>{t('quarterlyAnalysisBreakdown', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.quarterlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenueIkea" fill="#3B82F6" name="IKEA SUPPLY" />
                    <Bar dataKey="revenueIkeaIndustry" fill="#9333EA" name="IKEA INDUSTRY" />
                    <Bar dataKey="revenueOthers" fill="#10B981" name="POZOSTALI" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Najlepszy i najsłabszy miesiąc */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-none border-l-4 border-l-green-600">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-900">{t('bestMonth', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-4xl font-bold text-green-700 mb-2 capitalize">{reportData.bestMonth.month}</p>
                  <p className="text-2xl text-green-600 mb-4">{formatCurrency(reportData.bestMonth.totalRevenue)}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>{t('daysWorked', language)}: {reportData.bestMonth.totalDays}</p>
                    <p>{t('shiftsWorked', language)}: {reportData.bestMonth.totalShifts}</p>
                    <p>{t('avgDailyRevenue', language)}: {formatCurrency(reportData.bestMonth.avgDailyRevenue)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none border-l-4 border-l-red-600">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="text-red-900">{t('worstMonth', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-4xl font-bold text-red-700 mb-2 capitalize">{reportData.worstMonth.month}</p>
                  <p className="text-2xl text-red-600 mb-4">{formatCurrency(reportData.worstMonth.totalRevenue)}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>{t('daysWorked', language)}: {reportData.worstMonth.totalDays}</p>
                    <p>{t('shiftsWorked', language)}: {reportData.worstMonth.totalShifts}</p>
                    <p>{t('avgDailyRevenue', language)}: {formatCurrency(reportData.worstMonth.avgDailyRevenue)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analiza miesięczna AI */}
            {aiAnalysis && (
              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle>{t('monthlyAnalysis', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(aiAnalysis.analiza_miesieczna).map(([month, analysis]) => {
                      const monthData = reportData.monthlyData.find(m => m.month.toLowerCase() === month);
                      const isAboveAvg = monthData && monthData.totalRevenue > reportData.avgMonthlyRevenue;
                      
                      return (
                        <div key={month} className={`p-4 rounded-lg border-2 ${isAboveAvg ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold capitalize text-slate-900">{month}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${isAboveAvg ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                              {isAboveAvg ? t('aboveAverage', language) : t('belowAverage', language)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{analysis}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trend roczny */}
            {aiAnalysis && (
              <Card className="shadow-lg border-none border-l-4 border-l-purple-600">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle>{t('yearlyTrend', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-slate-700 leading-relaxed">{aiAnalysis.trend}</p>
                </CardContent>
              </Card>
            )}

            {/* Wnioski i rekomendacje */}
            {aiAnalysis && (
              <Card className="shadow-lg border-none border-l-4 border-l-amber-600">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardTitle>{t('conclusionsRecommendations', language)}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {aiAnalysis.wnioski.map((wniosek, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <p className="text-slate-700 leading-relaxed">{wniosek}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!reportData && !isGenerating && (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">
                {language === 'pl' 
                  ? 'Wybierz rok i wygeneruj raport roczny z pełną analizą biznesową'
                  : 'Select a year and generate an annual report with full business analysis'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}