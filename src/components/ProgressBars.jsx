import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Target, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ProgressBars() {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [yearlyGoal, setYearlyGoal] = useState(null);

  // Pobierz cel z bazy danych użytkownika
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user?.yearly_financial_goal) {
      setYearlyGoal(user.yearly_financial_goal);
      setGoalInput(user.yearly_financial_goal.toString());
    }
  }, [user]);

  // Oblicz dni roku
  const now = new Date();
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

  const currentYearRevenue = workDays
    .filter(wd => {
      const date = new Date(wd.date);
      return date.getFullYear() === now.getFullYear() && !wd.is_downtime;
    })
    .reduce((sum, wd) => sum + (wd.revenue || 0), 0);

  const financialProgress = yearlyGoal > 0 ? (currentYearRevenue / yearlyGoal) * 100 : 0;

  const handleSaveGoal = async () => {
    const newGoal = parseFloat(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      try {
        await base44.auth.updateMe({ yearly_financial_goal: newGoal });
        setYearlyGoal(newGoal);
        setIsEditingGoal(false);
      } catch (error) {
        console.error("Błąd podczas zapisywania celu:", error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-3 border-t border-slate-200 bg-white space-y-3">
      {/* Pasek dnia */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Dzień roku</span>
        </div>
        <Progress value={dayProgress} className="h-2 mb-2 bg-blue-200" />
        <div className="flex justify-between text-xs text-blue-700">
          <span>Dzień {daysPassed}/{totalDays}</span>
          <span>Pozostało {daysLeft} dni</span>
        </div>
      </div>

      {/* Pasek finansowy */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">Cel finansowy</span>
          </div>
          <button
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {isEditingGoal ? (
          <div className="flex gap-2 mb-2">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Cel roczny"
              className="h-8 text-xs"
            />
            <Button onClick={handleSaveGoal} size="sm" className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700">
              Zapisz
            </Button>
          </div>
        ) : yearlyGoal ? (
          <>
            <Progress value={Math.min(financialProgress, 100)} className="h-2 mb-2 bg-emerald-200" />
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Osiągnięte:</span>
                <span className="font-semibold">{formatCurrency(currentYearRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Cel:</span>
                <span className="font-semibold">{formatCurrency(yearlyGoal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-900">
                <span>Postęp:</span>
                <span>{financialProgress.toFixed(1)}%</span>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsEditingGoal(true)}
            className="w-full py-2 text-xs text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-1 border border-dashed border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <Target className="w-3 h-3" />
            Ustaw cel roczny
          </button>
        )}
      </div>
    </div>
  );
}