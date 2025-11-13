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
  "2025-01-01", "2025-01-06", "2025-04-20", "2025-04-21", "2025-05-01",
  "2025-05-03", "2025-06-08", "2025-06-19", "2025-08-15", "2025-11-01",
  "2025-11-11", "2025-12-25", "2025-12-26"
];

export default function ReportDetails({ reportData }) {
  const { allDays } = reportData;

  const getDayType = (date) => {
    const parsedDate = parseISO(date);
    if (polishHolidays.includes(date)) return { label: "Święto", color: "bg-red-100 text-red-800" };
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