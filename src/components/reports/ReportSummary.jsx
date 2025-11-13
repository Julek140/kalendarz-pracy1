import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Package, Calendar, Clock, Pause } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

export default function ReportSummary({ reportData }) {
  const { startDate, endDate, maszynownia, pakownia } = reportData;

  const summaryCards = [
    {
      title: "Maszynownia",
      icon: Factory,
      color: "blue",
      stats: maszynownia,
    },
    {
      title: "Pakownia",
      icon: Package,
      color: "green",
      stats: pakownia,
    },
  ];

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Raport za okres:</h2>
        <p className="text-lg opacity-90">
          {format(parseISO(startDate), 'd MMMM yyyy', { locale: pl })} - {format(parseISO(endDate), 'd MMMM yyyy', { locale: pl })}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="shadow-lg border-none overflow-hidden">
            <CardHeader className={`bg-gradient-to-r from-${card.color}-50 to-${card.color}-100 border-b`}>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-${card.color}-500 text-white`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-2xl">{card.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{card.stats.totalWorkDays}</p>
                  <p className="text-sm text-slate-600 mt-1">Dni pracy</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-orange-700">{card.stats.overtimeDays}</p>
                  <p className="text-sm text-slate-600 mt-1">Nadgodziny</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-700">{card.stats.regularDays}</p>
                  <p className="text-sm text-slate-600 mt-1">Dni normalne</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-xl">
                  <Pause className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-700">{card.stats.downtimeDays}</p>
                  <p className="text-sm text-slate-600 mt-1">Przestoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}