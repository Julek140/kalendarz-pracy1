import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ImportDialog({ onImportComplete }) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [importedCount, setImportedCount] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(fileType)) {
        setFile(selectedFile);
        setStatus(null);
        setErrors([]);
      } else {
        setStatus('error');
        setErrors([language === 'pl' ? 'Nieprawidłowy format pliku. Użyj CSV lub Excel.' : 'Invalid file format. Use CSV or Excel.']);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setStatus(null);
    setErrors([]);

    try {
      // 1. Upload pliku
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      // 2. Ekstrakcja danych z pliku
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Data w formacie YYYY-MM-DD" },
              department: { type: "string", description: "MASZYNOWNIA, PAKOWNIA lub OBA_DZIALY" },
              shifts: { type: "number", description: "Liczba zmian (1-3)" },
              is_downtime: { type: "boolean", description: "Czy przestój (true/false)" },
              revenue_ikea: { type: "number", description: "Obrót IKEA SUPPLY w PLN" },
              revenue_ikea_industry: { type: "number", description: "Obrót IKEA INDUSTRY w PLN" },
              revenue_others: { type: "number", description: "Obrót POZOSTALI w PLN" },
              trucks_ikea: { type: "number", description: "Liczba ciężarówek IKEA SUPPLY" },
              trucks_ikea_industry: { type: "number", description: "Liczba ciężarówek IKEA INDUSTRY" },
              trucks_others: { type: "number", description: "Liczba ciężarówek POZOSTALI" },
              notes: { type: "string", description: "Uwagi" }
            },
            required: ["date", "department"]
          }
        }
      });

      if (extractResult.status === 'error') {
        setStatus('error');
        setErrors([extractResult.details || (language === 'pl' ? 'Nie udało się odczytać danych z pliku' : 'Failed to read data from file')]);
        setIsProcessing(false);
        return;
      }

      const dataToImport = extractResult.output;

      if (!Array.isArray(dataToImport) || dataToImport.length === 0) {
        setStatus('error');
        setErrors([language === 'pl' ? 'Plik nie zawiera żadnych danych do importu' : 'File contains no data to import']);
        setIsProcessing(false);
        return;
      }

      // 3. Walidacja i normalizacja danych
      const validatedData = [];
      const validationErrors = [];

      dataToImport.forEach((row, index) => {
        const rowNum = index + 1;
        
        // Walidacja daty
        if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          validationErrors.push(`${language === 'pl' ? 'Wiersz' : 'Row'} ${rowNum}: ${language === 'pl' ? 'Nieprawidłowa data' : 'Invalid date'} (${row.date})`);
          return;
        }

        // Walidacja działu
        const validDepartments = ['MASZYNOWNIA', 'PAKOWNIA', 'OBA_DZIALY'];
        if (!row.department || !validDepartments.includes(row.department.toUpperCase())) {
          validationErrors.push(`${language === 'pl' ? 'Wiersz' : 'Row'} ${rowNum}: ${language === 'pl' ? 'Nieprawidłowy dział' : 'Invalid department'} (${row.department})`);
          return;
        }

        validatedData.push({
          date: row.date,
          department: row.department.toUpperCase(),
          shifts: row.shifts || 1,
          is_downtime: row.is_downtime || false,
          revenue_ikea: row.revenue_ikea || 0,
          revenue_ikea_industry: row.revenue_ikea_industry || 0,
          revenue_others: row.revenue_others || 0,
          trucks_ikea: row.trucks_ikea || 0,
          trucks_ikea_industry: row.trucks_ikea_industry || 0,
          trucks_others: row.trucks_others || 0,
          notes: row.notes || ""
        });
      });

      if (validationErrors.length > 0) {
        setStatus('warning');
        setErrors(validationErrors);
      }

      if (validatedData.length === 0) {
        setStatus('error');
        setErrors([language === 'pl' ? 'Brak prawidłowych danych do zaimportowania' : 'No valid data to import']);
        setIsProcessing(false);
        return;
      }

      // 4. Bulk insert
      await base44.entities.WorkDay.bulkCreate(validatedData);

      setImportedCount(validatedData.length);
      setStatus('success');
      
      if (onImportComplete) {
        onImportComplete();
      }

      setTimeout(() => {
        setIsOpen(false);
        setFile(null);
        setStatus(null);
        setErrors([]);
        setImportedCount(0);
      }, 3000);

    } catch (error) {
      console.error("Import error:", error);
      setStatus('error');
      setErrors([error.message || (language === 'pl' ? 'Wystąpił błąd podczas importu' : 'An error occurred during import')]);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `date,department,shifts,is_downtime,revenue_ikea,revenue_ikea_industry,revenue_others,trucks_ikea,trucks_ikea_industry,trucks_others,notes
2025-01-15,MASZYNOWNIA,2,false,150000,50000,20000,3,1,1,Przykładowy wpis
2025-01-16,PAKOWNIA,3,false,200000,75000,30000,4,2,2,
2025-01-17,OBA_DZIALY,1,true,0,0,0,0,0,0,Przestój techniczny`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'szablon_import_workday.csv';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4 mr-2" />
          {language === 'pl' ? 'Import z Excel/CSV' : 'Import from Excel/CSV'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{language === 'pl' ? 'Import danych z pliku' : 'Import data from file'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instrukcje */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              {language === 'pl' ? 'Jak przygotować plik:' : 'How to prepare the file:'}
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>{language === 'pl' ? 'Format: CSV lub Excel (.xlsx, .xls)' : 'Format: CSV or Excel (.xlsx, .xls)'}</li>
              <li>
                {language === 'pl' 
                  ? 'Wymagane kolumny: date (YYYY-MM-DD), department (MASZYNOWNIA/PAKOWNIA/OBA_DZIALY)' 
                  : 'Required columns: date (YYYY-MM-DD), department (MASZYNOWNIA/PAKOWNIA/OBA_DZIALY)'}
              </li>
              <li>
                {language === 'pl' 
                  ? 'Opcjonalne: shifts, is_downtime, revenue_ikea, revenue_ikea_industry, revenue_others, trucks_ikea, trucks_ikea_industry, trucks_others, notes' 
                  : 'Optional: shifts, is_downtime, revenue_ikea, revenue_ikea_industry, revenue_others, trucks_ikea, trucks_ikea_industry, trucks_others, notes'}
              </li>
            </ul>
          </div>

          {/* Przycisk pobierania szablonu */}
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {language === 'pl' ? 'Pobierz szablon CSV' : 'Download CSV template'}
          </Button>

          {/* Upload pliku */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">
                {file 
                  ? file.name 
                  : (language === 'pl' 
                    ? 'Kliknij aby wybrać plik CSV lub Excel' 
                    : 'Click to select CSV or Excel file')}
              </p>
              <Button type="button" variant="outline" size="sm">
                {language === 'pl' ? 'Wybierz plik' : 'Select file'}
              </Button>
            </label>
          </div>

          {/* Status i błędy */}
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-900 font-semibold">
                  {language === 'pl' ? 'Import zakończony pomyślnie!' : 'Import completed successfully!'}
                </p>
                <p className="text-green-700 text-sm">
                  {language === 'pl' 
                    ? `Zaimportowano ${importedCount} wpisów` 
                    : `Imported ${importedCount} entries`}
                </p>
              </div>
            </div>
          )}

          {status === 'warning' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-900 font-semibold">
                    {language === 'pl' ? 'Import z ostrzeżeniami' : 'Import with warnings'}
                  </p>
                  <p className="text-yellow-700 text-sm">
                    {language === 'pl' 
                      ? `Zaimportowano ${importedCount} wpisów. Pominięto wiersze z błędami:` 
                      : `Imported ${importedCount} entries. Skipped rows with errors:`}
                  </p>
                </div>
              </div>
              <div className="bg-yellow-100 rounded p-2 max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-yellow-800">{err}</p>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-900 font-semibold">
                    {language === 'pl' ? 'Błąd importu' : 'Import error'}
                  </p>
                  <div className="text-red-700 text-sm space-y-1 mt-1">
                    {errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Przyciski akcji */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              {language === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'pl' ? 'Importowanie...' : 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {language === 'pl' ? 'Importuj' : 'Import'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}