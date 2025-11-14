import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

export default function ReportExport({ reportData }) {
  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const { startDate, endDate, balance, maszynownia, pakownia, allDays, holidays } = reportData;

    // Przygotuj dane do CSV
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM dla polskich znaków
    
    // Nagłówek raportu
    csvContent += `RAPORT PRACY ZAKŁADU\n`;
    csvContent += `Okres:,${format(parseISO(startDate), 'd MMMM yyyy', { locale: pl })} - ${format(parseISO(endDate), 'd MMMM yyyy', { locale: pl })}\n`;
    csvContent += `Wygenerowano:,${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: pl })}\n\n`;

    // Bilans
    csvContent += `BILANS WYKORZYSTANIA\n`;
    csvContent += `Kategoria,Dostępne,Maszynownia Wykorzystane,Maszynownia %,Pakownia Wykorzystane,Pakownia %\n`;
    csvContent += `Dni robocze (Pn-Pt),${balance.availableWeekdays},${balance.usedWeekdaysMaszynownia},${((balance.usedWeekdaysMaszynownia / balance.availableWeekdays) * 100).toFixed(1)}%,${balance.usedWeekdaysPakownia},${((balance.usedWeekdaysPakownia / balance.availableWeekdays) * 100).toFixed(1)}%\n`;
    csvContent += `Soboty,${balance.availableSaturdays},${balance.usedSaturdaysMaszynownia},${balance.availableSaturdays > 0 ? ((balance.usedSaturdaysMaszynownia / balance.availableSaturdays) * 100).toFixed(1) : 0}%,${balance.usedSaturdaysPakownia},${balance.availableSaturdays > 0 ? ((balance.usedSaturdaysPakownia / balance.availableSaturdays) * 100).toFixed(1) : 0}%\n`;
    csvContent += `Zmiany ogółem,${balance.totalAvailableShifts},${balance.usedShiftsMaszynownia},${((balance.usedShiftsMaszynownia / balance.totalAvailableShifts) * 100).toFixed(1)}%,${balance.usedShiftsPakownia},${((balance.usedShiftsPakownia / balance.totalAvailableShifts) * 100).toFixed(1)}%\n\n`;

    // Podsumowanie
    csvContent += `PODSUMOWANIE\n`;
    csvContent += `Dział,Dni pracy,Dni robocze,Soboty,Zmiany ogółem,Zmiany normalne,Nadgodziny,Przestoje\n`;
    csvContent += `Maszynownia,${maszynownia.totalWorkDays},${maszynownia.regularDays},${balance.usedSaturdaysMaszynownia},${maszynownia.totalShifts},${maszynownia.regularShifts},${maszynownia.overtimeShifts},${maszynownia.downtimeDays}\n`;
    csvContent += `Pakownia,${pakownia.totalWorkDays},${pakownia.regularDays},${balance.usedSaturdaysPakownia},${pakownia.totalShifts},${pakownia.regularShifts},${pakownia.overtimeShifts},${pakownia.downtimeDays}\n\n`;

    // Święta
    if (holidays.length > 0) {
      csvContent += `ŚWIĘTA W OKRESIE (${holidays.length})\n`;
      csvContent += `Data,Nazwa\n`;
      holidays.forEach(holiday => {
        csvContent += `${format(parseISO(holiday.date), 'd MMM yyyy', { locale: pl })},${holiday.name}\n`;
      });
      csvContent += `\n`;
    }

    // Szczegółowy wykaz
    csvContent += `SZCZEGÓŁOWY WYKAZ DNI PRACY\n`;
    csvContent += `Data,Dzień tygodnia,Dział,Zmiany,Typ dnia,Status,Uwagi\n`;
    
    const sortedDays = [...allDays].sort((a, b) => 
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );

    sortedDays.forEach(day => {
      const date = parseISO(day.date);
      const dayName = format(date, 'EEEE', { locale: pl });
      const dateStr = format(date, 'd MMM yyyy', { locale: pl });
      
      let dept = '';
      if (day.department === 'MASZYNOWNIA') dept = 'Maszynownia';
      else if (day.department === 'PAKOWNIA') dept = 'Pakownia';
      else if (day.department === 'OBA_DZIALY') dept = 'Oba działy';
      
      const shifts = day.shifts || 0;
      const status = day.is_downtime ? 'Przestój' : 'Pracował';
      const notes = day.notes ? day.notes.replace(/,/g, ';') : '-';
      
      csvContent += `${dateStr},${dayName},${dept},${shifts},Normalny,${status},"${notes}"\n`;
    });

    // Pobierz plik
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `raport_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-3 print:hidden">
      <Button
        onClick={handlePrintPDF}
        variant="outline"
        className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
      >
        <Printer className="w-4 h-4 mr-2" />
        Drukuj / Zapisz PDF
      </Button>
      <Button
        onClick={handleExportCSV}
        variant="outline"
        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
      >
        <FileDown className="w-4 h-4 mr-2" />
        Eksportuj do Excel (CSV)
      </Button>
    </div>
  );
}