import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { t } from "@/components/translations";

export default function TrucksAnalysis({ reportData, goalsData, language }) {
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

  const calculateRequirements = (stats, goalKey) => {
    if (!goalsData || goalsData.length === 0 || stats.avgTruckValue === 0) {
      return { required: 0, status: 'no-data' };
    }

    const totalGoal = goalsData.reduce((sum, g) => sum + (g[goalKey] || 0), 0);
    const remainingGoal = totalGoal - stats.totalRevenue;
    
    if (!isCurrentYear || currentMonth >= 12) {
      return { 
        required: 0, 
        status: stats.totalRevenue >= totalGoal ? 'exceeded' : 'below',
        remainingGoal,
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
    };
  };

  const ikeaSupplyReq = calculateRequirements(ikeaSupplyStats, 'revenue_ikea_goal');
  const ikeaIndustryReq = calculateRequirements(ikeaIndustryStats, 'revenue_ikea_industry_goal');
  const othersReq = calculateRequirements(othersStats, 'revenue_others_goal');

  const ReceiverCard = ({ title, stats, requirements, color }) => (
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

        {requirements.status !== 'no-data' && isCurrentYear && currentMonth < 12 && (
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
                      {language === 'pl' ? 'Cel przekroczony! 🎉' : 'Goal exceeded! 🎉'}
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
                        <strong>{language === 'pl' ? 'Do celu:' : 'To goal:'}</strong> {formatCurrency(requirements.remainingGoal)}
                      </p>
                      {stats.avgTruckValue > 0 && (
                        <>
                          <p>
                            <strong>{language === 'pl' ? 'Łącznie ciężarówek:' : 'Total trucks:'}</strong> {requirements.required} TIRów
                          </p>
                          <p>
                            <strong>{language === 'pl' ? 'Miesięcznie:' : 'Monthly:'}</strong> ~{requirements.requiredMonthly} TIRów/miesiąc
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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
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

      <ReceiverCard
        title="IKEA SUPPLY"
        stats={ikeaSupplyStats}
        requirements={ikeaSupplyReq}
        color="blue"
      />

      <ReceiverCard
        title="IKEA INDUSTRY"
        stats={ikeaIndustryStats}
        requirements={ikeaIndustryReq}
        color="purple"
      />

      <ReceiverCard
        title={language === 'pl' ? 'POZOSTALI' : 'OTHER CLIENTS'}
        stats={othersStats}
        requirements={othersReq}
        color="green"
      />
    </div>
  );
}