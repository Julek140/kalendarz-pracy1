import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = {
  maszynownia: '#3B82F6',
  pakownia: '#10B981',
  available: '#E5E7EB',
  used: '#6366F1',
};

export default function ReportCharts({ reportData }) {
  const { balance, maszynownia, pakownia } = reportData;

  // Dane dla wykresu porównawczego dni roboczych
  const weekdaysData = [
    {
      name: 'Dostępne',
      Maszynownia: balance.availableWeekdays,
      Pakownia: balance.availableWeekdays,
    },
    {
      name: 'Wykorzystane',
      Maszynownia: balance.usedWeekdaysMaszynownia,
      Pakownia: balance.usedWeekdaysPakownia,
    },
  ];

  // Dane dla wykresu sobót
  const saturdaysData = [
    {
      name: 'Dostępne soboty',
      value: balance.availableSaturdays,
    },
    {
      name: 'Maszynownia',
      value: balance.usedSaturdaysMaszynownia,
    },
    {
      name: 'Pakownia',
      value: balance.usedSaturdaysPakownia,
    },
  ];

  // Dane dla wykresu zmian
  const shiftsData = [
    {
      name: 'Maszynownia',
      'Zmiany normalne': maszynownia.regularShifts,
      'Nadgodziny': maszynownia.overtimeShifts,
    },
    {
      name: 'Pakownia',
      'Zmiany normalne': pakownia.regularShifts,
      'Nadgodziny': pakownia.overtimeShifts,
    },
  ];

  // Dane dla wykresu kołowego - wykorzystanie zmian
  const shiftsUsagePieData = [
    {
      name: 'Maszynownia wykorzystane',
      value: balance.usedShiftsMaszynownia,
      color: COLORS.maszynownia,
    },
    {
      name: 'Pakownia wykorzystane',
      value: balance.usedShiftsPakownia,
      color: COLORS.pakownia,
    },
    {
      name: 'Niewykorzystane',
      value: Math.max(0, balance.totalAvailableShifts - balance.usedShiftsMaszynownia - balance.usedShiftsPakownia),
      color: COLORS.available,
    },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Wykresy porównawcze */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wykres dni roboczych */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Wykorzystanie dni roboczych (Pn-Pt)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekdaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Maszynownia" fill={COLORS.maszynownia} />
                <Bar dataKey="Pakownia" fill={COLORS.pakownia} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Wykres sobót */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Wykorzystanie sobót
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={saturdaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Wykresy zmian */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wykres porównania zmian normalnych vs nadgodziny */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Zmiany normalne vs Nadgodziny
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shiftsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Zmiany normalne" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="Nadgodziny" stackId="a" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Wykres kołowy - całkowite wykorzystanie zmian */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Całkowite wykorzystanie dostępnych zmian
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shiftsUsagePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shiftsUsagePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-slate-600">Maszynownia</p>
                <p className="text-lg font-bold text-blue-700">{balance.usedShiftsMaszynownia}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs text-slate-600">Pakownia</p>
                <p className="text-lg font-bold text-green-700">{balance.usedShiftsPakownia}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Dostępne</p>
                <p className="text-lg font-bold text-slate-700">{balance.totalAvailableShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}