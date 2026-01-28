import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { base44 } from "@/api/base44Client";
import { t } from "@/components/translations";

export default function ForecastingAnalysis({ workDays, financialGoals, language }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [forecastMonths, setForecastMonths] = useState(3);
  const [scenarioPercent, setScenarioPercent] = useState(0);
  const [forecastData, setForecastData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029"];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { 
      style: 'currency', 
      currency: 'PLN', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      const yearInt = parseInt(selectedYear);
      const currentDate = new Date();
      const isCurrentYear = yearInt === currentDate.getFullYear();
      
      // Zbierz dane historyczne
      const historicalData = [];
      for (let year = yearInt - 2; year <= yearInt; year++) {
        const yearWorkDays = workDays.filter(wd => new Date(wd.date).getFullYear() === year);
        
        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);
          
          const monthDays = yearWorkDays.filter(wd => {
            const date = new Date(wd.date);
            return date >= monthStart && date <= monthEnd;
          });

          const totalRevenue = monthDays.reduce((sum, wd) => 
            sum + (wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0), 0);
          const totalTrucks = monthDays.reduce((sum, wd) => 
            sum + (wd.trucks_ikea || 0) + (wd.trucks_ikea_industry || 0) + (wd.trucks_others || 0), 0);
          const totalShifts = monthDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);

          historicalData.push({
            year,
            month: month + 1,
            revenue: totalRevenue,
            trucks: totalTrucks,
            shifts: totalShifts,
            days: monthDays.length
          });
        }
      }

      // Przygotuj prompt dla AI
      const prompt = `Jesteś ekspertem analityki biznesowej w produkcji kontraktowej. 
      
FIRMA: CONSTRACT - zakład produkcji kontraktowej dla IKEA i innych klientów B2B.

DANE HISTORYCZNE (3 ostatnie lata, miesięczne):
${historicalData.map(d => `${d.year}-${d.month}: Obrót: ${formatCurrency(d.revenue)}, Ciężarówki: ${d.trucks}, Zmiany: ${d.shifts}, Dni: ${d.days}`).join('\n')}

ROK ANALIZY: ${yearInt}
MIESIĄCE DO PROGNOZY: ${forecastMonths}
SCENARIUSZ: ${scenarioPercent > 0 ? `+${scenarioPercent}%` : scenarioPercent < 0 ? `${scenarioPercent}%` : 'Bazowy'} zmiana produkcji

CELE FINANSOWE NA ${yearInt}:
${financialGoals.filter(g => g.year === yearInt).map(g => 
  `Miesiąc ${g.month}: IKEA SUPPLY: ${formatCurrency(g.revenue_ikea_goal || 0)}, IKEA INDUSTRY: ${formatCurrency(g.revenue_ikea_industry_goal || 0)}, POZOSTALI: ${formatCurrency(g.revenue_others_goal || 0)}`
).join('\n') || 'Brak celów'}

ZADANIE:
1. Przeanalizuj sezonowość i trendy z danych historycznych
2. Wygeneruj prognozę na ${forecastMonths} kolejnych miesięcy
3. Uwzględnij scenariusz zmiany produkcji (${scenarioPercent}%)
4. Oceń prawdopodobieństwo osiągnięcia celów finansowych

Format odpowiedzi JSON:
{
  "forecast": [
    {
      "month": 1-12,
      "monthName": "nazwa miesiąca",
      "predictedRevenue": liczba,
      "confidence": "high|medium|low",
      "expectedTrucks": liczba,
      "expectedShifts": liczba
    }
  ],
  "seasonality": {
    "pattern": "opis wzorca sezonowości",
    "peakMonths": ["miesiące szczytowe"],
    "lowMonths": ["miesiące niskie"]
  },
  "trends": {
    "overall": "opis ogólnego trendu",
    "yearOverYear": "% zmiana r/r",
    "acceleration": "czy trend przyspiesza czy zwalnia"
  },
  "goalAnalysis": {
    "achievable": true|false,
    "likelihood": "very-high|high|medium|low|very-low",
    "reasoning": "uzasadnienie",
    "risks": ["ryzyko 1", "ryzyko 2"],
    "recommendations": ["rekomendacja 1", "rekomendacja 2"]
  },
  "scenarioImpact": "opis wpływu scenariusza"
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "number" },
                  monthName: { type: "string" },
                  predictedRevenue: { type: "number" },
                  confidence: { type: "string" },
                  expectedTrucks: { type: "number" },
                  expectedShifts: { type: "number" }
                }
              }
            },
            seasonality: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                peakMonths: { type: "array", items: { type: "string" } },
                lowMonths: { type: "array", items: { type: "string" } }
              }
            },
            trends: {
              type: "object",
              properties: {
                overall: { type: "string" },
                yearOverYear: { type: "string" },
                acceleration: { type: "string" }
              }
            },
            goalAnalysis: {
              type: "object",
              properties: {
                achievable: { type: "boolean" },
                likelihood: { type: "string" },
                reasoning: { type: "string" },
                risks: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            scenarioImpact: { type: "string" }
          }
        }
      });

      // Przygotuj dane do wykresów (historyczne + prognoza)
      const currentYearData = historicalData.filter(d => d.year === yearInt);
      const chartData = currentYearData.map(d => ({
        month: d.month,
        actualRevenue: d.revenue,
        predictedRevenue: null,
        isActual: true
      }));

      // Dodaj prognozy
      analysis.forecast.forEach(f => {
        const existingIndex = chartData.findIndex(d => d.month === f.month);
        if (existingIndex >= 0) {
          chartData[existingIndex].predictedRevenue = f.predictedRevenue;
        } else {
          chartData.push({
            month: f.month,
            monthName: f.monthName,
            actualRevenue: null,
            predictedRevenue: f.predictedRevenue,
            isActual: false
          });
        }
      });

      chartData.sort((a, b) => a.month - b.month);

      setForecastData({
        ...analysis,
        chartData,
        historicalData: currentYearData
      });
    } catch (error) {
      console.error("Błąd generowania prognozy:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLikelihoodColor = (likelihood) => {
    switch (likelihood) {
      case 'very-high': return 'bg-green-600';
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'very-low': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Kontrolki prognozy */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {language === 'pl' ? 'Generowanie Prognozy' : 'Generate Forecast'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>{language === 'pl' ? 'Rok analizy' : 'Analysis Year'}</Label>
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
            <div>
              <Label>{language === 'pl' ? 'Miesiące prognozy' : 'Forecast Months'}</Label>
              <Select value={forecastMonths.toString()} onValueChange={(v) => setForecastMonths(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 9, 12].map(m => (
                    <SelectItem key={m} value={m.toString()}>{m} {language === 'pl' ? 'mies.' : 'mo.'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'pl' ? 'Scenariusz "Co jeśli?"' : 'What-if Scenario'}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={scenarioPercent}
                  onChange={(e) => setScenarioPercent(parseInt(e.target.value) || 0)}
                  className="w-24"
                  placeholder="0"
                />
                <span className="flex items-center text-sm text-slate-600">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'pl' ? 'np. +15 dla wzrostu o 15%' : 'e.g. +15 for 15% growth'}
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateForecast}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'pl' ? 'Generowanie...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {language === 'pl' ? 'Generuj' : 'Generate'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {forecastData && (
        <>
          {/* Analiza osiągalności celów */}
          <Card className={`shadow-lg border-none border-l-4 ${
            forecastData.goalAnalysis.achievable ? 'border-l-green-600' : 'border-l-red-600'
          }`}>
            <CardHeader className={`${
              forecastData.goalAnalysis.achievable 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                : 'bg-gradient-to-r from-red-50 to-orange-50'
            }`}>
              <CardTitle className="flex items-center gap-2">
                {forecastData.goalAnalysis.achievable ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                {language === 'pl' ? 'Analiza Osiągalności Celów' : 'Goal Achievability Analysis'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    {language === 'pl' ? 'Prawdopodobieństwo osiągnięcia:' : 'Likelihood of achievement:'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getLikelihoodColor(forecastData.goalAnalysis.likelihood)}`}>
                    {forecastData.goalAnalysis.likelihood.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{forecastData.goalAnalysis.reasoning}</p>
              </div>

              {scenarioPercent !== 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {language === 'pl' ? 'Wpływ Scenariusza' : 'Scenario Impact'}
                  </h4>
                  <p className="text-blue-800 text-sm">{forecastData.scenarioImpact}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    {language === 'pl' ? 'Zidentyfikowane Ryzyka' : 'Identified Risks'}
                  </h4>
                  <ul className="space-y-2">
                    {forecastData.goalAnalysis.risks.map((risk, index) => (
                      <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {language === 'pl' ? 'Rekomendacje' : 'Recommendations'}
                  </h4>
                  <ul className="space-y-2">
                    {forecastData.goalAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wykres prognozy */}
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle>{language === 'pl' ? 'Prognoza Przychodów' : 'Revenue Forecast'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="actualRevenue" 
                    stroke="#4F46E5" 
                    fill="url(#actualGradient)" 
                    name={language === 'pl' ? 'Rzeczywisty' : 'Actual'}
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predictedRevenue" 
                    stroke="#10B981" 
                    fill="url(#forecastGradient)" 
                    name={language === 'pl' ? 'Prognoza' : 'Forecast'}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Analiza sezonowości */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle>{language === 'pl' ? 'Analiza Sezonowości' : 'Seasonality Analysis'}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-700 mb-4">{forecastData.seasonality.pattern}</p>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      {language === 'pl' ? 'Miesiące szczytowe:' : 'Peak months:'}
                    </p>
                    <p className="text-sm text-green-700">{forecastData.seasonality.peakMonths.join(', ')}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      {language === 'pl' ? 'Miesiące niskie:' : 'Low months:'}
                    </p>
                    <p className="text-sm text-red-700">{forecastData.seasonality.lowMonths.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle>{language === 'pl' ? 'Analiza Trendów' : 'Trend Analysis'}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      {language === 'pl' ? 'Trend ogólny:' : 'Overall trend:'}
                    </p>
                    <p className="text-sm text-slate-700">{forecastData.trends.overall}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      {language === 'pl' ? 'Zmiana rok do roku:' : 'Year-over-year change:'}
                    </p>
                    <p className="text-sm text-slate-700">{forecastData.trends.yearOverYear}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      {language === 'pl' ? 'Dynamika:' : 'Acceleration:'}
                    </p>
                    <p className="text-sm text-slate-700">{forecastData.trends.acceleration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Szczegółowa tabela prognozy */}
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
              <CardTitle>{language === 'pl' ? 'Szczegółowa Prognoza Miesięczna' : 'Detailed Monthly Forecast'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {language === 'pl' ? 'Miesiąc' : 'Month'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {language === 'pl' ? 'Prognozowany obrót' : 'Predicted Revenue'}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {language === 'pl' ? 'Pewność' : 'Confidence'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {language === 'pl' ? 'Ciężarówki' : 'Trucks'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {language === 'pl' ? 'Zmiany' : 'Shifts'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {forecastData.forecast.map((f) => (
                      <tr key={f.month}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{f.monthName}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 font-semibold">
                          {formatCurrency(f.predictedRevenue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(f.confidence)}`}>
                            {f.confidence.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{Math.round(f.expectedTrucks)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{Math.round(f.expectedShifts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!forecastData && !isGenerating && (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">
              {language === 'pl' 
                ? 'Wybierz parametry powyżej i wygeneruj prognozę z analizą trendów i sezonowości'
                : 'Select parameters above and generate a forecast with trend and seasonality analysis'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}