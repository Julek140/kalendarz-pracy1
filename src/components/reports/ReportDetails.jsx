import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isWeekend } from "date-fns";
import { pl } from "date-fns/locale";

const polishHolidays = [
  { date: "2025-01-01", name: "Nowy Rok" },
  { date: "2025-01-06", name: "Trzech Króli" },
  { date: "2025-04-20", name: "Wielkanoc" },
  { date: "2025-04-21", name: "Poniedziałek Wielkanocny" },
  { date: "2025-05-01", name: "Święto Pracy" },
  { date: "2025-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2025-06-08", name: "Zielone Świątki" },
  { date: "2025-06-19", name: "Boże Ciało" },
  { date: "2025-08-15", name: "Wniebowzięcie NMP" },
  { date: "2025-11-01", name: "Wszystkich Świętych" },
  { date: "2025-11-11", name: "Święto Niepodległości" },
  { date: "2025-12-25", name: "Boże Narodzenie" },
  { date: "2025-12-26", name: "Drugi Dzień Bożego Narodzenia" },
];

export default function ReportDetails({ reportData }) {
  const { allDays, holidays } = reportData;

  const getDayType = (date) => {
    const parsedDate = parseISO(date);
    const holiday = holidays?.find(h => h.date === date);
    
    if (holiday) {
      return { 
        label: holiday.isCustom ? `Święto (własne)` : "Święto", 
        color: "bg-red-100 text-red-800" 
      };
    }
    if (isWeekend(parsedDate)) return { label: "Nadgodziny", color: "bg-orange-100 text-orange-800" };
    return { label: "Normalny", color: "bg-blue-100 text-blue-800" };
  };

  const getDepartmentBadge = (dept) => {
    if (dept === "MASZYNOWNIA") return <Badge className="bg-blue-500">🏭 Maszynownia</Badge>;
    if (dept === "PAKOWNIA") return <Badge className="bg-green-500">📦 Pakownia</Badge>;
    if (dept === "OBA_DZIALY") return <Badge className="bg-purple-500">🏭📦 Oba</Badge>;
    return null;
  };

  const sortedDays = [...allDays].sort((a, b) => 
    parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
        <CardTitle className="text-xl">Szczegółowy wykaz dni pracy</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sortedDays.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Brak danych dla wybranego okresu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Data</TableHead>
                  <TableHead>Dzień tygodnia</TableHead>
                  <TableHead>Dział</TableHead>
                  <TableHead className="text-center">Zmiany</TableHead>
                  <TableHead>Typ dnia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uwagi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDays.map((day) => {
                  const dayType = getDayType(day.date);
                  return (
                    <TableRow key={day.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {format(parseISO(day.date), 'd MMM yyyy', { locale: pl })}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(day.date), 'EEEE', { locale: pl })}
                      </TableCell>
                      <TableCell>{getDepartmentBadge(day.department)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 font-bold">
                          {day.shifts || 0} {day.shifts === 1 ? 'zmiana' : 'zmiany'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={dayType.color}>
                          {dayType.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {day.is_downtime ? (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                            ⏸️ Przestój
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">✓ Pracował</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {day.notes || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}