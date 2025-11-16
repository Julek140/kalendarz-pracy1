import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isWeekend, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Save, Trash2, X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DayDialog({
  selectedDay,
  existingWorkDays,
  holiday,
  onSave,
  onDelete,
  onClose,
  isProcessing,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [department, setDepartment] = useState("OBA_DZIALY");
  const [isDowntime, setIsDowntime] = useState(false);
  const [notes, setNotes] = useState("");
  
  const isWeekendDay = isWeekend(selectedDay);
  const dayOfWeek = getDay(selectedDay);
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const defaultShifts = isWeekday ? 3 : 1;
  const [shifts, setShifts] = useState(defaultShifts);

  const startNewEntry = () => {
    setEditingId(null);
    setDepartment("OBA_DZIALY");
    setIsDowntime(false);
    setShifts(defaultShifts);
    setNotes("");
    setShowForm(true);
  };

  const startEdit = (workDay) => {
    setEditingId(workDay.id);
    setDepartment(workDay.department);
    setIsDowntime(workDay.is_downtime || false);
    setShifts(workDay.shifts || defaultShifts);
    setNotes(workDay.notes || "");
    setShowForm(true);
  };

  const handleSave = () => {
    const data = {
      date: format(selectedDay, 'yyyy-MM-dd'),
      department,
      shifts: isDowntime ? 0 : shifts,
      is_downtime: isDowntime,
      notes: notes.trim() || undefined,
    };

    onSave(data, editingId);
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    onDelete(id);
  };

  const getDepartmentBadge = (dept) => {
    if (dept === "MASZYNOWNIA") return "🏭 Maszynownia";
    if (dept === "PAKOWNIA") return "📦 Pakownia";
    if (dept === "OBA_DZIALY") return "🏭📦 Oba działy";
    return dept;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-4 py-4">
          {/* Lista istniejących wpisów */}
          {existingWorkDays.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Wpisy dla tego dnia:</h3>
              <div className="space-y-2">
                {existingWorkDays.map((workDay) => (
                  <Card key={workDay.id} className="p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">
                            {getDepartmentBadge(workDay.department)}
                          </span>
                          {workDay.is_downtime && (
                            <span className="text-sm bg-gray-200 text-gray-800 px-2 py-1 rounded">
                              ⏸️ Przestój
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Zmiany:</span> {workDay.shifts || 0}
                          {workDay.notes && (
                            <span className="ml-3">
                              <span className="font-medium">Uwagi:</span> {workDay.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(workDay)}
                          disabled={isProcessing}
                        >
                          Edytuj
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(workDay.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Przycisk dodaj nowy */}
          {!showForm && (
            <Button
              onClick={startNewEntry}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing}
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj {existingWorkDays.length > 0 ? 'kolejny' : ''} wpis
            </Button>
          )}

          {/* Formularz */}
          {showForm && (
            <Card className="p-4 bg-blue-50 border-2 border-blue-300">
              <h3 className="font-semibold mb-4">
                {editingId ? 'Edytuj wpis' : 'Nowy wpis'}
              </h3>
              
              <div className="space-y-4">
                {/* Department Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Wybierz dział:</Label>
                  <RadioGroup value={department} onValueChange={setDepartment}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                      <RadioGroupItem value="MASZYNOWNIA" id="maszynownia" />
                      <Label htmlFor="maszynownia" className="cursor-pointer flex-1">
                        🏭 Maszynownia
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-green-100 transition-colors">
                      <RadioGroupItem value="PAKOWNIA" id="pakownia" />
                      <Label htmlFor="pakownia" className="cursor-pointer flex-1">
                        📦 Pakownia
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                      <RadioGroupItem value="OBA_DZIALY" id="oba" />
                      <Label htmlFor="oba" className="cursor-pointer flex-1">
                        🏭📦 Oba działy
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Shifts Selection */}
                {!isDowntime && (
                  <div className="p-4 rounded-lg bg-white border border-indigo-200">
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
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100 border">
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

                {/* Form buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Anuluj
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Zapisz
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Close button */}
        {!showForm && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Zamknij
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}