import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function ReportExport({ reportData }) {
  const handleSavePDF = () => {
    // Dodaj wskazówkę przed otwarciem okna drukowania
    const userConfirmed = window.confirm(
      'Za chwilę otworzy się okno drukowania.\n\n' +
      'Aby zapisać jako PDF:\n' +
      '1. W polu "Drukarka" wybierz "Zapisz jako PDF" lub "Microsoft Print to PDF"\n' +
      '2. Kliknij "Zapisz" lub "Drukuj"\n\n' +
      'Kliknij OK, aby kontynuować.'
    );
    
    if (userConfirmed) {
      window.print();
    }
  };

  return (
    <div className="flex gap-3 print:hidden">
      <Button
        onClick={handleSavePDF}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        <FileDown className="w-4 h-4 mr-2" />
        Zapisz jako PDF
      </Button>
    </div>
  );
}