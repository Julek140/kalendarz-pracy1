import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { t } from "@/components/translations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts";

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

  // Oblicz statystyki dla każdego źródła (tylko do obecnego miesiąca dla bieżącego roku)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isCurrentYear = reportData.year === currentYear;
  
  // Dla bieżącego roku: porównuj tylko dane do obecnego miesiąca
  const monthsToCount = isCurrentYear ? currentMonth : 12;
  
  const totalActualIkea = reportData.monthlyData
    .filter(m => m.monthNum <= monthsToCount)
    .reduce((sum, m) => sum + (m.revenueIkea || 0), 0);
  const totalActualIkeaIndustry = reportData.monthlyData
    .filter(m => m.monthNum <= monthsToCount)
    .reduce((sum, m) => sum + (m.revenueIkeaIndustry || 0), 0);
  const totalActualOthers = reportData.monthlyData
    .filter(m => m.monthNum <= monthsToCount)
    .reduce((sum, m) => sum + (m.revenueOthers || 0), 0);

  // Cel również tylko do obecnego miesiąca dla bieżącego roku
  const totalGoalIkea = goalsData
    ?.filter(g => g.month <= monthsToCount)
    .reduce((sum, g) => sum + (g.revenue_ikea_goal || 0), 0) || 0;
  const totalGoalIkeaIndustry = goalsData
    ?.filter(g => g.month <= monthsToCount)
    .reduce((sum, g) => sum + (g.revenue_ikea_industry_goal || 0), 0) || 0;
  const totalGoalOthers = goalsData
    ?.filter(g => g.month <= monthsToCount)
    .reduce((sum, g) => sum + (g.revenue_others_goal || 0), 0) || 0;

  const achievementIkea = totalGoalIkea > 0 ? (totalActualIkea / totalGoalIkea * 100) : 0;
  const achievementIkeaIndustry = totalGoalIkeaIndustry > 0 ? (totalActualIkeaIndustry / totalGoalIkeaIndustry * 100) : 0;
  const achievementOthers = totalGoalOthers > 0 ? (totalActualOthers / totalGoalOthers * 100) : 0;

  // Oblicz prognozę na koniec roku
  let projectedRevenue = totalActualRevenue;
  let remainingGoal = 0;
  let isTrendInsufficient = false;
  
  if (isCurrentYear && currentMonth < 12) {
    const monthsElapsed = reportData.monthlyData.filter(m => m.monthNum <= currentMonth && m.totalDays > 0).length;
    const avgMonthlyActual = monthsElapsed > 0 ? totalActualRevenue / monthsElapsed : 0;
    const monthsRemaining = 12 - currentMonth;
    projectedRevenue = totalActualRevenue + (avgMonthlyActual * monthsRemaining);
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
                    ? `Prognozowany obrót roczny (${formatCurrency(projectedRevenue)}) jest poniżej celu. Wymagane jest zwiększenie średniego miesięcznego obrotu o ${formatCurrency((totalGoalRevenue - projectedRevenue) / Math.max(1, 12 - currentMonth))}, aby osiągnąć roczny cel.`
                    : `Projected annual revenue (${formatCurrency(projectedRevenue)}) is below target. An increase in average monthly revenue of ${formatCurrency((totalGoalRevenue - projectedRevenue) / Math.max(1, 12 - currentMonth))} is required to meet the annual goal.`}
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

      {/* Wykres podziału na źródła z celami */}
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle>{t('monthlyTrendBreakdown', language)} vs {t('financialGoals', language)}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenueIkea" stackId="actual" fill="#3B82F6" name="IKEA SUPPLY" />
              <Bar dataKey="revenueIkeaIndustry" stackId="actual" fill="#9333EA" name="IKEA INDUSTRY" />
              <Bar dataKey="revenueOthers" stackId="actual" fill="#10B981" name="POZOSTALI" />
              <Line type="monotone" dataKey="goalIkea" stroke="#60A5FA" strokeWidth={2} strokeDasharray="5 5" name="Cel IKEA SUPPLY" />
              <Line type="monotone" dataKey="goalIkeaIndustry" stroke="#C084FC" strokeWidth={2} strokeDasharray="5 5" name="Cel IKEA INDUSTRY" />
              <Line type="monotone" dataKey="goalOthers" stroke="#34D399" strokeWidth={2} strokeDasharray="5 5" name="Cel POZOSTALI" />
            </ComposedChart>
          </ResponsiveContainer>
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