import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, PartyPopper } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function HolidayDialog({ onClose, customHolidays }) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const createHolidayMutation = useMutation({
    mutationFn: (data) => base44.entities.Holiday.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setDate("");
      setName("");
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (id) => base44.entities.Holiday.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });

  const handleAdd = () => {
    if (date && name.trim()) {
      createHolidayMutation.mutate({
        date,
        name: name.trim(),
        is_work_free: true,
      });
    }
  };

  const sortedHolidays = [...customHolidays].sort((a, b) => 
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <PartyPopper className="w-6 h-6 text-red-500" />
            Zarządzaj świętami
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            Dodaj dodatkowe dni wolne od pracy (np. Wigilia, lokalne święta)
          </p>
        </DialogHeader>

        {/* Add new holiday */}
        <Card className="border-2 border-dashed border-red-200 bg-red-50/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Dodaj nowe święto</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="holidayDate" className="text-sm font-medium mb-2 block">
                  Data święta
                </Label>
                <Input
                  id="holidayDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="holidayName" className="text-sm font-medium mb-2 block">
                  Nazwa święta
                </Label>
                <Input
                  id="holidayName"
                  placeholder="np. Wigilia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={!date || !name.trim() || createHolidayMutation.isPending}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj święto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List of custom holidays */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-4">Twoje niestandardowe święta ({sortedHolidays.length})</h3>
          {sortedHolidays.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
              <p>Nie dodano jeszcze żadnych niestandardowych świąt</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {sortedHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {format(parseISO(holiday.date), 'd MMM yyyy', { locale: pl })}
                    </Badge>
                    <span className="font-medium">🎉 {holiday.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                    disabled={deleteHolidayMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}