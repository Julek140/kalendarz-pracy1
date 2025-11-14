import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isWeekend, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Save, Trash2, X } from "lucide-react";

export default function DayDialog({
  selectedDay,
  existingWorkDay,
  holiday,
  onSave,
  onDelete,
  onClose,
  isProcessing,
}) {
  const [department, setDepartment] = useState(existingWorkDay?.department || "OBA_DZIALY");
  const [isDowntime, setIsDowntime] = useState(existingWorkDay?.is_downtime || false);
  const [notes, setNotes] = useState(existingWorkDay?.notes || "");
  
  const isWeekendDay = isWeekend(selectedDay);
  const dayOfWeek = getDay(selectedDay); // 0=niedziela, 1=pon, ..., 6=sobota
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Pn-Pt
  
  // Domyślna liczba zmian: 3 dla Pn-Pt, 1 dla soboty/niedzieli
  const defaultShifts = isWeekday ? 3 : 1;
  const [shifts, setShifts] = useState(existingWorkDay?.shifts || defaultShifts);

  const handleSave = () => {
    onSave({
      date: format(selectedDay, 'yyyy-MM-dd'),
      department,
      shifts: isDowntime ? 0 : shifts,
      is_downtime: isDowntime,
      notes: notes.trim() || undefined,
    });
  };

  // Reset shifts when downtime changes
  useEffect(() => {
    if (isDowntime) {
      // Nie zmieniaj shifts gdy jest przestój - po prostu będzie ignorowane
    }
  }, [isDowntime]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {format(selectedDay, 'd MMMM yyyy', { locale: pl })}
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-1">
            {format(selectedDay, 'EEEE', { locale: pl })}
            {isWeekendDay && " • Weekend (nadgodziny)"}
            {holiday && ` • ${holiday.name} 🎉`}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Department Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Wybierz dział:</Label>
            <RadioGroup value={department} onValueChange={setDepartment}>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                <RadioGroupItem value="MASZYNOWNIA" id="maszynownia" />
                <Label htmlFor="maszynownia" className="cursor-pointer flex-1">
                  🏭 Maszynownia
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-green-50 transition-colors">
                <RadioGroupItem value="PAKOWNIA" id="pakownia" />
                <Label htmlFor="pakownia" className="cursor-pointer flex-1">
                  📦 Pakownia
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                <RadioGroupItem value="OBA_DZIALY" id="oba" />
                <Label htmlFor="oba" className="cursor-pointer flex-1">
                  🏭📦 Oba działy
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Shifts Selection */}
          {!isDowntime && (
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
              <Label className="text-base font-semibold mb-3 block">
                Liczba zmian:
                <span className="text-sm font-normal text-slate-600 ml-2">
                  ({isWeekday ? 'Pn-Pt: domyślnie 3 zmiany' : 'Weekend: domyślnie 1 zmiana'})
                </span>
              </Label>
              <div className="space-y-2">
                {[1, 2, 3].map((shiftNum) => (
                  <div
                    key={shiftNum}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                      shifts === shiftNum
                        ? 'border-indigo-500 bg-indigo-100'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <Checkbox
                      id={`shift-${shiftNum}`}
                      checked={shifts === shiftNum}
                      onCheckedChange={(checked) => {
                        if (checked) setShifts(shiftNum);
                      }}
                    />
                    <Label htmlFor={`shift-${shiftNum}`} className="cursor-pointer flex-1 font-medium">
                      {shiftNum} {shiftNum === 1 ? 'zmiana' : shiftNum <= 4 ? 'zmiany' : 'zmian'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downtime Checkbox */}
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border">
            <Checkbox
              id="downtime"
              checked={isDowntime}
              onCheckedChange={setIsDowntime}
            />
            <Label htmlFor="downtime" className="cursor-pointer flex-1 font-medium">
              ⏸️ Przestój (brak pracy)
            </Label>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
              Uwagi (opcjonalnie):
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodatkowe informacje..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingWorkDay && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isProcessing}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Usuń
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}