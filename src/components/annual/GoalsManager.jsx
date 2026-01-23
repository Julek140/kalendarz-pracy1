import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, AlertCircle } from "lucide-react";
import { t } from "@/components/translations";
import { toast } from "sonner";

export default function GoalsManager({ year, existingGoals, language }) {
  const queryClient = useQueryClient();
  const [goals, setGoals] = useState(() => {
    const initial = {};
    for (let month = 1; month <= 12; month++) {
      const existing = existingGoals?.find(g => g.month === month);
      initial[month] = {
        revenue_ikea_goal: existing?.revenue_ikea_goal || 0,
        revenue_ikea_industry_goal: existing?.revenue_ikea_industry_goal || 0,
        revenue_others_goal: existing?.revenue_others_goal || 0,
      };
    }
    return initial;
  });

  const saveGoalsMutation = useMutation({
    mutationFn: async (goalsData) => {
      const promises = [];
      for (let month = 1; month <= 12; month++) {
        const existing = existingGoals?.find(g => g.month === month);
        const goalData = {
          year: parseInt(year),
          month,
          ...goalsData[month],
        };

        if (existing) {
          promises.push(base44.entities.FinancialGoal.update(existing.id, goalData));
        } else {
          promises.push(base44.entities.FinancialGoal.create(goalData));
        }
      }
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
      toast.success(t('goalsSavedSuccessfully', language));
    },
    onError: (error) => {
      console.error("Error saving goals:", error);
      toast.error("Błąd podczas zapisywania celów");
    },
  });

  const handleGoalChange = (month, field, value) => {
    setGoals(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSave = () => {
    saveGoalsMutation.mutate(goals);
  };

  const monthNames = [
    t('january', language),
    t('february', language),
    t('march', language),
    t('april', language),
    t('may', language),
    t('june', language),
    t('july', language),
    t('august', language),
    t('september', language),
    t('october', language),
    t('november', language),
    t('december', language),
  ];

  const totalYearlyGoals = Object.values(goals).reduce((acc, g) => ({
    ikea: acc.ikea + g.revenue_ikea_goal,
    ikeaIndustry: acc.ikeaIndustry + g.revenue_ikea_industry_goal,
    others: acc.others + g.revenue_others_goal,
  }), { ikea: 0, ikeaIndustry: 0, others: 0 });

  const totalYearlyGoal = totalYearlyGoals.ikea + totalYearlyGoals.ikeaIndustry + totalYearlyGoals.others;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { 
      style: 'currency', 
      currency: 'PLN', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none border-l-4 border-l-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle>{t('yearlyGoalSummary', language)}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">IKEA SUPPLY</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalYearlyGoals.ikea)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 mb-1">IKEA INDUSTRY</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalYearlyGoals.ikeaIndustry)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">POZOSTALI</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalYearlyGoals.others)}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-1">{t('annualGoalTotal', language)}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalYearlyGoal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 flex flex-row items-center justify-between">
          <CardTitle>{t('monthlyGoalsFor', language, { year })}</CardTitle>
          <Button
            onClick={handleSave}
            disabled={saveGoalsMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {t('saveGoals', language)}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <div key={month} className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold text-lg mb-3 capitalize">{monthNames[month - 1]}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {t('ikeaSupplyGoal', language)}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={goals[month].revenue_ikea_goal}
                      onChange={(e) => handleGoalChange(month, 'revenue_ikea_goal', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {t('ikeaIndustryGoal', language)}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={goals[month].revenue_ikea_industry_goal}
                      onChange={(e) => handleGoalChange(month, 'revenue_ikea_industry_goal', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {t('othersGoal', language)}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={goals[month].revenue_others_goal}
                      onChange={(e) => handleGoalChange(month, 'revenue_others_goal', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {t('totalGoal', language)}: <strong>{formatCurrency(goals[month].revenue_ikea_goal + goals[month].revenue_ikea_industry_goal + goals[month].revenue_others_goal)}</strong>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">
            {language === 'pl' ? 'Informacja' : 'Information'}
          </p>
          <p>
            {language === 'pl' 
              ? 'Cele miesięczne są używane do śledzenia postępu i generowania alertów, gdy obroty są poniżej założonych celów.'
              : 'Monthly goals are used to track progress and generate alerts when revenue is below set targets.'}
          </p>
        </div>
      </div>
    </div>
  );
}