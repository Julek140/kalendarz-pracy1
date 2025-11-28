import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Pixelowy Włóczykij z Muminków - z zielonym kapeluszem i harmonijką
const PIXEL_SNUFKIN_SVG = (
  <svg width="48" height="48" viewBox="0 0 16 16" className="pixel-art">
    {/* Kapelusz - zielony z szerokim rondem */}
    <rect x="6" y="0" width="4" height="1" fill="#2D5016"/>
    <rect x="5" y="1" width="6" height="1" fill="#3D6B1E"/>
    <rect x="4" y="2" width="8" height="1" fill="#3D6B1E"/>
    <rect x="3" y="3" width="10" height="1" fill="#4A7C23"/>
    <rect x="2" y="4" width="12" height="1" fill="#2D5016"/>
    
    {/* Twarz */}
    <rect x="5" y="5" width="6" height="1" fill="#FFE4C4"/>
    <rect x="4" y="6" width="8" height="1" fill="#FFE4C4"/>
    <rect x="5" y="6" width="2" height="1" fill="#1E293B"/>
    <rect x="9" y="6" width="2" height="1" fill="#1E293B"/>
    <rect x="4" y="7" width="8" height="1" fill="#FFE4C4"/>
    <rect x="6" y="8" width="4" height="1" fill="#D4A574"/>
    
    {/* Płaszcz zielony */}
    <rect x="4" y="9" width="8" height="1" fill="#3D6B1E"/>
    <rect x="3" y="10" width="10" height="1" fill="#4A7C23"/>
    <rect x="3" y="11" width="10" height="1" fill="#3D6B1E"/>
    
    {/* Harmonijka w ręku */}
    <rect x="1" y="10" width="2" height="1" fill="#FFE4C4"/>
    <rect x="0" y="11" width="3" height="1" fill="#C0392B"/>
    <rect x="0" y="12" width="3" height="1" fill="#E74C3C"/>
    
    {/* Druga ręka */}
    <rect x="13" y="10" width="2" height="1" fill="#FFE4C4"/>
    
    {/* Nogi */}
    <rect x="4" y="12" width="3" height="1" fill="#8B4513"/>
    <rect x="9" y="12" width="3" height="1" fill="#8B4513"/>
    <rect x="4" y="13" width="2" height="1" fill="#654321"/>
    <rect x="10" y="13" width="2" height="1" fill="#654321"/>
  </svg>
);

export default function PixelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Cześć! 👋 Jestem Twoim asystentem. Jak mogę Ci pomóc w obsłudze kalendarza pracy?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
- Kalendarz: wyświetla dni pracy, można kliknąć na dzień aby dodać/edytować wpis pracy
- Można wybrać dział (Maszynownia, Pakownia lub oba), liczbę zmian (1-3), oznaczyć przestój
- Święta są automatycznie uwzględniane, można też dodać własne święta
- Raporty: generują statystyki za wybrany okres (wykorzystanie dni, zmian, nadgodziny)
- Weekend = nadgodziny
- Dni robocze Pn-Pt = 3 zmiany dostępne na dzień

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
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 animate-bounce hover:animate-none transition-all duration-300 hover:scale-110 group"
        >
          <div className="relative">
            <div className="bg-indigo-600 rounded-full p-3 shadow-lg group-hover:bg-indigo-700 transition-colors">
              {PIXEL_ASSISTANT_SVG}
            </div>
            <div className="absolute -top-12 right-0 bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Potrzebujesz pomocy? 💬
            </div>
          </div>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl border-2 border-indigo-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-1">
                {PIXEL_ASSISTANT_SVG}
              </div>
              <div>
                <h3 className="font-bold">Asystent</h3>
                <p className="text-xs text-indigo-200">Zawsze chętny pomóc!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white text-slate-700 shadow-sm border rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-700 shadow-sm border rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Zadaj pytanie..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}