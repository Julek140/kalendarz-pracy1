import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function AIInsightsPanel({ data, type = "calendar" }) {
  const { language } = useLanguage();
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      let prompt = "";
      
      if (type === "calendar") {
        prompt = `Jesteś ekspertem od analizy produkcji i harmonogramowania. Przeanalizuj dane dotyczące dni pracy w zakładzie produkcyjnym:

${JSON.stringify(data, null, 2)}

Podaj zwięzłą analizę zawierającą:
1. Kluczowe wzorce i trendy w wykorzystaniu zasobów
2. Identyfikacja potencjalnych przestojów lub nieefektywności
3. Rekomendacje dotyczące optymalizacji harmonogramu
4. Prognozy na nadchodzące okresy

Odpowiedź w ${language === 'pl' ? 'języku polskim' : 'English language'}.`;
      } else if (type === "report") {
        prompt = `Jesteś analitykiem finansowym. Przeanalizuj raport finansowy zakładu produkcyjnego:

${JSON.stringify(data, null, 2)}

Podaj zwięzłą analizę zawierającą:
1. Kluczowe wskaźniki wydajności (KPI)
2. Trendy przychodów i ich przyczyny
3. Porównanie z celami finansowymi
4. Konkretne rekomendacje biznesowe
5. Obszary ryzyka i możliwości

Odpowiedź w ${language === 'pl' ? 'języku polskim' : 'English language'}.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
      });

      setInsights(response);
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights(language === 'pl' 
        ? "Wystąpił błąd podczas generowania analizy. Spróbuj ponownie." 
        : "An error occurred while generating insights. Please try again.");
    }
    setIsLoading(false);
  };

  const parseInsights = (text) => {
    if (!text) return null;
    
    const sections = text.split(/\d+\.\s+/).filter(s => s.trim());
    const icons = [TrendingUp, AlertCircle, Lightbulb, Sparkles, TrendingUp];
    
    return sections.map((section, idx) => {
      const Icon = icons[idx % icons.length];
      return { text: section.trim(), Icon };
    });
  };

  const parsedInsights = parseInsights(insights);

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'pl' ? 'Analiza AI' : 'AI Insights'}
            </h3>
            <p className="text-sm text-slate-600">
              {language === 'pl' 
                ? 'Inteligentne rekomendacje i prognozy' 
                : 'Intelligent recommendations and forecasts'}
            </p>
          </div>
        </div>
        
        {!insights && (
          <Button
            onClick={generateInsights}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'pl' ? 'Analizuję...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {language === 'pl' ? 'Generuj analizę' : 'Generate insights'}
              </>
            )}
          </Button>
        )}
      </div>

      {insights && (
        <div className="space-y-4">
          {parsedInsights?.map((insight, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <insight.Icon className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          ))}
          
          <Button
            onClick={generateInsights}
            variant="outline"
            disabled={isLoading}
            className="w-full mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'pl' ? 'Odświeżam...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {language === 'pl' ? 'Odśwież analizę' : 'Refresh insights'}
              </>
            )}
          </Button>
        </div>
      )}

      {!insights && !isLoading && (
        <div className="text-center py-8 text-slate-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {language === 'pl' 
              ? 'Kliknij przycisk, aby wygenerować inteligentną analizę danych' 
              : 'Click the button to generate intelligent data analysis'}
          </p>
        </div>
      )}
    </Card>
  );
}