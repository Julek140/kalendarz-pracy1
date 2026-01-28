import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ImportDialog({ onImportComplete, workDays = [] }) {
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
      if (fileType === 'csv') {
        setFile(selectedFile);
        setStatus(null);
        setErrors([]);
      } else {
        setStatus('error');
        setErrors([language === 'pl' ? 'Nieprawidłowy format pliku. Użyj CSV.' : 'Invalid file format. Use CSV.']);
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
              date: { type: "string", description: "Data w dowolnym formacie (YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY)" },
              department: { type: "string", description: "MASZYNOWNIA, PAKOWNIA lub OBA_DZIALY lub OBA_DZIAŁY" },
              shifts: { type: ["number", "string"], description: "Liczba zmian (1-3), może być jako tekst" },
              is_downtime: { type: ["boolean", "string"], description: "Czy przestój - true/false/Prawda/Fałsz" },
              revenue_ikea: { type: ["number", "string"], description: "Obrót IKEA SUPPLY w PLN, może być jako tekst" },
              revenue_ikea_industry: { type: ["number", "string"], description: "Obrót IKEA INDUSTRY w PLN, może być jako tekst" },
              revenue_others: { type: ["number", "string"], description: "Obrót POZOSTALI w PLN, może być jako tekst" },
              trucks_ikea: { type: ["number", "string"], description: "Liczba ciężarówek IKEA SUPPLY, może być jako tekst" },
              trucks_ikea_industry: { type: ["number", "string"], description: "Liczba ciężarówek IKEA INDUSTRY, może być jako tekst" },
              trucks_others: { type: ["number", "string"], description: "Liczba ciężarówek POZOSTALI, może być jako tekst" },
              notes: { type: "string", description: "Uwagi" }
            },
            required: ["date", "department"]
          }
        }
      });

      if (extractResult.status === 'error') {
        setStatus('error');
        const errorMsg = extractResult.details || (language === 'pl' ? 'Nie udało się odczytać danych z pliku' : 'Failed to read data from file');
        setErrors([
          errorMsg,
          language === 'pl' ? 'Sprawdź, czy plik jest poprawnym plikiem CSV' : 'Check if file is a valid CSV file'
        ]);
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

        // Konwersja i walidacja daty
        let dateStr = row.date;
        if (!dateStr) {
          validationErrors.push(`${language === 'pl' ? 'Wiersz' : 'Row'} ${rowNum}: ${language === 'pl' ? 'Brak daty' : 'Missing date'}`);
          return;
        }

        // Konwersja z DD.MM.YYYY lub DD/MM/YYYY na YYYY-MM-DD
        if (/^\d{2}[./]\d{2}[./]\d{4}$/.test(dateStr)) {
          const parts = dateStr.split(/[./]/);
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        // Sprawdź czy data jest w poprawnym formacie
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          validationErrors.push(`${language === 'pl' ? 'Wiersz' : 'Row'} ${rowNum}: ${language === 'pl' ? 'Nieprawidłowa data' : 'Invalid date'} (${row.date})`);
          return;
        }

        // Walidacja działu
        const validDepartments = ['MASZYNOWNIA', 'PAKOWNIA', 'OBA_DZIALY'];
        const department = String(row.department || '').toUpperCase();
        if (!department || !validDepartments.includes(department)) {
          validationErrors.push(`${language === 'pl' ? 'Wiersz' : 'Row'} ${rowNum}: ${language === 'pl' ? 'Nieprawidłowy dział' : 'Invalid department'} (${row.department})`);
          return;
        }

        // Parsowanie wartości - obsługa stringów z eksportu Dashboard
        const parseNumber = (val) => {
          if (val === null || val === undefined || val === '') return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        const parseBoolean = (val) => {
          if (typeof val === 'boolean') return val;
          return String(val).toLowerCase() === 'true';
        };

        validatedData.push({
          date: dateStr,
          department: department,
          shifts: parseNumber(row.shifts) || 1,
          is_downtime: parseBoolean(row.is_downtime),
          revenue_ikea: parseNumber(row.revenue_ikea),
          revenue_ikea_industry: parseNumber(row.revenue_ikea_industry),
          revenue_others: parseNumber(row.revenue_others),
          trucks_ikea: parseNumber(row.trucks_ikea),
          trucks_ikea_industry: parseNumber(row.trucks_ikea_industry),
          trucks_others: parseNumber(row.trucks_others),
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

      // 4. Pobierz wszystkie istniejące wpisy dla dat z pliku
      const uniqueDates = [...new Set(validatedData.map(item => item.date))];
      const existingWorkDays = await base44.entities.WorkDay.filter({
        date: { $in: uniqueDates }
      });

      // 5. Rozdziel dane na aktualizacje i nowe wpisy
      const toUpdate = [];
      const toCreate = [];

      validatedData.forEach(newEntry => {
        const existing = existingWorkDays.find(
          wd => wd.date === newEntry.date && wd.department === newEntry.department
        );

        if (existing) {
          // Wpis istnieje - zaktualizuj go
          toUpdate.push({
            id: existing.id,
            data: newEntry
          });
        } else {
          // Wpis nie istnieje - utwórz nowy
          toCreate.push(newEntry);
        }
      });

      // 6. Wykonaj aktualizacje i tworzenie
      const updatePromises = toUpdate.map(item => 
        base44.entities.WorkDay.update(item.id, item.data)
      );

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      if (toCreate.length > 0) {
        await base44.entities.WorkDay.bulkCreate(toCreate);
      }

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

  const downloadTemplate = (withData = false) => {
    let csvContent = 'date,department,shifts,is_downtime,revenue_ikea,revenue_ikea_industry,revenue_others,trucks_ikea,trucks_ikea_industry,trucks_others,notes\n';
    
    if (withData && workDays.length > 0) {
      // Sortuj dane po dacie
      const sortedData = [...workDays].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      sortedData.forEach(wd => {
        const row = [
          wd.date,
          wd.department,
          wd.shifts || 1,
          wd.is_downtime || false,
          wd.revenue_ikea || 0,
          wd.revenue_ikea_industry || 0,
          wd.revenue_others || 0,
          wd.trucks_ikea || 0,
          wd.trucks_ikea_industry || 0,
          wd.trucks_others || 0,
          (wd.notes || '').replace(/,/g, ';') // Zamień przecinki na średniki w notatkach
        ].join(',');
        csvContent += row + '\n';
      });
    } else {
      // Pusty szablon z przykładami
      csvContent += '2025-01-15,MASZYNOWNIA,2,false,150000,50000,20000,3,1,1,Przykładowy wpis\n';
      csvContent += '2025-01-16,PAKOWNIA,3,false,200000,75000,30000,4,2,2,\n';
      csvContent += '2025-01-17,OBA_DZIALY,1,true,0,0,0,0,0,0,Przestój techniczny\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = withData ? 'workday_export.csv' : 'workday_template.csv';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4 mr-2" />
          {language === 'pl' ? 'Import z CSV' : 'Import from CSV'}
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
              <li>{language === 'pl' ? 'Format: CSV' : 'Format: CSV'}</li>
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

          {/* Przyciski pobierania */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => downloadTemplate(false)}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'pl' ? 'Pusty szablon' : 'Empty template'}
            </Button>
            <Button
              onClick={() => downloadTemplate(true)}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100"
              disabled={workDays.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'pl' ? 'Eksport danych' : 'Export data'}
            </Button>
            </div>

          {/* Upload pliku */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
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
                    ? 'Kliknij aby wybrać plik CSV' 
                    : 'Click to select CSV file')}
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