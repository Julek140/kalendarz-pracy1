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
import { format, isWeekend } from "date-fns";
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
  const [department, setDepartment] = useState(existingWorkDay?.department || "MASZYNOWNIA");
  const [isDowntime, setIsDowntime] = useState(existingWorkDay?.is_downtime || false);
  const [notes, setNotes] = useState(existingWorkDay?.notes || "");

  const handleSave = () => {
    onSave({
      date: format(selectedDay, 'yyyy-MM-dd'),
      department,
      is_downtime: isDowntime,
      notes: notes.trim() || undefined,
    });
  };

  const isWeekendDay = isWeekend(selectedDay);

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

          {/* Downtime Checkbox */}
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border">
            <Checkbox
              id="downtime"
              checked={isDowntime}
              onCheckedChange={setIsDowntime}
            />
            <Label htmlFor="downtime" className="cursor-pointer flex-1 font-medium">
              ⏸️ Przestój
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