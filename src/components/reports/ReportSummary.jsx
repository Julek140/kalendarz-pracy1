import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Package, Calendar, Clock, Pause, PartyPopper, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function ReportSummary({ reportData }) {
  const { startDate, endDate, maszynownia, pakownia, holidaysCount, holidays } = reportData;

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

      {/* Święta - osobna karta */}
      <Card className="mb-6 shadow-lg border-none bg-gradient-to-r from-red-50 to-pink-50 print:break-inside-avoid">
        <CardHeader className="border-b border-red-200">
          <CardTitle className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500 text-white">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl">Święta w okresie</span>
              <p className="text-sm font-normal text-slate-600 mt-1">Dni wolne wyłączające dni robocze</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm flex-shrink-0">
              <p className="text-5xl font-bold text-red-600">{holidaysCount}</p>
              <p className="text-sm text-slate-600 mt-2">Dni świątecznych</p>
            </div>
            <div className="flex-1">
              {holidaysCount > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {holidays.map((holiday, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-800 border border-red-200 px-3 py-2">
                      🎉 {format(parseISO(holiday.date), 'd MMM', { locale: pl })} - {holiday.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic">Brak świąt w wybranym okresie</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 print:break-inside-avoid">
        {summaryCards.map((card) => (
          <Card key={card.title} className="shadow-lg border-none overflow-hidden print:break-inside-avoid">
            <CardHeader className={`bg-gradient-to-r from-${card.color}-50 to-${card.color}-100 border-b`}>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-${card.color}-500 text-white`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-2xl">{card.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{card.stats.totalWorkDays}</p>
                  <p className="text-sm text-slate-600 mt-1">Dni pracy</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-indigo-700">{card.stats.totalShifts}</p>
                  <p className="text-sm text-slate-600 mt-1">Zmiany ogółem</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{card.stats.regularShifts}</p>
                  <p className="text-xs text-slate-600 mt-1">Zmiany normalne</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700">{card.stats.overtimeShifts}</p>
                  <p className="text-xs text-slate-600 mt-1">Nadgodziny</p>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <p className="text-2xl font-bold text-gray-700">{card.stats.downtimeDays}</p>
                  <p className="text-xs text-slate-600 mt-1">Przestoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}