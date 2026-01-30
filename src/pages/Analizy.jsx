import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, Zap, Target, ArrowUpCircle, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useLanguage } from "@/components/LanguageContext";
import { format, subDays, startOfMonth, endOfMonth, getYear, getMonth } from "date-fns";
import { pl, enUS } from "date-fns/locale";

export default function AnalizyPage() {
  const { language } = useLanguage();
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

  const analytics = useMemo(() => {
    const today = new Date();
    const currentYear = getYear(today);
    const currentMonth = getMonth(today) + 1;
    
    // Ostatnie 7 dni
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = workDays.filter(wd => wd.date === dateStr);
      const totalRevenue = dayData.reduce((sum, wd) => sum + (wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0), 0);
      
      return {
        date: format(date, 'dd MMM', { locale }),
        revenue: totalRevenue,
        shifts: dayData.reduce((sum, wd) => sum + (wd.shifts || 0), 0)
      };
    });

    // Dane bieżącego miesiąca
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const currentMonthDays = workDays.filter(wd => {
      const wdDate = new Date(wd.date);
      return wdDate >= monthStart && wdDate <= monthEnd;
    });

    const monthRevenue = currentMonthDays.reduce((sum, wd) => 
      sum + (wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0), 0);
    
    const monthShifts = currentMonthDays.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
    const monthDays = currentMonthDays.length;

    // Cel miesięczny
    const monthGoal = financialGoals.find(g => g.year === currentYear && g.month === currentMonth);
    const monthGoalTotal = monthGoal 
      ? (monthGoal.revenue_ikea_goal || 0) + (monthGoal.revenue_ikea_industry_goal || 0) + (monthGoal.revenue_others_goal || 0)
      : 0;
    const goalAchievement = monthGoalTotal > 0 ? (monthRevenue / monthGoalTotal) * 100 : 0;

    // Podział źródeł obrotu (bieżący miesiąc)
    const revenueBySource = [
      {
        name: 'IKEA SUPPLY',
        value: currentMonthDays.reduce((sum, wd) => sum + (wd.revenue_ikea || 0), 0),
        color: '#3B82F6'
      },
      {
        name: 'IKEA INDUSTRY',
        value: currentMonthDays.reduce((sum, wd) => sum + (wd.revenue_ikea_industry || 0), 0),
        color: '#9333EA'
      },
      {
        name: 'POZOSTALI',
        value: currentMonthDays.reduce((sum, wd) => sum + (wd.revenue_others || 0), 0),
        color: '#10B981'
      }
    ];

    // Średnie dzienny obrót vs poprzedni miesiąc
    const prevMonthStart = new Date(currentYear, currentMonth - 2, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth - 1, 0);
    const prevMonthDays = workDays.filter(wd => {
      const wdDate = new Date(wd.date);
      return wdDate >= prevMonthStart && wdDate <= prevMonthEnd;
    });
    const prevMonthRevenue = prevMonthDays.reduce((sum, wd) => 
      sum + (wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0), 0);
    const prevMonthAvg = prevMonthDays.length > 0 ? prevMonthRevenue / prevMonthDays.length : 0;
    const currentMonthAvg = monthDays > 0 ? monthRevenue / monthDays : 0;
    const avgChange = prevMonthAvg > 0 ? ((currentMonthAvg - prevMonthAvg) / prevMonthAvg) * 100 : 0;

    // Przestoje
    const downtimeDays = currentMonthDays.filter(wd => wd.is_downtime).length;

    // Tygodniowy wykres zmian
    const weeklyShifts = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = workDays.filter(wd => wd.date === dateStr);
      return dayData.reduce((sum, wd) => sum + (wd.shifts || 0), 0);
    });

    return {
      last7Days,
      monthRevenue,
      monthShifts,
      monthDays,
      goalAchievement,
      revenueBySource,
      avgChange,
      currentMonthAvg,
      downtimeDays,
      weeklyShifts,
      monthGoalTotal
    };
  }, [workDays, financialGoals, language]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { 
      style: 'currency', 
      currency: 'PLN', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {language === 'pl' ? 'Analizy i Wskaźniki' : 'Analytics & Metrics'}
          </h1>
          <p className="text-slate-400">
            {language === 'pl' ? 'Kluczowe wskaźniki wydajności w czasie rzeczywistym' : 'Real-time key performance indicators'}
          </p>
        </div>

        {/* Grid z wskaźnikami */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Trend obrotu (ostatnie 7 dni) */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                {language === 'pl' ? 'Trend Obrotu (7 dni)' : 'Revenue Trend (7 days)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-24 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.last7Days}>
                    <Line type="monotone" dataKey="revenue" stroke="#22D3EE" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(analytics.last7Days[analytics.last7Days.length - 1]?.revenue || 0)}
                </span>
                <span className="text-xs text-slate-400">{language === 'pl' ? 'Dzisiaj' : 'Today'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Realizacja celu miesięcznego */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                {language === 'pl' ? 'Cel Miesięczny' : 'Monthly Goal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-24 flex items-center justify-center mb-2">
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(analytics.goalAchievement / 100, 1))}`}
                    className={analytics.goalAchievement >= 100 ? "text-green-500" : analytics.goalAchievement >= 75 ? "text-yellow-500" : "text-orange-500"}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{analytics.goalAchievement.toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === 'pl' ? 'Osiągnięte' : 'Achieved'}</span>
                <span className={analytics.goalAchievement >= 100 ? "text-green-500" : "text-orange-500"}>
                  {formatCurrency(analytics.monthRevenue)} / {formatCurrency(analytics.monthGoalTotal)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Średni dzienny obrót */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {language === 'pl' ? 'Średnia dzienna' : 'Daily Average'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(analytics.currentMonthAvg)}
                </div>
                <div className="flex items-center gap-1">
                  {analytics.avgChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${analytics.avgChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analytics.avgChange >= 0 ? '+' : ''}{analytics.avgChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 ml-1">
                    {language === 'pl' ? 'vs poprzedni miesiąc' : 'vs previous month'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Przepracowane zmiany */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'pl' ? 'Zmiany w miesiącu' : 'Shifts This Month'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="text-3xl font-bold text-indigo-400 mb-1">
                  {analytics.monthShifts}
                </div>
                <div className="text-xs text-slate-400">
                  {language === 'pl' ? `W ${analytics.monthDays} dni robocze` : `In ${analytics.monthDays} work days`}
                </div>
              </div>
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyShifts.map((shifts, i) => ({ day: i + 1, shifts }))}>
                    <Bar dataKey="shifts" fill="#818CF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Druga linia */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          
          {/* Wykres tygodniowy obrotu */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                {language === 'pl' ? 'Obroty ostatnich 7 dni' : 'Last 7 Days Revenue'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={analytics.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: '10px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#CBD5E1' }}
                  />
                  <Bar dataKey="revenue" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Podział źródeł obrotu */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                {language === 'pl' ? 'Źródła obrotu (miesiąc)' : 'Revenue Sources (month)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.revenueBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {analytics.revenueBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {analytics.revenueBySource.map((source, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                      <span className="text-slate-300">{source.name}</span>
                    </div>
                    <span className="text-slate-400 font-medium">{formatCurrency(source.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statystyki miesiąca */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                {language === 'pl' ? 'Statystyki miesiąca' : 'Monthly Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-300">{language === 'pl' ? 'Dni pracy' : 'Work Days'}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-400">{analytics.monthDays}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">{language === 'pl' ? 'Zmiany' : 'Shifts'}</span>
                  </div>
                  <span className="text-lg font-bold text-purple-400">{analytics.monthShifts}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-slate-300">{language === 'pl' ? 'Przestoje' : 'Downtime'}</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">{analytics.downtimeDays}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300">{language === 'pl' ? 'Obrót/zmianę' : 'Revenue/shift'}</span>
                  </div>
                  <span className="text-lg font-bold text-green-400">
                    {formatCurrency(analytics.monthShifts > 0 ? analytics.monthRevenue / analytics.monthShifts : 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">{language === 'pl' ? 'Łącznie' : 'Total'}</span>
                  </div>
                  <span className="text-lg font-bold text-cyan-400">{formatCurrency(analytics.monthRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}