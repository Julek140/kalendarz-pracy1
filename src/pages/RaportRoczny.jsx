import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, Calendar, Loader2, Target, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { startOfMonth, endOfMonth, format, parseISO, getYear, getMonth } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import GoalsManager from "@/components/annual/GoalsManager";
import GoalsDashboard from "@/components/annual/GoalsDashboard";
import TrucksAnalysis from "@/components/annual/TrucksAnalysis";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

export default function RaportRocznyPage() {
  const { language } = useLanguage();
  const reportRef = useRef(null);
  const [activeTab, setActiveTab] = useState("annualReport");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [reportData, setReportData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedYear1, setSelectedYear1] = useState("2024");
  const [selectedYear2, setSelectedYear2] = useState("2025");
  const [comparisonReportData, setComparisonReportData] = useState(null);
  const [comparisonAiAnalysis, setComparisonAiAnalysis] = useState(null);
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);
  
  const locale = language === 'pl' ? pl : enUS;

  const { data: workDays = [] } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const { data: financialGoals = [] } = useQuery({
    queryKey: ['financialGoals'],
    queryFn: () => base44.entities.FinancialGoal.list(),
    initialData: [],
  });

  const fetchDataForYear = (year) => {
    const yearInt = parseInt(year);
    const yearWorkDays = workDays.filter(wd => {
      const date = new Date(wd.date);
      return date.getFullYear() === yearInt;
    });

    // Pobierz cele finansowe dla danego roku
    const yearGoals = financialGoals.filter(g => g.year === yearInt);

    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(yearInt, month, 1);
      const monthEnd = endOfMonth(monthStart);
      
      const monthDays = yearWorkDays.filter(wd => {
        const date = parseISO(wd.date);
        return date >= monthStart && date <= monthEnd;
      });

      const revenueIkea = monthDays.reduce((sum, wd) => sum + (wd.revenue_ikea || 0), 0);
      const revenueIkeaIndustry = monthDays.reduce((sum, wd) => sum + (wd.revenue_ikea_industry || 0), 0);
      const revenueOthers = monthDays.reduce((sum, wd) => sum + (wd.revenue_others || 0), 0);
      const trucksIkea = monthDays.reduce((sum, wd) => sum + (wd.trucks_ikea || 0), 0);
      const trucksIkeaIndustry = monthDays.reduce((sum, wd) => sum + (wd.trucks_ikea_industry || 0), 0);
      const trucksOthers = monthDays.reduce((sum, wd) => sum + (wd.trucks_others || 0), 0);
      const totalRevenue = revenueIkea + revenueIkeaIndustry + revenueOthers;
      const totalShifts = monthDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
      const totalDays = monthDays.length;
      const avgDailyRevenue = totalDays > 0 ? totalRevenue / totalDays : 0;

      // Pobierz cel dla tego miesiąca
      const monthGoal = yearGoals.find(g => g.month === month + 1);
      const goalIkea = monthGoal?.revenue_ikea_goal || 0;
      const goalIkeaIndustry = monthGoal?.revenue_ikea_industry_goal || 0;
      const goalOthers = monthGoal?.revenue_others_goal || 0;
      const totalGoal = goalIkea + goalIkeaIndustry + goalOthers;
      const goalAchievement = totalGoal > 0 ? (totalRevenue / totalGoal) * 100 : 0;

      monthlyData.push({
        month: format(monthStart, 'LLLL', { locale }),
        monthNum: month + 1,
        totalRevenue,
        revenueIkea,
        revenueIkeaIndustry,
        revenueOthers,
        trucksIkea,
        trucksIkeaIndustry,
        trucksOthers,
        totalDays,
        totalShifts,
        avgDailyRevenue,
        totalGoal,
        goalIkea,
        goalIkeaIndustry,
        goalOthers,
        goalAchievement,
      });
    }

    const totalYearRevenue = monthlyData.reduce((sum, m) => sum + m.totalRevenue, 0);
    
    // Oblicz średni miesięczny obrót tylko z miesięcy, które mają dane
    const monthsWithData = monthlyData.filter(m => m.totalDays > 0).length;
    const avgMonthlyRevenue = monthsWithData > 0 ? totalYearRevenue / monthsWithData : 0;
    
    // Oblicz dni przepracowane (wykluczając przestoje)
    const totalYearDays = yearWorkDays.filter(wd => !wd.is_downtime).length;
    const totalYearShifts = monthlyData.reduce((sum, m) => sum + m.totalShifts, 0);
    const totalYearGoal = monthlyData.reduce((sum, m) => sum + m.totalGoal, 0);
    const yearGoalAchievement = totalYearGoal > 0 ? (totalYearRevenue / totalYearGoal) * 100 : 0;

    const bestMonth = monthlyData.reduce((max, m) => m.totalRevenue > max.totalRevenue ? m : max, monthlyData[0]);
    const worstMonth = monthlyData.filter(m => m.totalDays > 0).reduce((min, m) => m.totalRevenue < min.totalRevenue ? m : min, monthlyData.find(m => m.totalDays > 0) || monthlyData[0]);

    const aboveAverage = monthlyData.filter(m => m.totalRevenue > avgMonthlyRevenue);
    const belowAverage = monthlyData.filter(m => m.totalRevenue < avgMonthlyRevenue && m.totalDays > 0);

    const quarterlyData = [
      { quarter: "Q1", months: monthlyData.slice(0, 3), totalRevenue: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalRevenue, 0), revenueIkea: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenueIkea, 0), revenueIkeaIndustry: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0), revenueOthers: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenueOthers, 0) },
      { quarter: "Q2", months: monthlyData.slice(3, 6), totalRevenue: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.totalRevenue, 0), revenueIkea: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenueIkea, 0), revenueIkeaIndustry: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0), revenueOthers: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenueOthers, 0) },
      { quarter: "Q3", months: monthlyData.slice(6, 9), totalRevenue: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.totalRevenue, 0), revenueIkea: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.revenueIkea, 0), revenueIkeaIndustry: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0), revenueOthers: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.revenueOthers, 0) },
      { quarter: "Q4", months: monthlyData.slice(9, 12), totalRevenue: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.totalRevenue, 0), revenueIkea: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.revenueIkea, 0), revenueIkeaIndustry: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.revenueIkeaIndustry, 0), revenueOthers: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.revenueOthers, 0) },
    ];

    const bestQuarter = quarterlyData.reduce((max, q) => q.totalRevenue > max.totalRevenue ? q : max, quarterlyData[0]);
    const worstQuarter = quarterlyData.reduce((min, q) => q.totalRevenue < min.totalRevenue ? q : min, quarterlyData[0]);

    return {
      year: yearInt,
      monthlyData,
      totalYearRevenue,
      avgMonthlyRevenue,
      totalYearDays,
      totalYearShifts,
      totalYearGoal,
      yearGoalAchievement,
      bestMonth,
      worstMonth,
      aboveAverage,
      belowAverage,
      quarterlyData,
      bestQuarter,
      worstQuarter,
    };
  };

  const generateReport = async () => {
    setIsGenerating(true);
    const year = parseInt(selectedYear);

    const reportDataResult = fetchDataForYear(selectedYear);
    setReportData(reportDataResult);

    const currentDate = new Date();
    const currentYear = getYear(currentDate);
    const currentMonthIndex = getMonth(currentDate); // 0-11
    const isPartialYear = year === currentYear && currentMonthIndex < 11;

    // Generuj analizę AI
    try {
      let prompt = "";
      let responseSchema = {};

      if (isPartialYear) {
        // Pobierz dane z roku poprzedniego dla porównania
        const prevYearData = fetchDataForYear((year - 1).toString());
        const currentMonthName = format(currentDate, 'LLLL', { locale });
        const monthsWithData = currentMonthIndex + 1;
        
        const prevYearMonthlyData = prevYearData.monthlyData.map(m => {
          const goalInfo = m.totalGoal > 0 ? ` | Cel: ${formatCurrency(m.totalGoal)} (${m.goalAchievement.toFixed(0)}%)` : '';
          return `${m.month}: ${formatCurrency(m.totalRevenue)} (${m.totalDays} dni, ${m.totalShifts} zmian)${goalInfo}`;
        }).join('\n');
        
        const currentYearPartialMonthlyData = reportDataResult.monthlyData
          .slice(0, monthsWithData)
          .map(m => {
            const goalInfo = m.totalGoal > 0 ? ` | Cel: ${formatCurrency(m.totalGoal)} (${m.goalAchievement.toFixed(0)}%)` : '';
            return `${m.month}: ${formatCurrency(m.totalRevenue)} (${m.totalDays} dni, ${m.totalShifts} zmian)${goalInfo}`;
          })
          .join('\n');

        // Porównaj analogiczny okres
        const prevYearSamePeriodRevenue = prevYearData.monthlyData.slice(0, monthsWithData).reduce((sum, m) => sum + m.totalRevenue, 0);
        const currentYearSamePeriodRevenue = reportDataResult.monthlyData.slice(0, monthsWithData).reduce((sum, m) => sum + m.totalRevenue, 0);
        const currentYearSamePeriodGoal = reportDataResult.monthlyData.slice(0, monthsWithData).reduce((sum, m) => sum + m.totalGoal, 0);

        prompt = `Jesteś ekspertem analityki biznesowej specjalizującym się w produkcji kontraktowej.

KONTEKST FIRMY:
CONSTRACT to zakład produkcji kontraktowej, który wytwarza wyroby dla dużych korporacji (m.in. IKEA). 
Firma NIE ma własnych produktów i NIE prowadzi działań marketingowych konsumenckich.
Obroty zależą od zamówień od klientów B2B, ich sezonowości i cykli produkcyjnych.

RAPORT CZĘŚCIOWY DLA ROKU ${year} (dane do ${currentMonthName}):
- Dotychczasowy obrót: ${formatCurrency(currentYearSamePeriodRevenue)}
- Średni miesięczny: ${formatCurrency(currentYearSamePeriodRevenue / monthsWithData)}
- Przepracowane dni: ${reportDataResult.totalYearDays}
- Przepracowane zmiany: ${reportDataResult.totalYearShifts}

DANE MIESIĘCZNE ${year} (dostępne do ${currentMonthName}):
${currentYearPartialMonthlyData}

DANE Z POPRZEDNIEGO ROKU ${year - 1} (pełny rok dla kontekstu):
- Całkowity obrót: ${formatCurrency(prevYearData.totalYearRevenue)}
- Średni miesięczny: ${formatCurrency(prevYearData.avgMonthlyRevenue)}
- Obrót w analogicznym okresie (${monthsWithData} miesięcy): ${formatCurrency(prevYearSamePeriodRevenue)}
- Przepracowane dni: ${prevYearData.totalYearDays}
- Przepracowane zmiany: ${prevYearData.totalYearShifts}

DANE MIESIĘCZNE ${year - 1}:
${prevYearMonthlyData}

PORÓWNANIE TEGO SAMEGO OKRESU:
- Różnica obrotów: ${formatCurrency(currentYearSamePeriodRevenue - prevYearSamePeriodRevenue)} (${((currentYearSamePeriodRevenue / prevYearSamePeriodRevenue - 1) * 100).toFixed(1)}%)
- Trend: ${currentYearSamePeriodRevenue > prevYearSamePeriodRevenue ? 'wzrostowy' : 'spadkowy'}

Wygeneruj PROFESJONALNY RAPORT PROGNOSTYCZNY DLA ZARZĄDU:

1. PODSUMOWANIE DOTYCHCZASOWEGO TRENDU (3-4 zdania):
- Porównaj dotychczasowe wyniki ${year} z analogicznym okresem ${year - 1}
- ${reportDataResult.totalYearGoal > 0 ? `Oceń realizację celu finansowego na ${year} i tempo jego osiągania` : 'Oceń tempo wzrostu/spadku'}
- Wpływ sezonowości na dotychczasowe wyniki
- Co wyróżnia bieżący rok względem ubiegłorocznego trendu

2. ANALIZA MIESIĘCZNA (1-2 zdania dla każdego miesiąca):
- Dla miesięcy z danymi: porównanie z ${year - 1}${reportDataResult.totalYearGoal > 0 ? ' i oceń realizację celu miesięcznego' : ' i ocena trendu'}
- Dla przyszłych miesięcy: prognoza na podstawie danych z ${year - 1}${reportDataResult.totalYearGoal > 0 ? ', wskaż co trzeba zrobić aby osiągnąć cel miesięczny' : ', wskazanie co musi się wydarzyć'}

3. PROGNOZA I OCZEKIWANIA NA POZOSTAŁĄ CZĘŚĆ ROKU:
- Na podstawie historii ${year - 1}, wskaż kiedy spodziewać się szczytów i spadków
- ${reportDataResult.totalYearGoal > 0 ? `Oceń realność osiągnięcia celu rocznego ${formatCurrency(reportDataResult.totalYearGoal)} i co musi się wydarzyć` : 'Co musi się zadziać w kolejnych miesiącach'}
- Porównaj bieżący trend z tym co było w ${year - 1} w analogicznych miesiącach
- Jak firma powinna się przygotować na sezonowość

4. WNIOSKI I REKOMENDACJE (5-6 punktów):
- Porównawcze wnioski operacyjne z ${year - 1}
- ${reportDataResult.totalYearGoal > 0 ? 'Konkretne rekomendacje dotyczące osiągnięcia celów finansowych' : 'Rekomendacje na pozostałą część roku'}
- Co wymaga poprawy w stosunku do ubiegłego roku
- NIE PROPONUJ akcji marketingowych ani rozwoju własnych produktów

Format odpowiedzi jako JSON:
{
"podsumowanie_roku": "tekst",
"analiza_miesieczna": {
"styczeń": "tekst",
"luty": "tekst",
"marzec": "tekst",
"kwiecień": "tekst",
"maj": "tekst",
"czerwiec": "tekst",
"lipiec": "tekst",
"sierpień": "tekst",
"wrzesień": "tekst",
"październik": "tekst",
"listopad": "tekst",
"grudzień": "tekst"
},
"trend": "tekst",
"wnioski": ["punkt 1", "punkt 2", ...]
}`;

        responseSchema = {
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
        };

      } else {
        // Dla pełnego roku
        const yearGoalsInfo = reportDataResult.totalYearGoal > 0
          ? `\nCELE FINANSOWE ROK ${year}:
- Cel roczny łączny: ${formatCurrency(reportDataResult.totalYearGoal)}
- Realizacja celu: ${reportDataResult.yearGoalAchievement.toFixed(1)}%
- ${reportDataResult.yearGoalAchievement >= 100 ? 'Cel został OSIĄGNIĘTY!' : `Brak do celu: ${formatCurrency(reportDataResult.totalYearGoal - reportDataResult.totalYearRevenue)}`}`
          : '';

        prompt = `Jesteś ekspertem analityki biznesowej specjalizującym się w produkcji kontraktowej.

KONTEKST FIRMY:
CONSTRACT to zakład produkcji kontraktowej, który wytwarza wyroby dla dużych korporacji (m.in. IKEA). 
Firma NIE ma własnych produktów i NIE prowadzi działań marketingowych konsumenckich.
Obroty zależą od zamówień od klientów B2B, ich sezonowości i cykli produkcyjnych.

DANE ROCZNE ${year}:
- Całkowity obrót: ${formatCurrency(reportDataResult.totalYearRevenue)}
- Średni obrót miesięczny: ${formatCurrency(reportDataResult.avgMonthlyRevenue)}
- Przepracowane dni: ${reportDataResult.totalYearDays}
- Przepracowane zmiany: ${reportDataResult.totalYearShifts}
${yearGoalsInfo}

DANE MIESIĘCZNE:
${reportDataResult.monthlyData.map(m => {
  const goalInfo = m.totalGoal > 0 ? ` | Cel: ${formatCurrency(m.totalGoal)} (${m.goalAchievement.toFixed(0)}%)` : '';
  return `${m.month}: ${formatCurrency(m.totalRevenue)} (${m.totalDays} dni, ${m.totalShifts} zmian)${goalInfo}`;
}).join('\n')}

NAJLEPSZY MIESIĄC: ${reportDataResult.bestMonth.month} - ${formatCurrency(reportDataResult.bestMonth.totalRevenue)}
NAJSŁABSZY MIESIĄC: ${reportDataResult.worstMonth.month} - ${formatCurrency(reportDataResult.worstMonth.totalRevenue)}

KWARTAŁY:
Q1: ${formatCurrency(reportDataResult.quarterlyData[0].totalRevenue)}
Q2: ${formatCurrency(reportDataResult.quarterlyData[1].totalRevenue)}
Q3: ${formatCurrency(reportDataResult.quarterlyData[2].totalRevenue)}
Q4: ${formatCurrency(reportDataResult.quarterlyData[3].totalRevenue)}

Wygeneruj PROFESJONALNY RAPORT DLA ZARZĄDU zawierający:

1. PODSUMOWANIE ROKU (3-4 zdania):
- Ocena realizacji produkcji i wykorzystania mocy wytwórczych
- ${reportDataResult.totalYearGoal > 0 ? `Ocena realizacji celów finansowych (osiągnięto ${reportDataResult.yearGoalAchievement.toFixed(1)}% celu)` : 'Porównanie dynamiki zamówień między pierwszą a drugą połową roku'}
- Wpływ sezonowości klientów i okresów przestojowych
- Ogólna wydajność operacyjna zakładu

2. ANALIZA MIESIĘCZNA (1-2 zwięzłe zdania dla każdego miesiąca):
- Ocena poziomu produkcji względem średniej${reportDataResult.totalYearGoal > 0 ? ' i realizacji celu miesięcznego' : ''}
- Związek z sezonowością zamówień od klientów B2B
- Ewentualne przestoje lub okresy intensywnej produkcji

3. TREND ROCZNY:
- Określ charakterystykę roku: wzrostowy, spadkowy, stabilny, sezonowy
- ${reportDataResult.totalYearGoal > 0 ? 'Oceń czy cele finansowe były realistyczne i jak wpłynęły na osiągnięte wyniki' : 'Powiąż z cyklami zamówień od głównych klientów'}
- Ocena przewidywalności wolumenu produkcji

4. WNIOSKI I REKOMENDACJE (5-6 punktów):
- Konkretne wnioski operacyjne dotyczące wykorzystania mocy produkcyjnych
- ${reportDataResult.totalYearGoal > 0 ? 'Rekomendacje dotyczące planowania celów na przyszłość na podstawie osiągniętych wyników' : 'Rekomendacje dotyczące planowania produkcji'}
- Propozycje optymalizacji w relacjach z klientami B2B
- Obszary do poprawy w zakresie efektywności produkcji
- NIE PROPONUJ akcji marketingowych ani rozwoju własnych produktów

Format odpowiedzi jako JSON:
{
"podsumowanie_roku": "tekst",
"analiza_miesieczna": {
"styczeń": "tekst",
"luty": "tekst",
"marzec": "tekst",
"kwiecień": "tekst",
"maj": "tekst",
"czerwiec": "tekst",
"lipiec": "tekst",
"sierpień": "tekst",
"wrzesień": "tekst",
"październik": "tekst",
"listopad": "tekst",
"grudzień": "tekst"
},
"trend": "tekst",
"wnioski": ["punkt 1", "punkt 2", ...]
}`;

        responseSchema = {
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
        };
      }

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: responseSchema
      });

      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Błąd generowania analizy AI:", error);
    }

    setIsGenerating(false);
  };

  const generateComparisonReport = async () => {
    setIsGeneratingComparison(true);
    try {
      const dataYear1 = fetchDataForYear(selectedYear1);
      const dataYear2 = fetchDataForYear(selectedYear2);
      setComparisonReportData({ year1: dataYear1, year2: dataYear2 });

      // Przygotuj scalone dane dla wykresów
      const mergedMonthlyData = dataYear1.monthlyData.map((m1, index) => {
        const m2 = dataYear2.monthlyData[index];
        return {
          monthNum: m1.monthNum,
          month: m1.month,
          totalRevenue1: m1.totalRevenue,
          totalRevenue2: m2.totalRevenue,
          revenueIkea1: m1.revenueIkea,
          revenueIkea2: m2.revenueIkea,
          revenueIkeaIndustry1: m1.revenueIkeaIndustry,
          revenueIkeaIndustry2: m2.revenueIkeaIndustry,
          revenueOthers1: m1.revenueOthers,
          revenueOthers2: m2.revenueOthers,
        };
      });

      // Generuj analizę AI porównawczą
      const prompt = `Jesteś ekspertem analityki biznesowej specjalizującym się w produkcji kontraktowej.

      KONTEKST FIRMY:
      CONSTRACT to zakład produkcji kontraktowej dla dużych korporacji (m.in. IKEA).
      Firma NIE ma własnych produktów - obroty zależą wyłącznie od zamówień B2B.

      PORÓWNANIE ROK ${dataYear1.year} vs ROK ${dataYear2.year}:

      ROK ${dataYear1.year}:
      - Całkowity obrót: ${formatCurrency(dataYear1.totalYearRevenue)}
      - Średni miesięczny: ${formatCurrency(dataYear1.avgMonthlyRevenue)}
      - Przepracowane dni: ${dataYear1.totalYearDays}
      - Przepracowane zmiany: ${dataYear1.totalYearShifts}

      ROK ${dataYear2.year}:
      - Całkowity obrót: ${formatCurrency(dataYear2.totalYearRevenue)}
      - Średni miesięczny: ${formatCurrency(dataYear2.avgMonthlyRevenue)}
      - Przepracowane dni: ${dataYear2.totalYearDays}
      - Przepracowane zmiany: ${dataYear2.totalYearShifts}

      RÓŻNICE:
      - Obrót: ${formatCurrency(dataYear2.totalYearRevenue - dataYear1.totalYearRevenue)} (${((dataYear2.totalYearRevenue / dataYear1.totalYearRevenue - 1) * 100).toFixed(1)}%)
      - Dni pracy: ${dataYear2.totalYearDays - dataYear1.totalYearDays}
      - Zmiany: ${dataYear2.totalYearShifts - dataYear1.totalYearShifts}

      DANE MIESIĘCZNE ${dataYear1.year}:
      ${dataYear1.monthlyData.map(m => `${m.month}: ${formatCurrency(m.totalRevenue)}`).join('\n')}

      DANE MIESIĘCZNE ${dataYear2.year}:
      ${dataYear2.monthlyData.map(m => `${m.month}: ${formatCurrency(m.totalRevenue)}`).join('\n')}

      Wygeneruj PROFESJONALNĄ ANALIZĘ PORÓWNAWCZĄ zawierającą:

      1. PODSUMOWANIE PORÓWNANIA (3-4 zdania):
      - Ogólna ocena zmian między latami
      - Czy nastąpił wzrost, spadek czy stabilizacja produkcji
      - Wpływ na wykorzystanie mocy produkcyjnych
      - Główne różnice w sezonowości i cyklach zamówień

      2. ANALIZA KORELACJI I TRENDÓW:
      - Czy oba lata mają podobny wzorzec sezonowości
      - Jakie miesiące rosną/maleją w obu latach
      - Czy punkty szczytowe i niskie występują w tych samych okresach
      - Ocena przewidywalności cykli produkcyjnych między latami

      3. WNIOSKI I REKOMENDACJE (4-5 punktów):
      - Konkretne wnioski z porównania obu lat
      - Co można przewidzieć na przyszłość na podstawie tych danych
      - Rekomendacje operacyjne wynikające z porównania
      - Obszary wymagające uwagi w kontekście obserwowanych zmian

      Format odpowiedzi jako JSON:
      {
        "podsumowanie_porownania": "tekst",
        "analiza_korelacji": "tekst",
        "wnioski": ["punkt 1", "punkt 2", ...]
      }`;

      const comparisonAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            podsumowanie_porownania: { type: "string" },
            analiza_korelacji: { type: "string" },
            wnioski: { type: "array", items: { type: "string" } }
          }
        }
      });

      setComparisonAiAnalysis(comparisonAnalysis);
      setComparisonReportData({ year1: dataYear1, year2: dataYear2, mergedMonthlyData });
    } catch (error) {
      console.error("Błąd generowania raportu porównawczego:", error);
      setComparisonReportData(null);
      setComparisonAiAnalysis(null);
    } finally {
      setIsGeneratingComparison(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const handleExportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Dodaj pierwszą stronę
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Dodaj kolejne strony jeśli potrzeba
      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`raport-roczny-${selectedYear}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Błąd podczas eksportu PDF. Sprawdź konsolę.');
    } finally {
      setIsExporting(false);
    }
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

        <Tabs defaultValue="annualReport" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="annualReport">{t('annualReport', language)}</TabsTrigger>
            <TabsTrigger value="financialGoals">
              <Target className="w-4 h-4 mr-2" />
              {t('financialGoals', language)}
            </TabsTrigger>
            <TabsTrigger value="yearComparison">{t('yearComparison', language)}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="annualReport">
            {/* Selektor roku dla pojedynczego raportu */}
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

            {/* Raport Roczny */}
            {reportData && (
              <>
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={handleExportToPDF}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'pl' ? 'Eksportowanie...' : 'Exporting...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {language === 'pl' ? 'Eksportuj do PDF' : 'Export to PDF'}
                      </>
                    )}
                  </Button>
                </div>
                <div ref={reportRef} className="space-y-6">
                  {/* Dashboard celów - jeśli są ustawione cele */}
                {financialGoals.filter(g => g.year === reportData.year).length > 0 && (
                  <GoalsDashboard 
                    reportData={reportData} 
                    goalsData={financialGoals.filter(g => g.year === reportData.year)}
                    language={language}
                  />
                )}

                {/* Analiza wysyłek ciężarówek */}
                <TrucksAnalysis 
                  reportData={reportData}
                  goalsData={financialGoals.filter(g => g.year === reportData.year)}
                  language={language}
                />

                {financialGoals.filter(g => g.year === reportData.year).length === 0 && (
                  <Card className="border-dashed border-2 border-amber-300 bg-amber-50">
                    <CardContent className="p-6 text-center">
                      <Target className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                      <p className="text-amber-800 mb-2 font-semibold">{t('noGoalsSet', language)}</p>
                      <p className="text-amber-700 text-sm mb-4">{t('setGoalsFirst', language)}</p>
                      <Button
                        onClick={() => setActiveTab("financialGoals")}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {t('manageFinancialGoals', language)}
                      </Button>
                    </CardContent>
                  </Card>
                )}

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
                      <p className="text-sm opacity-90 mb-1">
                        {language === 'pl' ? 'Dni przepracowane' : 'Days worked'}
                      </p>
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
                </>
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
          </TabsContent>
          
          <TabsContent value="financialGoals">
            <Card className="mb-6 shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  {t('manageFinancialGoals', language)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                    {t('selectYear', language)}
                  </label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <GoalsManager 
              year={selectedYear} 
              existingGoals={financialGoals.filter(g => g.year === parseInt(selectedYear))}
              language={language}
            />
          </TabsContent>
          
          <TabsContent value="yearComparison">
            <Card className="mb-6 shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {t('compareYears', language)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">{t('selectFirstYear', language)}</label>
                    <Select value={selectedYear1} onValueChange={setSelectedYear1}>
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
                  <div className="flex-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">{t('selectSecondYear', language)}</label>
                    <Select value={selectedYear2} onValueChange={setSelectedYear2}>
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
                    onClick={generateComparisonReport}
                    disabled={isGeneratingComparison || selectedYear1 === selectedYear2}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isGeneratingComparison ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('generating', language)}
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        {t('compareYears', language)}
                      </>
                    )}
                  </Button>
                </div>
                {selectedYear1 === selectedYear2 && (
                  <p className="text-red-500 text-sm mt-2">{t('cannotCompareSameYear', language)}</p>
                )}
              </CardContent>
            </Card>

            {comparisonReportData && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Year 1 Summary */}
                  <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardHeader>
                      <CardTitle>{t('yearOneSummary', language, { year1: comparisonReportData.year1.year })}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-sm opacity-90 mb-1">{t('totalRevenueYear', language)}</p>
                      <p className="text-3xl font-bold mb-4">{formatCurrency(comparisonReportData.year1.totalYearRevenue)}</p>
                      <p className="text-sm opacity-90 mb-1">{t('avgMonthlyRevenueYear', language)}</p>
                      <p className="text-xl font-bold">{formatCurrency(comparisonReportData.year1.avgMonthlyRevenue)}</p>
                      <p className="text-sm opacity-90 mb-1 mt-2">{t('totalDaysWorkedYear', language)}</p>
                      <p className="text-xl font-bold">{comparisonReportData.year1.totalYearDays}</p>
                      <p className="text-sm opacity-90 mb-1 mt-2">{t('totalShiftsWorkedYear', language)}</p>
                      <p className="text-xl font-bold">{comparisonReportData.year1.totalYearShifts}</p>
                    </CardContent>
                  </Card>

                  {/* Year 2 Summary */}
                  <Card className="shadow-lg border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <CardHeader>
                      <CardTitle>{t('yearTwoSummary', language, { year2: comparisonReportData.year2.year })}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-sm opacity-90 mb-1">{t('totalRevenueYear', language)}</p>
                      <p className="text-3xl font-bold mb-4">{formatCurrency(comparisonReportData.year2.totalYearRevenue)}</p>
                      <p className="text-sm opacity-90 mb-1">{t('avgMonthlyRevenueYear', language)}</p>
                      <p className="text-xl font-bold">{formatCurrency(comparisonReportData.year2.avgMonthlyRevenue)}</p>
                      <p className="text-sm opacity-90 mb-1 mt-2">{t('totalDaysWorkedYear', language)}</p>
                      <p className="text-xl font-bold">{comparisonReportData.year2.totalYearDays}</p>
                      <p className="text-sm opacity-90 mb-1 mt-2">{t('totalShiftsWorkedYear', language)}</p>
                      <p className="text-xl font-bold">{comparisonReportData.year2.totalYearShifts}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Podsumowanie porównania AI */}
                {comparisonAiAnalysis && (
                  <Card className="shadow-lg border-none border-l-4 border-l-indigo-600">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <CardTitle>
                        {language === 'pl' 
                          ? `Podsumowanie porównania ${comparisonReportData.year1.year} vs ${comparisonReportData.year2.year}`
                          : `Comparison Summary ${comparisonReportData.year1.year} vs ${comparisonReportData.year2.year}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-slate-700 leading-relaxed text-lg">{comparisonAiAnalysis.podsumowanie_porownania}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison Metrics Table */}
                <Card className="shadow-lg border-none">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle>{t('comparisonMetrics', language)}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('metric', language)}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {comparisonReportData.year1.year}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {comparisonReportData.year2.year}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('difference', language)}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t('totalRevenue', language)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(comparisonReportData.year1.totalYearRevenue)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(comparisonReportData.year2.totalYearRevenue)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {formatCurrency(comparisonReportData.year2.totalYearRevenue - comparisonReportData.year1.totalYearRevenue)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t('avgMonthlyRevenue', language)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(comparisonReportData.year1.avgMonthlyRevenue)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(comparisonReportData.year2.avgMonthlyRevenue)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {formatCurrency(comparisonReportData.year2.avgMonthlyRevenue - comparisonReportData.year1.avgMonthlyRevenue)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t('daysWorked', language)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comparisonReportData.year1.totalYearDays}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comparisonReportData.year2.totalYearDays}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {comparisonReportData.year2.totalYearDays - comparisonReportData.year1.totalYearDays}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t('shiftsWorked', language)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comparisonReportData.year1.totalYearShifts}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comparisonReportData.year2.totalYearShifts}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {comparisonReportData.year2.totalYearShifts - comparisonReportData.year1.totalYearShifts}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t('revenuePerDay', language)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(comparisonReportData.year1.totalYearDays > 0 ? comparisonReportData.year1.totalYearRevenue / comparisonReportData.year1.totalYearDays : 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(comparisonReportData.year2.totalYearDays > 0 ? comparisonReportData.year2.totalYearRevenue / comparisonReportData.year2.totalYearDays : 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {formatCurrency(
                                (comparisonReportData.year2.totalYearDays > 0 ? comparisonReportData.year2.totalYearRevenue / comparisonReportData.year2.totalYearDays : 0) -
                                (comparisonReportData.year1.totalYearDays > 0 ? comparisonReportData.year1.totalYearRevenue / comparisonReportData.year1.totalYearDays : 0)
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t('revenuePerShift', language)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(comparisonReportData.year1.totalYearShifts > 0 ? comparisonReportData.year1.totalYearRevenue / comparisonReportData.year1.totalYearShifts : 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(comparisonReportData.year2.totalYearShifts > 0 ? comparisonReportData.year2.totalYearRevenue / comparisonReportData.year2.totalYearShifts : 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {formatCurrency(
                                (comparisonReportData.year2.totalYearShifts > 0 ? comparisonReportData.year2.totalYearRevenue / comparisonReportData.year2.totalYearShifts : 0) -
                                (comparisonReportData.year1.totalYearShifts > 0 ? comparisonReportData.year1.totalYearRevenue / comparisonReportData.year1.totalYearShifts : 0)
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Comparison Charts */}
                <Card className="shadow-lg border-none">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle>{t('monthlyTrendTotal', language)}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={comparisonReportData.mergedMonthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                        <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="totalRevenue1" stroke="#4F46E5" strokeWidth={3} name={`${comparisonReportData.year1.year}`} />
                        <Line type="monotone" dataKey="totalRevenue2" stroke="#10B981" strokeWidth={3} name={`${comparisonReportData.year2.year}`} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Breakdown Comparison */}
                <Card className="shadow-lg border-none">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle>{t('monthlyTrendBreakdown', language)}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={comparisonReportData.mergedMonthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                        <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenueIkea1" stroke="#3B82F6" strokeWidth={2} name={`IKEA SUPPLY ${comparisonReportData.year1.year}`} />
                        <Line type="monotone" dataKey="revenueIkea2" stroke="#60A5FA" strokeWidth={2} name={`IKEA SUPPLY ${comparisonReportData.year2.year}`} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="revenueIkeaIndustry1" stroke="#9333EA" strokeWidth={2} name={`IKEA INDUSTRY ${comparisonReportData.year1.year}`} />
                        <Line type="monotone" dataKey="revenueIkeaIndustry2" stroke="#C084FC" strokeWidth={2} name={`IKEA INDUSTRY ${comparisonReportData.year2.year}`} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="revenueOthers1" stroke="#10B981" strokeWidth={2} name={`POZOSTALI ${comparisonReportData.year1.year}`} />
                        <Line type="monotone" dataKey="revenueOthers2" stroke="#34D399" strokeWidth={2} name={`POZOSTALI ${comparisonReportData.year2.year}`} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Analiza korelacji AI */}
                {comparisonAiAnalysis && (
                  <Card className="shadow-lg border-none border-l-4 border-l-purple-600">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle>
                        {language === 'pl' ? 'Analiza korelacji i trendów' : 'Correlation and Trends Analysis'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-slate-700 leading-relaxed">{comparisonAiAnalysis.analiza_korelacji}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Wnioski z porównania */}
                {comparisonAiAnalysis && (
                  <Card className="shadow-lg border-none border-l-4 border-l-amber-600">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                      <CardTitle>{t('conclusionsRecommendations', language)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-3">
                        {comparisonAiAnalysis.wnioski.map((wniosek, index) => (
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

            {!comparisonReportData && !isGeneratingComparison && (
              <Card className="border-dashed border-2 border-slate-300">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">
                    {language === 'pl' 
                      ? 'Wybierz dwa lata powyżej, aby wygenerować raport porównawczy z analizą korelacji'
                      : 'Select two years above to generate a comparative report with correlation analysis'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}