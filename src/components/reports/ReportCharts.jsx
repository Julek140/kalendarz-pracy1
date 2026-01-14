import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";
import { t } from "@/components/translations";

const COLORS = {
  used: '#3B82F6',
  unused: '#E5E7EB',
  usedPakownia: '#10B981',
  unusedPakownia: '#D1FAE5',
};

export default function ReportCharts({ reportData, language = 'pl' }) {
  const { balance } = reportData;

  // Procent wykorzystania dni roboczych Maszynownia
  const maszynowniaWeekdaysUsed = balance.usedWeekdaysMaszynownia;
  const maszynowniaWeekdaysUnused = balance.availableWeekdays - balance.usedWeekdaysMaszynownia;
  const maszynowniaWeekdaysPercent = balance.availableWeekdays > 0
    ? ((maszynowniaWeekdaysUsed / balance.availableWeekdays) * 100).toFixed(1)
    : 0;

  const maszynowniaWeekdaysData = [
    { name: t('used', language), value: maszynowniaWeekdaysUsed, color: COLORS.used },
    { name: t('unused', language), value: maszynowniaWeekdaysUnused, color: COLORS.unused },
  ];

  // Procent wykorzystania dni roboczych Pakownia
  const pakowniaWeekdaysUsed = balance.usedWeekdaysPakownia;
  const pakowniaWeekdaysUnused = balance.availableWeekdays - balance.usedWeekdaysPakownia;
  const pakowniaWeekdaysPercent = balance.availableWeekdays > 0
    ? ((pakowniaWeekdaysUsed / balance.availableWeekdays) * 100).toFixed(1)
    : 0;

  const pakowniaWeekdaysData = [
    { name: t('used', language), value: pakowniaWeekdaysUsed, color: COLORS.usedPakownia },
    { name: t('unused', language), value: pakowniaWeekdaysUnused, color: COLORS.unusedPakownia },
  ];

  // Procent wykorzystania zmian Maszynownia
  const maszynowniaShiftsUsed = balance.usedShiftsMaszynownia;
  const maszynowniaShiftsUnused = balance.totalAvailableShifts - balance.usedShiftsMaszynownia;
  const maszynowniaShiftsPercent = balance.totalAvailableShifts > 0
    ? ((maszynowniaShiftsUsed / balance.totalAvailableShifts) * 100).toFixed(1)
    : 0;

  const maszynowniaShiftsData = [
    { name: t('used', language), value: maszynowniaShiftsUsed, color: COLORS.used },
    { name: t('unused', language), value: maszynowniaShiftsUnused, color: COLORS.unused },
  ];

  // Procent wykorzystania zmian Pakownia
  const pakowniaShiftsUsed = balance.usedShiftsPakownia;
  const pakowniaShiftsUnused = balance.totalAvailableShifts - balance.usedShiftsPakownia;
  const pakowniaShiftsPercent = balance.totalAvailableShifts > 0
    ? ((pakowniaShiftsUsed / balance.totalAvailableShifts) * 100).toFixed(1)
    : 0;

  const pakowniaShiftsData = [
    { name: t('used', language), value: pakowniaShiftsUsed, color: COLORS.usedPakownia },
    { name: t('unused', language), value: pakowniaShiftsUnused, color: COLORS.unusedPakownia },
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Wykresy dni roboczych */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Maszynownia - Dni robocze */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              🏭 {t('maszynownia', language)} - {t('weekdaysChart', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maszynowniaWeekdaysData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {maszynowniaWeekdaysData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('used', language)}</p>
                <p className="text-2xl font-bold text-blue-700">{maszynowniaWeekdaysUsed}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('unused', language)}</p>
                <p className="text-2xl font-bold text-slate-700">{maszynowniaWeekdaysUnused}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('percent', language)}</p>
                <p className="text-2xl font-bold text-indigo-700">{maszynowniaWeekdaysPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pakownia - Dni robocze */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              📦 {t('pakownia', language)} - {t('weekdaysChart', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pakowniaWeekdaysData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pakowniaWeekdaysData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('used', language)}</p>
                <p className="text-2xl font-bold text-green-700">{pakowniaWeekdaysUsed}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('unused', language)}</p>
                <p className="text-2xl font-bold text-slate-700">{pakowniaWeekdaysUnused}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('percent', language)}</p>
                <p className="text-2xl font-bold text-emerald-700">{pakowniaWeekdaysPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wykresy zmian ogółem */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Maszynownia - Zmiany ogółem */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              🏭 {t('maszynownia', language)} - {t('shiftsOverallChart', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maszynowniaShiftsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {maszynowniaShiftsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('used', language)}</p>
                <p className="text-2xl font-bold text-blue-700">{maszynowniaShiftsUsed}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('available', language)}</p>
                <p className="text-2xl font-bold text-slate-700">{balance.totalAvailableShifts}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('percent', language)}</p>
                <p className="text-2xl font-bold text-indigo-700">{maszynowniaShiftsPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pakownia - Zmiany ogółem */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              📦 {t('pakownia', language)} - {t('shiftsOverallChart', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pakowniaShiftsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pakowniaShiftsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('used', language)}</p>
                <p className="text-2xl font-bold text-green-700">{pakowniaShiftsUsed}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('available', language)}</p>
                <p className="text-2xl font-bold text-slate-700">{balance.totalAvailableShifts}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">{t('percent', language)}</p>
                <p className="text-2xl font-bold text-emerald-700">{pakowniaShiftsPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}