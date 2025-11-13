import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function CalendarLegend() {
  const legendItems = [
    { color: "bg-blue-100 border-blue-500", label: "🏭 Maszynownia" },
    { color: "bg-green-100 border-green-500", label: "📦 Pakownia" },
    { color: "bg-purple-100 border-purple-500", label: "🏭📦 Oba działy" },
    { color: "bg-gray-200 border-gray-400", label: "⏸️ Przestój" },
    { color: "bg-red-50 border-red-300", label: "🎉 Święto" },
    { color: "bg-orange-50 border-slate-300", label: "Weekend (nadgodziny)" },
  ];

  return (
    <Card className="mb-6 shadow-lg border-none bg-white">
      <CardContent className="p-6">
        <h3 className="font-bold text-slate-900 mb-4 text-lg">Legenda:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded border-2 ${item.color}`} />
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}