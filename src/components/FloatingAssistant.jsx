import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";

const PixelSnufkin = ({ isWaving, size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className="pixel-art">
    <rect x="6" y="0" width="4" height="1" fill="#2D5016"/>
    <rect x="5" y="1" width="6" height="1" fill="#3D6B1E"/>
    <rect x="4" y="2" width="8" height="1" fill="#3D6B1E"/>
    <rect x="3" y="3" width="10" height="1" fill="#4A7C23"/>
    <rect x="2" y="4" width="12" height="1" fill="#2D5016"/>
    <rect x="5" y="5" width="6" height="1" fill="#FFE4C4"/>
    <rect x="4" y="6" width="8" height="1" fill="#FFE4C4"/>
    <rect x="5" y="6" width="2" height="1" fill="#1E293B"/>
    <rect x="9" y="6" width="2" height="1" fill="#1E293B"/>
    <rect x="4" y="7" width="8" height="1" fill="#FFE4C4"/>
    <rect x="6" y="8" width="4" height="1" fill="#D4A574"/>
    <rect x="4" y="9" width="8" height="1" fill="#3D6B1E"/>
    <rect x="3" y="10" width="10" height="1" fill="#4A7C23"/>
    <rect x="3" y="11" width="10" height="1" fill="#3D6B1E"/>
    {isWaving ? (
      <>
        <rect x="1" y="8" width="2" height="1" fill="#FFE4C4"/>
        <rect x="0" y="7" width="2" height="1" fill="#FFE4C4"/>
        <rect x="-1" y="6" width="3" height="1" fill="#C0392B"/>
        <rect x="-1" y="5" width="3" height="1" fill="#E74C3C"/>
        <rect x="13" y="8" width="2" height="1" fill="#FFE4C4"/>
        <rect x="14" y="7" width="2" height="1" fill="#FFE4C4"/>
        <rect x="15" y="6" width="1" height="1" fill="#FFE4C4"/>
      </>
    ) : (
      <>
        <rect x="1" y="10" width="2" height="1" fill="#FFE4C4"/>
        <rect x="0" y="11" width="3" height="1" fill="#C0392B"/>
        <rect x="0" y="12" width="3" height="1" fill="#E74C3C"/>
        <rect x="13" y="10" width="2" height="1" fill="#FFE4C4"/>
      </>
    )}
    <rect x="4" y="12" width="3" height="1" fill="#8B4513"/>
    <rect x="9" y="12" width="3" height="1" fill="#8B4513"/>
    <rect x="4" y="13" width="2" height="1" fill="#654321"/>
    <rect x="10" y="13" width="2" height="1" fill="#654321"/>
  </svg>
);

const SNUFKIN_QUOTES = [
  "Nie warto martwić się na zapas.",
  "Wolność jest najważniejsza.",
  "Najlepiej iść własną drogą.",
  "Cisza też potrafi być przyjacielem.",
  "Świat jest pełen rzeczy, które czekają, by je zobaczyć.",
  "Najlepiej jest wędrować bez pośpiechu.",
  "Samotność jest czasem potrzebna.",
  "Zawsze znajdzie się ścieżka, jeśli się ją chce znaleźć.",
  "Każda przygoda zaczyna się od ciekawości.",
  "Nie bój się odejść, jeśli wiesz, że musisz iść dalej.",
  "Wolność to nie mieć nic, co cię zatrzymuje.",
  "Warto czekać na właściwy moment.",
  "Świat jest piękny, kiedy umiesz patrzeć.",
  "Nie wszystko trzeba brać ze sobą w drogę.",
  "Najbardziej lubię poranki nad rzeką."
];

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Cześć! 🎒 Jestem Pomocny Włóczykij. Chętnie pomogę Ci z kalendarzem pracy!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 600);
    }, 3500);
    return () => clearInterval(waveInterval);
  }, []);

  useEffect(() => {
    if (isOpen) return;
    
    const showRandomQuote = () => {
      const randomQuote = SNUFKIN_QUOTES[Math.floor(Math.random() * SNUFKIN_QUOTES.length)];
      setCurrentQuote(randomQuote);
      setShowQuote(true);
      setTimeout(() => setShowQuote(false), 6000);
    };

    const initialTimeout = setTimeout(showRandomQuote, 3000);
    const quoteInterval = setInterval(showRandomQuote, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(quoteInterval);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Jesteś pomocnym asystentem aplikacji "Kalendarz Pracy CONSTRACT". 
Aplikacja służy do zarządzania kalendarzem pracy zakładu produkcyjnego z dwoma działami: Maszynownia i Pakownia.

Główne funkcje aplikacji:
- Kalendarz: wyświetla dni pracy, można kliknąć na dzień aby dodać/edytować wpis pracy (dział, liczba zmian, obrót finansowy, przestój, uwagi)
- Można wybrać dział (Maszynownia, Pakownia lub oba), liczbę zmian (1-3), oznaczyć przestój
- Święta są automatycznie uwzględniane, można też dodać własne święta
- Raporty: generują statystyki za wybrany okres (wykorzystanie dni, zmian, nadgodziny, bilans)
- Raporty Finansowe: pokazują obroty, średnie tygodniowe/miesięczne, wydajność na dzień/zmianę, analizę celów
- Paski postępu w sidebar: pokazują postęp dnia w roku oraz realizację celu finansowego rocznego
- Weekend (soboty i niedziele) = nadgodziny
- Dni robocze Pn-Pt = 3 zmiany dostępne na dzień (15 zmian tygodniowo)
- Dostępne zmiany w raportach = tylko Pn-Pt × 3 (bez sobót/niedziel)

Odpowiadaj krótko, konkretnie i po polsku. Pomagaj użytkownikowi zrozumieć jak korzystać z aplikacji.

Pytanie użytkownika: ${userMessage}`,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showQuote && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-3 max-w-[200px]"
          >
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 relative">
              <p className="text-xs text-slate-600 italic">„{currentQuote}"</p>
              <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
            </div>
          </motion.div>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-full p-3 shadow-xl border-2 border-amber-300 hover:scale-110 transition-transform duration-200"
        >
          <PixelSnufkin isWaving={isWaving} size={40} />
        </button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-full p-1.5 shadow-sm">
                  <PixelSnufkin isWaving={false} size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Pomocny Włóczykij</p>
                  <p className="text-xs text-white/90">Asystent AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white text-slate-700 shadow-sm border rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-700 shadow-sm border rounded-xl rounded-bl-sm px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Zadaj pytanie..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}