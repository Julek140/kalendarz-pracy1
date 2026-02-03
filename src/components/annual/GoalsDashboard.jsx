import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/components/translations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { Button } from "@/components/ui/button";

function MonthlySourceGoals({ chartData, language, formatCurrency }) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  
  const monthData = chartData[currentMonthIndex];
  
  const goNext = () => {
    if (currentMonthIndex < chartData.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };
  
  const goPrev = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };
  
  const sources = [
    {
      name: "IKEA SUPPLY",
      actual: monthData.revenueIkea,
      goal: monthData.goalIkea,
      color: "blue"
    },
    {
      name: "IKEA INDUSTRY",
      actual: monthData.revenueIkeaIndustry,
      goal: monthData.goalIkeaIndustry,
      color: "purple"
    },
    {
      name: "POZOSTALI",
      actual: monthData.revenueOthers,
      goal: monthData.goalOthers,
      color: "green"
    }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentMonthIndex === 0}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-2xl font-bold capitalize">{monthData.month}</h3>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={currentMonthIndex === chartData.length - 1}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {sources.map((source) => {
          const achievement = source.goal > 0 ? (source.actual / source.goal * 100) : 0;
          const colorClasses = {
            blue: {
              bg: achievement >= 100 ? 'bg-blue-50 border-blue-300' : achievement >= 90 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300',
              text: achievement >= 100 ? 'text-blue-600' : achievement >= 90 ? 'text-yellow-600' : 'text-red-600',
              icon: achievement >= 100 ? 'text-blue-600' : achievement >= 90 ? 'text-yellow-600' : 'text-red-600',
            },
            purple: {
              bg: achievement >= 100 ? 'bg-purple-50 border-purple-300' : achievement >= 90 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300',
              text: achievement >= 100 ? 'text-purple-600' : achievement >= 90 ? 'text-yellow-600' : 'text-red-600',
              icon: achievement >= 100 ? 'text-purple-600' : achievement >= 90 ? 'text-yellow-600' : 'text-red-600',
            },
            green: {
              bg: achievement >= 100 ? 'bg-green-50 border-green-300' : achievement >= 90 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300',
              text: achievement >= 100 ? 'text-green-600' : achievement >= 90 ? 'text-yellow-600' : 'text-red-600',
              icon: achievement >= 100 ? 'text-green-600' : achievement >= 90 ? 'text-yellow-600' : 'text-red-600',
            }
          };
          
          return (
            <div key={source.name} className={`p-4 rounded-lg border-2 ${colorClasses[source.color].bg}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">{source.name}</h4>
                {achievement >= 100 ? (
                  <CheckCircle className={`w-5 h-5 ${colorClasses[source.color].icon}`} />
                ) : achievement >= 90 ? (
                  <TrendingUp className={`w-5 h-5 ${colorClasses[source.color].icon}`} />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${colorClasses[source.color].icon}`} />
                )}
              </div>
              <Progress value={Math.min(achievement, 100)} className="h-2 mb-2" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('achieved', language)}:</span>
                  <span className="font-semibold">{formatCurrency(source.actual)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('goal', language)}:</span>
                  <span className="font-semibold">{formatCurrency(source.goal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-bold ${colorClasses[source.color].text}`}>
                    {source.goal > 0 ? `${achievement.toFixed(1)}%` : '-'}
                  </span>
                  {source.goal > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      achievement >= 100 ? 'bg-green-200 text-green-800' :
                      achievement >= 90 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {achievement >= 100 ? (language === 'pl' ? 'Cel osiągnięty' : 'Goal met') :
                       achievement >= 90 ? (language === 'pl' ? 'Na dobrej drodze' : 'On track') :
                       (language === 'pl' ? 'Poniżej celu' : 'Below goal')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalsDashboard({ reportData, goalsData, language }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { 
      style: 'currency', 
      currency: 'PLN', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  // Przygotuj dane do wizualizacji
  const chartData = reportData.monthlyData.map(month => {
    const goal = goalsData?.find(g => g.month === month.monthNum);
    const totalGoal = goal 
      ? (goal.revenue_ikea_goal || 0) + (goal.revenue_ikea_industry_goal || 0) + (goal.revenue_others_goal || 0)
      : 0;
    
    return {
      month: month.month,
      monthNum: month.monthNum,
      actualRevenue: month.totalRevenue,
      goalRevenue: totalGoal,
      revenueIkea: month.revenueIkea,
      revenueIkeaIndustry: month.revenueIkeaIndustry,
      revenueOthers: month.revenueOthers,
      goalIkea: goal?.revenue_ikea_goal || 0,
      goalIkeaIndustry: goal?.revenue_ikea_industry_goal || 0,
      goalOthers: goal?.revenue_others_goal || 0,
      achievement: totalGoal > 0 ? (month.totalRevenue / totalGoal * 100) : 0,
    };
  });

  // Oblicz roczne statystyki
  const totalActualRevenue = reportData.totalYearRevenue;
  const totalGoalRevenue = goalsData?.reduce((sum, g) => 
    sum + (g.revenue_ikea_goal || 0) + (g.revenue_ikea_industry_goal || 0) + (g.revenue_others_goal || 0), 0) || 0;
  const overallAchievement = totalGoalRevenue > 0 ? (totalActualRevenue / totalGoalRevenue * 100) : 0;

  // Oblicz statystyki dla każdego źródła
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isCurrentYear = reportData.year === currentYear;
  
  const totalActualIkea = reportData.monthlyData.reduce((sum, m) => sum + (m.revenueIkea || 0), 0);
  const totalActualIkeaIndustry = reportData.monthlyData.reduce((sum, m) => sum + (m.revenueIkeaIndustry || 0), 0);
  const totalActualOthers = reportData.monthlyData.reduce((sum, m) => sum + (m.revenueOthers || 0), 0);

  // Cele ROCZNE (cały rok)
  const totalGoalIkea = goalsData?.reduce((sum, g) => sum + (g.revenue_ikea_goal || 0), 0) || 0;
  const totalGoalIkeaIndustry = goalsData?.reduce((sum, g) => sum + (g.revenue_ikea_industry_goal || 0), 0) || 0;
  const totalGoalOthers = goalsData?.reduce((sum, g) => sum + (g.revenue_others_goal || 0), 0) || 0;

  // Dla bieżącego roku: oblicz prognozę dla każdego źródła
  let projectedIkea = totalActualIkea;
  let projectedIkeaIndustry = totalActualIkeaIndustry;
  let projectedOthers = totalActualOthers;
  
  if (isCurrentYear && currentMonth < 12) {
    const monthsElapsed = reportData.monthlyData.filter(m => m.monthNum <= currentMonth && m.totalDays > 0).length;
    if (monthsElapsed > 0) {
      const avgMonthlyIkea = totalActualIkea / monthsElapsed;
      const avgMonthlyIkeaIndustry = totalActualIkeaIndustry / monthsElapsed;
      const avgMonthlyOthers = totalActualOthers / monthsElapsed;
      const monthsRemaining = 12 - currentMonth;
      
      projectedIkea = totalActualIkea + (avgMonthlyIkea * monthsRemaining);
      projectedIkeaIndustry = totalActualIkeaIndustry + (avgMonthlyIkeaIndustry * monthsRemaining);
      projectedOthers = totalActualOthers + (avgMonthlyOthers * monthsRemaining);
    }
  }

  // Achievement na podstawie prognozy dla bieżącego roku, faktycznych wyników dla przeszłych
  const achievementIkea = totalGoalIkea > 0 ? ((isCurrentYear ? projectedIkea : totalActualIkea) / totalGoalIkea * 100) : 0;
  const achievementIkeaIndustry = totalGoalIkeaIndustry > 0 ? ((isCurrentYear ? projectedIkeaIndustry : totalActualIkeaIndustry) / totalGoalIkeaIndustry * 100) : 0;
  const achievementOthers = totalGoalOthers > 0 ? ((isCurrentYear ? projectedOthers : totalActualOthers) / totalGoalOthers * 100) : 0;

  // Oblicz prognozę na koniec roku - TYLKO na podstawie pełnych, zakończonych miesięcy
  let projectedRevenue = totalActualRevenue;
  let remainingGoal = 0;
  let isTrendInsufficient = false;
  let fullyCompletedMonthsCount = 0;
  let monthsRemainingInYearForProjection = 0;
  
  if (isCurrentYear && currentMonth < 12) {
    // Liczymy tylko pełne, zakończone miesiące (jeśli jest luty 03, liczymy tylko styczeń)
    fullyCompletedMonthsCount = Math.max(0, currentMonth - 1);
    
    // Obrót z pełnych miesięcy
    const actualRevenueFromCompletedMonths = reportData.monthlyData
      .filter(m => m.monthNum <= fullyCompletedMonthsCount)
      .reduce((sum, m) => sum + m.totalRevenue, 0);
    
    // Średnia miesięczna z pełnych miesięcy
    const avgMonthlyActual = fullyCompletedMonthsCount > 0 
      ? actualRevenueFromCompletedMonths / fullyCompletedMonthsCount 
      : 0;
    
    // Pozostałe miesiące do projekcji
    monthsRemainingInYearForProjection = 12 - fullyCompletedMonthsCount;
    
    // Prognoza = obrót z pełnych miesięcy + prognoza dla pozostałych
    projectedRevenue = actualRevenueFromCompletedMonths + (avgMonthlyActual * monthsRemainingInYearForProjection);
    remainingGoal = totalGoalRevenue - totalActualRevenue;
    
    // Trend jest niewystarczający tylko jeśli PROGNOZA jest poniżej celu
    isTrendInsufficient = projectedRevenue < totalGoalRevenue;
  } else {
    // Dla przeszłych/przyszłych lat: sprawdź czy osiągnięto cel
    isTrendInsufficient = totalActualRevenue < totalGoalRevenue;
  }

  return (
    <div className="space-y-6">
      {/* Główny wskaźnik */}
      <Card className={`shadow-lg border-none border-l-4 ${
        overallAchievement >= 100 ? 'border-l-green-600' : 
        overallAchievement >= 90 ? 'border-l-yellow-600' : 
        'border-l-red-600'
      }`}>
        <CardHeader className={`${
          overallAchievement >= 100 ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 
          overallAchievement >= 90 ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : 
          'bg-gradient-to-r from-red-50 to-orange-50'
        }`}>
          <CardTitle className="flex items-center justify-between">
            <span>{t('yearlyGoalSummary', language)}</span>
            {overallAchievement >= 100 ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : overallAchievement >= 90 ? (
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">{t('actualRevenue', language)}</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalActualRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">{t('annualGoalTotal', language)}</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalGoalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">{t('goalAchievement', language)}</p>
              <p className={`text-3xl font-bold ${
                overallAchievement >= 100 ? 'text-green-600' : 
                overallAchievement >= 90 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {overallAchievement.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={Math.min(overallAchievement, 100)} className="h-3" />
          </div>

          {isCurrentYear && currentMonth < 12 && (
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">{t('projectedAnnualRevenue', language)}</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(projectedRevenue)}</p>
              </div>
              <div className={`p-4 rounded-lg border ${
                projectedRevenue >= totalGoalRevenue 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm mb-1 ${
                  projectedRevenue >= totalGoalRevenue ? 'text-green-700' : 'text-red-700'
                }`}>
                  {projectedRevenue >= totalGoalRevenue ? t('trendOnTrack', language) : t('trendInsufficient', language)}
                </p>
                <p className={`text-xl font-bold ${
                  projectedRevenue >= totalGoalRevenue ? 'text-green-900' : 'text-red-900'
                }`}>
                  {projectedRevenue >= totalGoalRevenue ? '+' : ''}{formatCurrency(projectedRevenue - totalGoalRevenue)}
                </p>
              </div>
            </div>
          )}

          {isTrendInsufficient && isCurrentYear && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">{t('needsImprovement', language)}</p>
                <p>
                  {language === 'pl' 
                    ? `Prognozowany obrót roczny (${formatCurrency(projectedRevenue)}) jest poniżej celu. Wymagane jest zwiększenie średniego miesięcznego obrotu o ${formatCurrency((totalGoalRevenue - projectedRevenue) / Math.max(1, monthsRemainingInYearForProjection))}, aby osiągnąć roczny cel.`
                    : `Projected annual revenue (${formatCurrency(projectedRevenue)}) is below target. An increase in average monthly revenue of ${formatCurrency((totalGoalRevenue - projectedRevenue) / Math.max(1, monthsRemainingInYearForProjection))} is required to meet the annual goal.`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rozbicie na źródła przychodów */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle>{language === 'pl' ? 'Realizacja celów według źródeł' : 'Goal Achievement by Source'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <MonthlySourceGoals chartData={chartData} language={language} formatCurrency={formatCurrency} />
        </CardContent>
      </Card>

      {/* Podsumowanie roczne według źródeł */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle>{language === 'pl' ? 'Podsumowanie roczne według źródeł' : 'Annual Summary by Source'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* IKEA SUPPLY */}
            <div className={`p-4 rounded-lg border-2 ${
              achievementIkea >= 100 ? 'bg-green-50 border-green-300' :
              achievementIkea >= 90 ? 'bg-yellow-50 border-yellow-300' :
              'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">IKEA SUPPLY</h4>
                {achievementIkea >= 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : achievementIkea >= 90 ? (
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <Progress value={Math.min(achievementIkea, 100)} className="h-2 mb-2" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('achieved', language)}:</span>
                  <span className="font-semibold">{formatCurrency(totalActualIkea)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('goal', language)}:</span>
                  <span className="font-semibold">{formatCurrency(totalGoalIkea)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-bold ${
                    achievementIkea >= 100 ? 'text-green-600' :
                    achievementIkea >= 90 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {achievementIkea.toFixed(1)}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    achievementIkea >= 100 ? 'bg-green-200 text-green-800' :
                    achievementIkea >= 90 ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {achievementIkea >= 100 ? (language === 'pl' ? 'Cel osiągnięty' : 'Goal met') :
                     achievementIkea >= 90 ? (language === 'pl' ? 'Na dobrej drodze' : 'On track') :
                     (language === 'pl' ? 'Poniżej celu' : 'Below goal')}
                  </span>
                </div>
              </div>
            </div>

            {/* IKEA INDUSTRY */}
            <div className={`p-4 rounded-lg border-2 ${
              achievementIkeaIndustry >= 100 ? 'bg-green-50 border-green-300' :
              achievementIkeaIndustry >= 90 ? 'bg-yellow-50 border-yellow-300' :
              'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">IKEA INDUSTRY</h4>
                {achievementIkeaIndustry >= 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : achievementIkeaIndustry >= 90 ? (
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <Progress value={Math.min(achievementIkeaIndustry, 100)} className="h-2 mb-2" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('achieved', language)}:</span>
                  <span className="font-semibold">{formatCurrency(totalActualIkeaIndustry)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('goal', language)}:</span>
                  <span className="font-semibold">{formatCurrency(totalGoalIkeaIndustry)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-bold ${
                    achievementIkeaIndustry >= 100 ? 'text-green-600' :
                    achievementIkeaIndustry >= 90 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {achievementIkeaIndustry.toFixed(1)}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    achievementIkeaIndustry >= 100 ? 'bg-green-200 text-green-800' :
                    achievementIkeaIndustry >= 90 ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {achievementIkeaIndustry >= 100 ? (language === 'pl' ? 'Cel osiągnięty' : 'Goal met') :
                     achievementIkeaIndustry >= 90 ? (language === 'pl' ? 'Na dobrej drodze' : 'On track') :
                     (language === 'pl' ? 'Poniżej celu' : 'Below goal')}
                  </span>
                </div>
              </div>
            </div>

            {/* POZOSTALI */}
            <div className={`p-4 rounded-lg border-2 ${
              achievementOthers >= 100 ? 'bg-green-50 border-green-300' :
              achievementOthers >= 90 ? 'bg-yellow-50 border-yellow-300' :
              'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">POZOSTALI</h4>
                {achievementOthers >= 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : achievementOthers >= 90 ? (
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <Progress value={Math.min(achievementOthers, 100)} className="h-2 mb-2" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('achieved', language)}:</span>
                  <span className="font-semibold">{formatCurrency(totalActualOthers)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('goal', language)}:</span>
                  <span className="font-semibold">{formatCurrency(totalGoalOthers)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-bold ${
                    achievementOthers >= 100 ? 'text-green-600' :
                    achievementOthers >= 90 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {achievementOthers.toFixed(1)}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    achievementOthers >= 100 ? 'bg-green-200 text-green-800' :
                    achievementOthers >= 90 ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {achievementOthers >= 100 ? (language === 'pl' ? 'Cel osiągnięty' : 'Goal met') :
                     achievementOthers >= 90 ? (language === 'pl' ? 'Na dobrej drodze' : 'On track') :
                     (language === 'pl' ? 'Poniżej celu' : 'Below goal')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wykres porównawczy */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle>{t('monthlyGoalTracking', language)}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="actualRevenue" fill="#4F46E5" name={t('actualRevenue', language)} />
              <Line type="monotone" dataKey="goalRevenue" stroke="#EF4444" strokeWidth={3} name={t('totalGoal', language)} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Wykres podziału na źródła z celami - Small Multiples */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle>{t('monthlyTrendBreakdown', language)} vs {t('financialGoals', language)}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* IKEA SUPPLY */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700">IKEA SUPPLY</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenueIkea" fill="#3B82F6" name={language === 'pl' ? 'Obrót rzeczywisty' : 'Actual Revenue'} />
                  <Line type="monotone" dataKey="goalIkea" stroke="#1E40AF" strokeWidth={3} name={language === 'pl' ? 'Cel' : 'Goal'} dot={{ fill: '#1E40AF', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* IKEA INDUSTRY */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-700">IKEA INDUSTRY</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenueIkeaIndustry" fill="#9333EA" name={language === 'pl' ? 'Obrót rzeczywisty' : 'Actual Revenue'} />
                  <Line type="monotone" dataKey="goalIkeaIndustry" stroke="#6B21A8" strokeWidth={3} name={language === 'pl' ? 'Cel' : 'Goal'} dot={{ fill: '#6B21A8', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* POZOSTALI */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">POZOSTALI</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenueOthers" fill="#10B981" name={language === 'pl' ? 'Obrót rzeczywisty' : 'Actual Revenue'} />
                  <Line type="monotone" dataKey="goalOthers" stroke="#047857" strokeWidth={3} name={language === 'pl' ? 'Cel' : 'Goal'} dot={{ fill: '#047857', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela miesięczna z celami */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle>{t('monthlyAnalysis', language)}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('month', language)}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actualRevenue', language)}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('totalGoal', language)}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('goalAchievement', language)}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('status', language)}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((month) => {
                  const isOnTrack = month.achievement >= 100;
                  const isClose = month.achievement >= 90 && month.achievement < 100;
                  const isBelowGoal = month.achievement < 90;
                  
                  return (
                    <tr key={month.monthNum} className={`${
                      isBelowGoal ? 'bg-red-50' : isClose ? 'bg-yellow-50' : isOnTrack ? 'bg-green-50' : ''
                    }`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{month.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(month.actualRevenue)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(month.goalRevenue)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${
                        isOnTrack ? 'text-green-600' : isClose ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {month.goalRevenue > 0 ? `${month.achievement.toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {month.goalRevenue > 0 ? (
                          isOnTrack ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t('goalExceeded', language)}
                            </span>
                          ) : isClose ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {t('onTrack', language)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {t('belowGoal', language)}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}