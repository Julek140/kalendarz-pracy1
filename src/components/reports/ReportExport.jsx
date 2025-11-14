import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, FileDown } from "lucide-react";

export default function ReportExport({ reportData }) {
  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = () => {
    // Otwórz okno drukowania z sugestią zapisania jako PDF
    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      mediaQueryList.addListener(() => {});
    }
    window.print();
  };

  return (
    <div className="flex gap-3 print:hidden">
      <Button
        onClick={handlePrint}
        variant="outline"
        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
      >
        <Printer className="w-4 h-4 mr-2" />
        Drukuj PDF
      </Button>
      <Button
        onClick={handleSavePDF}
        variant="outline"
        className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
      >
        <FileDown className="w-4 h-4 mr-2" />
        Zapisz PDF
      </Button>
    </div>
  );
}