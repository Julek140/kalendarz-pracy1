import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isWeekend, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Save, Trash2, X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

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
  const [revenueIkea, setRevenueIkea] = useState("");
  const [revenueOthers, setRevenueOthers] = useState("");
  const { language } = useLanguage();

  const startNewEntry = () => {
    setEditingId(null);
    setDepartment("OBA_DZIALY");
    setIsDowntime(false);
    setShifts(defaultShifts);
    setRevenueIkea("");
    setRevenueOthers("");
    setNotes("");
    setShowForm(true);
  };

  const startEdit = (workDay) => {
    setEditingId(workDay.id);
    setDepartment(workDay.department);
    setIsDowntime(workDay.is_downtime || false);
    setShifts(workDay.shifts || defaultShifts);
    setRevenueIkea(workDay.revenue_ikea ? workDay.revenue_ikea.toString() : "");
    setRevenueOthers(workDay.revenue_others ? workDay.revenue_others.toString() : "");
    setNotes(workDay.notes || "");
    setShowForm(true);
  };

  const handleSave = () => {
    const data = {
      date: format(selectedDay, 'yyyy-MM-dd'),
      department,
      shifts: isDowntime ? 0 : shifts,
      is_downtime: isDowntime,
      revenue_ikea: revenueIkea ? parseFloat(revenueIkea) : 0,
      revenue_others: revenueOthers ? parseFloat(revenueOthers) : 0,
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
    if (dept === "MASZYNOWNIA") return `🏭 ${t('maszynownia', language)}`;
    if (dept === "PAKOWNIA") return `📦 ${t('pakownia', language)}`;
    if (dept === "OBA_DZIALY") return `🏭📦 ${t('obaDzialy', language)}`;
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
                              ⏸️ {t('downtime', language)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div>
                            <span className="font-medium">{t('shifts', language)}:</span> {workDay.shifts || 0}
                          </div>
                          {(workDay.revenue_ikea > 0 || workDay.revenue_others > 0) && (
                            <div className="space-y-1">
                              {workDay.revenue_ikea > 0 && (
                                <div className="text-blue-700">
                                  <span className="font-medium">IKEA SUPPLY:</span> {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(workDay.revenue_ikea)}
                                </div>
                              )}
                              {workDay.revenue_others > 0 && (
                                <div className="text-green-700">
                                  <span className="font-medium">{language === 'pl' ? 'POZOSTALI' : 'OTHERS'}:</span> {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(workDay.revenue_others)}
                                </div>
                              )}
                            </div>
                          )}
                          {workDay.notes && (
                            <div>
                              <span className="font-medium">{t('notes', language)}:</span> {workDay.notes}
                            </div>
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
                          {t('edit', language)}
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
              {t('addNewEntry', language)}
            </Button>
          )}

          {/* Formularz */}
          {showForm && (
            <Card className="p-4 bg-blue-50 border-2 border-blue-300">
              <h3 className="font-semibold mb-4">
                {editingId ? t('edit', language) : t('add', language)} {t('workEntries', language).toLowerCase()}
              </h3>
              
              <div className="space-y-4">
                {/* Department Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">{t('department', language)}:</Label>
                  <RadioGroup value={department} onValueChange={setDepartment}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                      <RadioGroupItem value="MASZYNOWNIA" id="maszynownia" />
                      <Label htmlFor="maszynownia" className="cursor-pointer flex-1">
                        🏭 {t('maszynownia', language)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-green-100 transition-colors">
                      <RadioGroupItem value="PAKOWNIA" id="pakownia" />
                      <Label htmlFor="pakownia" className="cursor-pointer flex-1">
                        📦 {t('pakownia', language)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                      <RadioGroupItem value="OBA_DZIALY" id="oba" />
                      <Label htmlFor="oba" className="cursor-pointer flex-1">
                        🏭📦 {t('obaDzialy', language)}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Shifts Selection */}
                {!isDowntime && (
                  <div className="p-4 rounded-lg bg-white border border-indigo-200">
                    <Label className="text-base font-semibold mb-3 block">
                      {t('shifts', language)}:
                      <span className="text-sm font-normal text-slate-600 ml-2">
                        ({isWeekday ? (language === 'pl' ? 'Pn-Pt: domyślnie 3 zmiany' : 'Mon-Fri: default 3 shifts') : (language === 'pl' ? 'Weekend: domyślnie 1 zmiana' : 'Weekend: default 1 shift')})
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
                            {shiftNum} {language === 'pl' ? (shiftNum === 1 ? 'zmiana' : shiftNum <= 4 ? 'zmiany' : 'zmian') : (shiftNum === 1 ? 'shift' : 'shifts')}
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
                    ⏸️ {t('downtime', language)}
                  </Label>
                </div>

                {/* Revenue Inputs */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="revenue-ikea" className="text-base font-semibold mb-2 block text-blue-700">
                      {t('revenueIkea', language)}:
                    </Label>
                    <Input
                      id="revenue-ikea"
                      type="number"
                      min="0"
                      step="0.01"
                      value={revenueIkea}
                      onChange={(e) => setRevenueIkea(e.target.value)}
                      placeholder="0.00"
                      className="text-lg border-blue-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="revenue-others" className="text-base font-semibold mb-2 block text-green-700">
                      {t('revenueOthers', language)}:
                    </Label>
                    <Input
                      id="revenue-others"
                      type="number"
                      min="0"
                      step="0.01"
                      value={revenueOthers}
                      onChange={(e) => setRevenueOthers(e.target.value)}
                      placeholder="0.00"
                      className="text-lg border-green-300"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                    {t('notes', language)}:
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === 'pl' ? 'Dodatkowe informacje...' : 'Additional information...'}
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
                    {t('cancel', language)}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('save', language)}
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
              {t('close', language)}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}