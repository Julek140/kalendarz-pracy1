import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Truck, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/components/translations";
import { Button } from "@/components/ui/button";

export default function TrucksAnalysis({ reportData, goalsData, language }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', { 
      style: 'currency', 
      currency: 'PLN', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  // Oblicz statystyki dla każdego odbiorcy
  const calculateReceiverStats = (revenueKey, trucksKey) => {
    const totalRevenue = reportData.monthlyData.reduce((sum, m) => sum + (m[revenueKey] || 0), 0);
    const totalTrucks = reportData.monthlyData.reduce((sum, m) => sum + (m[trucksKey] || 0), 0);
    const avgTruckValue = totalTrucks > 0 ? totalRevenue / totalTrucks : 0;
    
    return {
      totalRevenue,
      totalTrucks,
      avgTruckValue,
      monthlyData: reportData.monthlyData.map(m => ({
        month: m.month,
        revenue: m[revenueKey] || 0,
        trucks: m[trucksKey] || 0,
        avgValue: m[trucksKey] > 0 ? (m[revenueKey] || 0) / m[trucksKey] : 0,
      })),
    };
  };

  const ikeaSupplyStats = calculateReceiverStats('revenueIkea', 'trucksIkea');
  const ikeaIndustryStats = calculateReceiverStats('revenueIkeaIndustry', 'trucksIkeaIndustry');
  const othersStats = calculateReceiverStats('revenueOthers', 'trucksOthers');

  // Oblicz wymaganą liczbę ciężarówek do końca roku
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isCurrentYear = reportData.year === currentYear;

  const calculateRequirements = (stats, goalKey, revenueKey) => {
    if (!goalsData || goalsData.length === 0 || stats.avgTruckValue === 0) {
      return { required: 0, status: 'no-data' };
    }

    const totalGoal = goalsData.reduce((sum, g) => sum + (g[goalKey] || 0), 0);
    const remainingGoal = totalGoal - stats.totalRevenue;
    
    // Oblicz wymagane TIRy na wybrany miesiąc (selectedMonthIndex to 0-11)
    let nextMonthRequired = 0;
    let nextMonthGoal = 0;
    let nextMonthRemainingGoal = 0;
    let selectedMonthActual = 0;
    
    if (isCurrentYear) {
      const nextMonthNum = selectedMonthIndex + 1; // convert to 1-12
      const nextMonthGoalData = goalsData.find(g => g.month === nextMonthNum);
      nextMonthGoal = nextMonthGoalData?.[goalKey] || 0;
      
      // Pobierz rzeczywisty obrót dla tego miesiąca
      const monthData = reportData.monthlyData.find(m => m.monthNum === nextMonthNum);
      selectedMonthActual = monthData?.[revenueKey] || 0;
      
      // Oblicz pozostałą kwotę do celu
      nextMonthRemainingGoal = nextMonthGoal - selectedMonthActual;
      
      // Jeśli jest cel dla wybranego miesiąca i znamy średnią wartość TIRa
      if (nextMonthRemainingGoal > 0 && stats.avgTruckValue > 0) {
        nextMonthRequired = Math.ceil(nextMonthRemainingGoal / stats.avgTruckValue);
      }
    }
    
    if (!isCurrentYear || currentMonth >= 12) {
      return { 
        required: 0, 
        status: stats.totalRevenue >= totalGoal ? 'exceeded' : 'below',
        remainingGoal,
        nextMonthRequired: 0,
        nextMonthGoal: 0,
      };
    }

    const monthsRemaining = 12 - currentMonth;
    const requiredTrucksTotal = remainingGoal > 0 ? Math.ceil(remainingGoal / stats.avgTruckValue) : 0;
    const requiredTrucksMonthly = monthsRemaining > 0 ? Math.ceil(requiredTrucksTotal / monthsRemaining) : 0;

    return {
      required: requiredTrucksTotal,
      requiredMonthly: requiredTrucksMonthly,
      remainingGoal,
      status: remainingGoal > 0 ? 'below' : 'exceeded',
      nextMonthRequired,
      nextMonthGoal,
      nextMonthRemainingGoal,
      selectedMonthActual,
    };
  };

  const ikeaSupplyReq = calculateRequirements(ikeaSupplyStats, 'revenue_ikea_goal', 'revenueIkea');
  const ikeaIndustryReq = calculateRequirements(ikeaIndustryStats, 'revenue_ikea_industry_goal', 'revenueIkeaIndustry');
  const othersReq = calculateRequirements(othersStats, 'revenue_others_goal', 'revenueOthers');

  const ReceiverCardOld = ({ title, stats, requirements, color }) => (
    <Card className={`shadow-lg border-none border-l-4 border-l-${color}-600`}>
      <CardHeader className={`bg-gradient-to-r from-${color}-50 to-${color}-100`}>
        <CardTitle className="flex items-center gap-2">
          <Truck className={`w-5 h-5 text-${color}-600`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
            <p className={`text-sm text-${color}-700 mb-1`}>
              {language === 'pl' ? 'Wysłane ciężarówki' : 'Trucks sent'}
            </p>
            <p className={`text-2xl font-bold text-${color}-900`}>{stats.totalTrucks}</p>
          </div>
          <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
            <p className={`text-sm text-${color}-700 mb-1`}>
              {language === 'pl' ? 'Średnia wartość TIRa' : 'Avg. truck value'}
            </p>
            <p className={`text-2xl font-bold text-${color}-900`}>
              {stats.totalTrucks > 0 ? formatCurrency(stats.avgTruckValue) : '-'}
            </p>
          </div>
          <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
            <p className={`text-sm text-${color}-700 mb-1`}>
              {language === 'pl' ? 'Całkowity obrót' : 'Total revenue'}
            </p>
            <p className={`text-2xl font-bold text-${color}-900`}>{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        {requirements.status !== 'no-data' && isCurrentYear && (
          <div className="space-y-3">
            {/* Wymagane TIRy na wybrany miesiąc */}
            {requirements.nextMonthGoal > 0 && (
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                <div className="flex items-start gap-3">
                  <Truck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-blue-900">
                        {language === 'pl' 
                          ? `Wymagane TIRy na:`
                          : `Required trucks for:`}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
                          disabled={selectedMonthIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg capitalize min-w-[120px] text-center">
                          {new Date(reportData.year, selectedMonthIndex).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { month: 'long' })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setSelectedMonthIndex(Math.min(11, selectedMonthIndex + 1))}
                          disabled={selectedMonthIndex === 11}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <strong>{language === 'pl' ? 'Cel miesiąca:' : 'Month goal:'}</strong> {formatCurrency(requirements.nextMonthGoal)}
                      </p>
                      <p>
                        <strong>{language === 'pl' ? 'Osiągnięte:' : 'Achieved:'}</strong> {formatCurrency(requirements.selectedMonthActual)}
                      </p>
                      {requirements.nextMonthRemainingGoal > 0 ? (
                        <>
                          <p>
                            <strong>{language === 'pl' ? 'Do celu:' : 'Remaining:'}</strong> {formatCurrency(requirements.nextMonthRemainingGoal)}
                          </p>
                          <p>
                            <strong>{language === 'pl' ? 'Wymagane TIRy:' : 'Required trucks:'}</strong> ~{requirements.nextMonthRequired} TIRów
                          </p>
                          <p className="text-xs opacity-80">
                            {language === 'pl' 
                              ? `(przy średniej wartości ${formatCurrency(stats.avgTruckValue)}/TIR)`
                              : `(at avg. value of ${formatCurrency(stats.avgTruckValue)}/truck)`}
                          </p>
                        </>
                      ) : (
                        <p className="text-green-700 font-semibold">
                          {language === 'pl' ? '✅ Cel miesiąca osiągnięty!' : '✅ Monthly goal achieved!'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wymagane wysyłki do końca roku */}
            <div className={`p-4 rounded-lg border-2 ${
              requirements.status === 'exceeded' 
                ? `bg-green-50 border-green-300` 
                : `bg-amber-50 border-amber-300`
            }`}>
              <div className="flex items-start gap-3">
                {requirements.status === 'exceeded' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {requirements.status === 'exceeded' ? (
                    <>
                      <p className="font-bold text-green-900 mb-1">
                        {language === 'pl' ? 'Cel roczny przekroczony! 🎉' : 'Annual goal exceeded! 🎉'}
                      </p>
                      <p className="text-sm text-green-800">
                        {language === 'pl' 
                          ? `Osiągnięto cel roczny z nadwyżką ${formatCurrency(Math.abs(requirements.remainingGoal))}.`
                          : `Annual goal achieved with surplus of ${formatCurrency(Math.abs(requirements.remainingGoal))}.`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-amber-900 mb-2">
                        {language === 'pl' ? 'Wymagane wysyłki do końca roku:' : 'Required shipments until year end:'}
                      </p>
                      <div className="space-y-1 text-sm text-amber-800">
                        <p>
                          <strong>{language === 'pl' ? 'Do celu rocznego:' : 'To annual goal:'}</strong> {formatCurrency(requirements.remainingGoal)}
                        </p>
                        {stats.avgTruckValue > 0 && (
                          <>
                            <p>
                              <strong>{language === 'pl' ? 'Łącznie ciężarówek:' : 'Total trucks:'}</strong> {requirements.required} TIRów
                            </p>
                            <p>
                              <strong>{language === 'pl' ? 'Średnio miesięcznie:' : 'Avg. monthly:'}</strong> ~{requirements.requiredMonthly} TIRów/miesiąc
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isCurrentYear && requirements.status !== 'no-data' && (
          <div className={`p-4 rounded-lg ${
            requirements.status === 'exceeded' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${requirements.status === 'exceeded' ? 'text-green-800' : 'text-red-800'}`}>
              {requirements.status === 'exceeded' 
                ? (language === 'pl' ? `✅ Cel roczny przekroczony o ${formatCurrency(Math.abs(requirements.remainingGoal))}` : `✅ Annual goal exceeded by ${formatCurrency(Math.abs(requirements.remainingGoal))}`)
                : (language === 'pl' ? `❌ Nie osiągnięto celu, brakło ${formatCurrency(requirements.remainingGoal)}` : `❌ Goal not met, shortfall of ${formatCurrency(requirements.remainingGoal)}`)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ReceiverCardWithMonth = ({ title, stats, requirements, color }) => (
    <Card className={`shadow-lg border-none border-l-4 border-l-${color}-600`}>
      <CardHeader className={`bg-gradient-to-r from-${color}-50 to-${color}-100`}>
        <CardTitle className="flex items-center gap-2">
          <Truck className={`w-5 h-5 text-${color}-600`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
            <p className={`text-sm text-${color}-700 mb-1`}>
              {language === 'pl' ? 'Wysłane ciężarówki' : 'Trucks sent'}
            </p>
            <p className={`text-2xl font-bold text-${color}-900`}>{stats.totalTrucks}</p>
          </div>
          <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
            <p className={`text-sm text-${color}-700 mb-1`}>
              {language === 'pl' ? 'Średnia wartość TIRa' : 'Avg. truck value'}
            </p>
            <p className={`text-2xl font-bold text-${color}-900`}>
              {stats.totalTrucks > 0 ? formatCurrency(stats.avgTruckValue) : '-'}
            </p>
          </div>
          <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
            <p className={`text-sm text-${color}-700 mb-1`}>
              {language === 'pl' ? 'Całkowity obrót' : 'Total revenue'}
            </p>
            <p className={`text-2xl font-bold text-${color}-900`}>{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        {requirements.status !== 'no-data' && isCurrentYear && (
          <div className="space-y-3">
            {/* Wymagane TIRy na wybrany miesiąc */}
            {requirements.nextMonthGoal > 0 && (
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                <div className="flex items-start gap-3">
                  <Truck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-blue-900">
                        {language === 'pl' 
                          ? `Wymagane TIRy na:`
                          : `Required trucks for:`}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
                          disabled={selectedMonthIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg capitalize min-w-[120px] text-center">
                          {new Date(reportData.year, selectedMonthIndex).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { month: 'long' })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setSelectedMonthIndex(Math.min(11, selectedMonthIndex + 1))}
                          disabled={selectedMonthIndex === 11}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <strong>{language === 'pl' ? 'Cel miesiąca:' : 'Month goal:'}</strong> {formatCurrency(requirements.nextMonthGoal)}
                      </p>
                      <p>
                        <strong>{language === 'pl' ? 'Osiągnięte:' : 'Achieved:'}</strong> {formatCurrency(requirements.selectedMonthActual)}
                      </p>
                      {requirements.nextMonthRemainingGoal > 0 ? (
                        <>
                          <p>
                            <strong>{language === 'pl' ? 'Do celu:' : 'Remaining:'}</strong> {formatCurrency(requirements.nextMonthRemainingGoal)}
                          </p>
                          <p>
                            <strong>{language === 'pl' ? 'Wymagane TIRy:' : 'Required trucks:'}</strong> ~{requirements.nextMonthRequired} TIRów
                          </p>
                          <p className="text-xs opacity-80">
                            {language === 'pl' 
                              ? `(przy średniej wartości ${formatCurrency(stats.avgTruckValue)}/TIR)`
                              : `(at avg. value of ${formatCurrency(stats.avgTruckValue)}/truck)`}
                          </p>
                        </>
                      ) : (
                        <p className="text-green-700 font-semibold">
                          {language === 'pl' ? '✅ Cel miesiąca osiągnięty!' : '✅ Monthly goal achieved!'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wymagane wysyłki do końca roku */}
            {currentMonth < 12 && (
            <div className={`p-4 rounded-lg border-2 ${
              requirements.status === 'exceeded' 
                ? `bg-green-50 border-green-300` 
                : `bg-amber-50 border-amber-300`
            }`}>
              <div className="flex items-start gap-3">
                {requirements.status === 'exceeded' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {requirements.status === 'exceeded' ? (
                    <>
                      <p className="font-bold text-green-900 mb-1">
                        {language === 'pl' ? 'Cel roczny przekroczony! 🎉' : 'Annual goal exceeded! 🎉'}
                      </p>
                      <p className="text-sm text-green-800">
                        {language === 'pl' 
                          ? `Osiągnięto cel roczny z nadwyżką ${formatCurrency(Math.abs(requirements.remainingGoal))}.`
                          : `Annual goal achieved with surplus of ${formatCurrency(Math.abs(requirements.remainingGoal))}.`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-amber-900 mb-2">
                        {language === 'pl' ? 'Wymagane wysyłki do końca roku:' : 'Required shipments until year end:'}
                      </p>
                      <div className="space-y-1 text-sm text-amber-800">
                        <p>
                          <strong>{language === 'pl' ? 'Do celu rocznego:' : 'To annual goal:'}</strong> {formatCurrency(requirements.remainingGoal)}
                        </p>
                        {stats.avgTruckValue > 0 && (
                          <>
                            <p>
                              <strong>{language === 'pl' ? 'Łącznie ciężarówek:' : 'Total trucks:'}</strong> {requirements.required} TIRów
                            </p>
                            <p>
                              <strong>{language === 'pl' ? 'Średnio miesięcznie:' : 'Avg. monthly:'}</strong> ~{requirements.requiredMonthly} TIRów/miesiąc
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Truck className="w-12 h-12" />
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'pl' ? 'Analiza Wysyłek' : 'Shipment Analysis'}
              </h2>
              <p className="text-sm opacity-90">
                {language === 'pl' 
                  ? 'Średnia wartość TIRa i wymagane wysyłki do realizacji celów' 
                  : 'Average truck value and required shipments to meet goals'}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm opacity-90 mb-1">
                {language === 'pl' ? 'Łącznie wysłanych TIRów' : 'Total trucks sent'}
              </p>
              <p className="text-3xl font-bold">
                {ikeaSupplyStats.totalTrucks + ikeaIndustryStats.totalTrucks + othersStats.totalTrucks}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm opacity-90 mb-1">
                {language === 'pl' ? 'Średnia wartość TIRa (ogółem)' : 'Avg. truck value (overall)'}
              </p>
              <p className="text-3xl font-bold">
                {(ikeaSupplyStats.totalTrucks + ikeaIndustryStats.totalTrucks + othersStats.totalTrucks) > 0
                  ? formatCurrency(reportData.totalYearRevenue / (ikeaSupplyStats.totalTrucks + ikeaIndustryStats.totalTrucks + othersStats.totalTrucks))
                  : '-'}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm opacity-90 mb-1">
                {language === 'pl' ? 'Średnio TIRów/miesiąc' : 'Avg. trucks/month'}
              </p>
              <p className="text-3xl font-bold">
                {Math.round((ikeaSupplyStats.totalTrucks + ikeaIndustryStats.totalTrucks + othersStats.totalTrucks) / 12)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReceiverCardWithMonth
        title="IKEA SUPPLY"
        stats={ikeaSupplyStats}
        requirements={ikeaSupplyReq}
        color="blue"
      />

      <ReceiverCardWithMonth
        title="IKEA INDUSTRY"
        stats={ikeaIndustryStats}
        requirements={ikeaIndustryReq}
        color="purple"
      />

      <ReceiverCardWithMonth
        title={language === 'pl' ? 'POZOSTALI' : 'OTHER CLIENTS'}
        stats={othersStats}
        requirements={othersReq}
        color="green"
      />
    </div>
  );
}