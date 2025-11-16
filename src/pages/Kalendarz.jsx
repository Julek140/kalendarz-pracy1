import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { pl } from "date-fns/locale";

import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarLegend from "../components/calendar/CalendarLegend";
import DayDialog from "../components/calendar/DayDialog";
import HolidayDialog from "../components/calendar/HolidayDialog";

// Polskie święta 2025-2029
const polishHolidays = [
  // 2025
  { date: "2025-01-01", name: "Nowy Rok" },
  { date: "2025-01-06", name: "Trzech Króli" },
  { date: "2025-04-20", name: "Wielkanoc" },
  { date: "2025-04-21", name: "Poniedziałek Wielkanocny" },
  { date: "2025-05-01", name: "Święto Pracy" },
  { date: "2025-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2025-06-08", name: "Zielone Świątki" },
  { date: "2025-06-19", name: "Boże Ciało" },
  { date: "2025-08-15", name: "Wniebowzięcie NMP" },
  { date: "2025-11-01", name: "Wszystkich Świętych" },
  { date: "2025-11-11", name: "Święto Niepodległości" },
  { date: "2025-12-25", name: "Boże Narodzenie" },
  { date: "2025-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2026
  { date: "2026-01-01", name: "Nowy Rok" },
  { date: "2026-01-06", name: "Trzech Króli" },
  { date: "2026-04-05", name: "Wielkanoc" },
  { date: "2026-04-06", name: "Poniedziałek Wielkanocny" },
  { date: "2026-05-01", name: "Święto Pracy" },
  { date: "2026-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2026-05-24", name: "Zielone Świątki" },
  { date: "2026-06-04", name: "Boże Ciało" },
  { date: "2026-08-15", name: "Wniebowzięcie NMP" },
  { date: "2026-11-01", name: "Wszystkich Świętych" },
  { date: "2026-11-11", name: "Święto Niepodległości" },
  { date: "2026-12-25", name: "Boże Narodzenie" },
  { date: "2026-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2027
  { date: "2027-01-01", name: "Nowy Rok" },
  { date: "2027-01-06", name: "Trzech Króli" },
  { date: "2027-03-28", name: "Wielkanoc" },
  { date: "2027-03-29", name: "Poniedziałek Wielkanocny" },
  { date: "2027-05-01", name: "Święto Pracy" },
  { date: "2027-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2027-05-16", name: "Zielone Świątki" },
  { date: "2027-05-27", name: "Boże Ciało" },
  { date: "2027-08-15", name: "Wniebowzięcie NMP" },
  { date: "2027-11-01", name: "Wszystkich Świętych" },
  { date: "2027-11-11", name: "Święto Niepodległości" },
  { date: "2027-12-25", name: "Boże Narodzenie" },
  { date: "2027-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2028
  { date: "2028-01-01", name: "Nowy Rok" },
  { date: "2028-01-06", name: "Trzech Króli" },
  { date: "2028-04-16", name: "Wielkanoc" },
  { date: "2028-04-17", name: "Poniedziałek Wielkanocny" },
  { date: "2028-05-01", name: "Święto Pracy" },
  { date: "2028-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2028-06-04", name: "Zielone Świątki" },
  { date: "2028-06-15", name: "Boże Ciało" },
  { date: "2028-08-15", name: "Wniebowzięcie NMP" },
  { date: "2028-11-01", name: "Wszystkich Świętych" },
  { date: "2028-11-11", name: "Święto Niepodległości" },
  { date: "2028-12-25", name: "Boże Narodzenie" },
  { date: "2028-12-26", name: "Drugi Dzień Bożego Narodzenia" },
  
  // 2029
  { date: "2029-01-01", name: "Nowy Rok" },
  { date: "2029-01-06", name: "Trzech Króli" },
  { date: "2029-04-01", name: "Wielkanoc" },
  { date: "2029-04-02", name: "Poniedziałek Wielkanocny" },
  { date: "2029-05-01", name: "Święto Pracy" },
  { date: "2029-05-03", name: "Święto Konstytucji 3 Maja" },
  { date: "2029-05-20", name: "Zielone Świątki" },
  { date: "2029-05-31", name: "Boże Ciało" },
  { date: "2029-08-15", name: "Wniebowzięcie NMP" },
  { date: "2029-11-01", name: "Wszystkich Świętych" },
  { date: "2029-11-11", name: "Święto Niepodległości" },
  { date: "2029-12-25", name: "Boże Narodzenie" },
  { date: "2029-12-26", name: "Drugi Dzień Bożego Narodzenia" },
];

export default function KalendarzPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: workDays = [], isLoading } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const { data: customHolidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list(),
    initialData: [],
  });

  const createWorkDayMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkDay.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDays'] });
    },
  });

  const updateWorkDayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkDay.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDays'] });
    },
  });

  const deleteWorkDayMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkDay.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDays'] });
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getWorkDaysForDate = (date) => {
    return workDays.filter(wd => isSameDay(new Date(wd.date), date));
  };

  const getWorkDayForDate = (date) => {
    // Dla kompatybilności z CalendarGrid - zwraca pierwszy wpis
    const daysForDate = getWorkDaysForDate(date);
    return daysForDate.length > 0 ? daysForDate[0] : null;
  };

  const getHolidayForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Sprawdź wbudowane święta
    const builtIn = polishHolidays.find(h => h.date === dateStr);
    if (builtIn) return { ...builtIn, isCustom: false };
    
    // Sprawdź niestandardowe święta
    const custom = customHolidays.find(h => h.date === dateStr);
    if (custom) return { ...custom, isCustom: true };
    
    return null;
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDialog(true);
  };

  const handleSaveWorkDay = (data, editingId) => {
    if (editingId) {
      updateWorkDayMutation.mutate({ id: editingId, data });
    } else {
      createWorkDayMutation.mutate(data);
    }
  };

  const handleDeleteWorkDay = (id) => {
    deleteWorkDayMutation.mutate(id);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="https://constract.pl/wp-content/uploads/2024/09/cropped-Constract_logo-2024-01-e1744010411889-2048x557.png" 
                alt="CONSTRACT Logo" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Kalendarz Pracy Zakładu CONSTRACT</h1>
                <p className="text-slate-600 mt-1">Zarządzaj harmonogramem pracy działów</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={() => setShowHolidayDialog(true)}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj święto
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="rounded-xl hover:bg-blue-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="min-w-[200px] text-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {format(currentMonth, 'LLLL yyyy', { locale: pl })}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-xl hover:bg-blue-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <CalendarLegend />

        {/* Calendar Grid */}
        <CalendarGrid
          calendarDays={calendarDays}
          currentMonth={currentMonth}
          getWorkDayForDate={getWorkDayForDate}
          getHolidayForDate={getHolidayForDate}
          onDayClick={handleDayClick}
          isLoading={isLoading}
        />

        {/* Day Dialog */}
        {showDialog && (
          <DayDialog
            selectedDay={selectedDay}
            existingWorkDays={getWorkDaysForDate(selectedDay)}
            holiday={getHolidayForDate(selectedDay)}
            onSave={handleSaveWorkDay}
            onDelete={handleDeleteWorkDay}
            onClose={() => setShowDialog(false)}
            isProcessing={createWorkDayMutation.isPending || updateWorkDayMutation.isPending || deleteWorkDayMutation.isPending}
          />
        )}

        {/* Holiday Dialog */}
        {showHolidayDialog && (
          <HolidayDialog
            onClose={() => setShowHolidayDialog(false)}
            customHolidays={customHolidays}
          />
        )}
      </div>
    </div>
  );
}