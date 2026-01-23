import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ProgressBars() {
  const { language } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const now = new Date();

  // Pobierz cele finansowe z FinancialGoal
  const { data: financialGoals = [] } = useQuery({
    queryKey: ['financialGoals'],
    queryFn: () => base44.entities.FinancialGoal.list(),
    initialData: [],
  });

  // Oblicz cel roczny jako sumę celów miesięcznych
  const yearlyGoal = financialGoals
    .filter(g => g.year === selectedYear)
    .reduce((sum, g) => sum + (g.revenue_ikea_goal || 0) + (g.revenue_ikea_industry_goal || 0) + (g.revenue_others_goal || 0), 0);

  // Oblicz dni roku
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysPassed = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((endOfYear - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const daysLeft = totalDays - daysPassed;
  const dayProgress = (daysPassed / totalDays) * 100;

  // Pobierz obroty z bieżącego roku
  const { data: workDays = [] } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const selectedYearRevenue = workDays
    .filter(wd => {
      const date = new Date(wd.date);
      return date.getFullYear() === selectedYear;
    })
    .reduce((sum, wd) => sum + ((wd.revenue_ikea || 0) + (wd.revenue_ikea_industry || 0) + (wd.revenue_others || 0)), 0);

  const financialProgress = yearlyGoal > 0 ? (selectedYearRevenue / yearlyGoal) * 100 : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-3 border-t border-slate-200 bg-white space-y-3">
      {/* Pasek dnia */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">{t('dayOfYear', language)}</span>
        </div>
        <Progress value={dayProgress} className="h-2 mb-2 bg-blue-200" />
        <div className="flex justify-between text-xs text-blue-700">
          <span>{t('day', language)} {daysPassed}/{totalDays}</span>
          <span>{t('daysRemaining', language, { days: daysLeft })}</span>
        </div>
      </div>

      {/* Pasek finansowy */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">{t('financialGoal', language)}</span>
          </div>
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="h-7 w-[70px] text-xs border-emerald-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
              <SelectItem value="2029">2029</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {yearlyGoal > 0 ? (
          <>
            <Progress value={Math.min(financialProgress, 100)} className="h-2 mb-2 bg-emerald-200" />
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-emerald-700">
                <span>{t('achieved', language)}</span>
                <span className="font-semibold">{formatCurrency(selectedYearRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700">
                <span>{t('goal', language)}</span>
                <span className="font-semibold">{formatCurrency(yearlyGoal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-900">
                <span>{t('progress', language)}</span>
                <span>{financialProgress.toFixed(1)}%</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-emerald-600">
              {language === 'pl' ? 'Ustaw cele w Raporcie Rocznym' : 'Set goals in Annual Report'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}