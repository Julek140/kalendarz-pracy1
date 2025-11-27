import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ReportBalance({ reportData }) {
  const { balance } = reportData;

  // Procent wykorzystania TYLKO dni roboczych (Pn-Pt)
  const maszynowniaWeekdaysPercent = balance.availableWeekdays > 0
    ? (balance.usedWeekdaysMaszynownia / balance.availableWeekdays) * 100
    : 0;

  const pakowniaWeekdaysPercent = balance.availableWeekdays > 0
    ? (balance.usedWeekdaysPakownia / balance.availableWeekdays) * 100
    : 0;

  // Procent wykorzystania sobót (bez świąt)
  const maszynowniaSaturdaysPercent = balance.availableSaturdays > 0
    ? (balance.usedSaturdaysMaszynownia / balance.availableSaturdays) * 100
    : 0;

  const pakowniaSaturdaysPercent = balance.availableSaturdays > 0
    ? (balance.usedSaturdaysPakownia / balance.availableSaturdays) * 100
    : 0;

  // Procent wykorzystania zmian - ZMIENIONE: tylko względem dni roboczych Pn-Pt × 3
  const maszynowniaShiftsPercent = balance.totalAvailableShifts > 0
    ? (balance.usedShiftsMaszynownia / balance.totalAvailableShifts) * 100
    : 0;

  const pakowniaShiftsPercent = balance.totalAvailableShifts > 0
    ? (balance.usedShiftsPakownia / balance.totalAvailableShifts) * 100
    : 0;

  return (
    <Card className="mb-6 shadow-lg border-none bg-gradient-to-br from-emerald-50 to-teal-50 print:break-inside-avoid">
      <CardHeader className="border-b border-emerald-200">
        <CardTitle className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-600 text-white">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl">Bilans wykorzystania</span>
            <p className="text-sm font-normal text-slate-600 mt-1">
              Dostępne zmiany = 15/tydzień (Pn-Pt), soboty i niedziele to nadgodziny
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Available Resources */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              Dostępne zasoby
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Wszystkie dni:</span>
                <span className="text-2xl font-bold text-slate-900">
                  {balance.totalAvailableDays}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                <span className="text-blue-700 font-semibold">Dni robocze (Pn-Pt):</span>
                <span className="text-2xl font-bold text-blue-900">
                  {balance.availableWeekdays}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-2 border-orange-300">
                <span className="text-orange-700 font-semibold">Soboty:</span>
                <span className="text-2xl font-bold text-orange-900">
                  {balance.availableSaturdays}
                </span>
              </div>
              {balance.holidaysCount > 0 && (
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700 flex items-center gap-2">
                    <PartyPopper className="w-4 h-4" />
                    Święta Pn-Sob (wyłączone):
                  </span>
                  <span className="text-2xl font-bold text-red-900">
                    -{balance.holidaysCount}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border-2 border-emerald-300">
                <span className="text-emerald-700 font-semibold">Dostępne zmiany (Pn-Pt):</span>
                <span className="text-2xl font-bold text-emerald-900">
                  {balance.totalAvailableShifts}
                </span>
              </div>
              <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">
                * Dni robocze = Pn-Pt minus święta (bez niedziel)
                <br />
                * Soboty = nadgodziny (nie wliczone w dostępne zmiany)
                <br />
                * Dostępne zmiany = dni robocze Pn-Pt × 3 (15/tydzień)
              </div>
            </div>
          </div>

          {/* Used Resources Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Wykorzystane zasoby
            </h3>
            <div className="space-y-6">
              {/* Maszynownia */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-blue-700">🏭 Maszynownia</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Dni robocze (Pn-Pt):</span>
                      <span className="font-semibold">
                        {balance.usedWeekdaysMaszynownia} / {balance.availableWeekdays} ({maszynowniaWeekdaysPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={maszynowniaWeekdaysPercent} className="h-2 bg-blue-100" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Soboty (nadgodziny):</span>
                      <span className="font-semibold">
                        {balance.usedSaturdaysMaszynownia} / {balance.availableSaturdays} ({maszynowniaSaturdaysPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={maszynowniaSaturdaysPercent} className="h-2 bg-orange-100" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Zmiany ogółem (+nadgodziny):</span>
                      <span className="font-semibold">
                        {balance.usedShiftsMaszynownia} / {balance.totalAvailableShifts} ({maszynowniaShiftsPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={maszynowniaShiftsPercent} className="h-2 bg-emerald-100" />
                  </div>
                </div>
              </div>

              {/* Pakownia */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-green-700">📦 Pakownia</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Dni robocze (Pn-Pt):</span>
                      <span className="font-semibold">
                        {balance.usedWeekdaysPakownia} / {balance.availableWeekdays} ({pakowniaWeekdaysPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={pakowniaWeekdaysPercent} className="h-2 bg-green-100" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Soboty (nadgodziny):</span>
                      <span className="font-semibold">
                        {balance.usedSaturdaysPakownia} / {balance.availableSaturdays} ({pakowniaSaturdaysPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={pakowniaSaturdaysPercent} className="h-2 bg-orange-100" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Zmiany ogółem (+nadgodziny):</span>
                      <span className="font-semibold">
                        {balance.usedShiftsPakownia} / {balance.totalAvailableShifts} ({pakowniaShiftsPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={pakowniaShiftsPercent} className="h-2 bg-emerald-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Dni robocze (Pn-Pt)</p>
            <p className="text-sm font-medium text-blue-700">Maszynownia</p>
            <p className="text-3xl font-bold text-blue-900">{balance.usedWeekdaysMaszynownia}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Wykorzystane zmiany</p>
            <p className="text-sm font-medium text-blue-700">Maszynownia</p>
            <p className="text-3xl font-bold text-blue-900">{balance.usedShiftsMaszynownia}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Dni robocze (Pn-Pt)</p>
            <p className="text-sm font-medium text-green-700">Pakownia</p>
            <p className="text-3xl font-bold text-green-900">{balance.usedWeekdaysPakownia}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Wykorzystane zmiany</p>
            <p className="text-sm font-medium text-green-700">Pakownia</p>
            <p className="text-3xl font-bold text-green-900">{balance.usedShiftsPakownia}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}