import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Pixelowy Włóczykij z Muminków
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

export default function SidebarAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Cześć! 🎒 Jestem Pomocny Włóczykij. Chętnie pomogę Ci z kalendarzem pracy!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 600);
    }, 3500);
    return () => clearInterval(waveInterval);
  }, []);

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
    <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-full p-1.5 shadow-sm border border-amber-300">
            <PixelSnufkin isWaving={isWaving} size={28} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-700">Pomocny Włóczykij</p>
            <p className="text-xs text-slate-500">Asystent AI</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Expanded chat */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {/* Messages */}
          <div className="h-48 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
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
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Zadaj pytanie..."
                disabled={isLoading}
                className="flex-1 text-sm h-9"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 h-9 px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}