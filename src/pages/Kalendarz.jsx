import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { pl } from "date-fns/locale";

import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarLegend from "../components/calendar/CalendarLegend";
import DayDialog from "../components/calendar/DayDialog";

// Polskie święta 2025
const polishHolidays = [
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
];

export default function KalendarzPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: workDays = [], isLoading } = useQuery({
    queryKey: ['workDays'],
    queryFn: () => base44.entities.WorkDay.list(),
    initialData: [],
  });

  const createWorkDayMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkDay.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDays'] });
      setShowDialog(false);
    },
  });

  const updateWorkDayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkDay.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDays'] });
      setShowDialog(false);
    },
  });

  const deleteWorkDayMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkDay.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDays'] });
      setShowDialog(false);
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getWorkDayForDate = (date) => {
    return workDays.find(wd => isSameDay(new Date(wd.date), date));
  };

  const getHolidayForDate = (date) => {
    return polishHolidays.find(h => h.date === format(date, 'yyyy-MM-dd'));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDialog(true);
  };

  const handleSaveWorkDay = (data) => {
    const existingWorkDay = getWorkDayForDate(selectedDay);
    if (existingWorkDay) {
      updateWorkDayMutation.mutate({ id: existingWorkDay.id, data });
    } else {
      createWorkDayMutation.mutate(data);
    }
  };

  const handleDeleteWorkDay = () => {
    const existingWorkDay = getWorkDayForDate(selectedDay);
    if (existingWorkDay) {
      deleteWorkDayMutation.mutate(existingWorkDay.id);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Kalendarz Pracy Zakładu</h1>
              <p className="text-slate-600 mt-1">Zarządzaj harmonogramem pracy działów</p>
            </div>
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
            existingWorkDay={getWorkDayForDate(selectedDay)}
            holiday={getHolidayForDate(selectedDay)}
            onSave={handleSaveWorkDay}
            onDelete={handleDeleteWorkDay}
            onClose={() => setShowDialog(false)}
            isProcessing={createWorkDayMutation.isPending || updateWorkDayMutation.isPending || deleteWorkDayMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}