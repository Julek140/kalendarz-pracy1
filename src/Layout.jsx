import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, FileBarChart, Factory, Languages, TrendingUp } from "lucide-react";
import FloatingAssistant from "@/components/FloatingAssistant";
import ProgressBars from "@/components/ProgressBars";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

function LayoutContent({ children }) {
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();
  
  const navigationItems = [
    {
      title: t('calendar', language),
      url: createPageUrl("Kalendarz"),
      icon: Calendar,
    },
    {
      title: t('reports', language),
      url: createPageUrl("Raporty"),
      icon: FileBarChart,
    },
    {
      title: t('financialReports', language),
      url: createPageUrl("RaportyFinansowe"),
      icon: Factory,
    },
    {
      title: t('annualReport', language),
      url: createPageUrl("RaportRoczny"),
      icon: FileBarChart,
    },
    {
      title: language === 'pl' ? 'Analizy' : 'Analytics',
      url: createPageUrl("Analizy"),
      icon: TrendingUp,
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://constract.pl/wp-content/uploads/2024/09/cropped-Constract_logo-2024-01-e1744010411889-2048x557.png" 
                alt="CONSTRACT Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 font-medium">{t('workCalendar', language)}</p>
              <div className="flex items-center gap-1">
                <Button
                  variant={language === 'pl' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => changeLanguage('pl')}
                >
                  PL
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => changeLanguage('en')}
                >
                  EN
                </Button>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-blue-100 text-blue-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-semibold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-0">
                    <ProgressBars />
                    <div className="text-center py-2 border-t border-slate-200">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-600 font-semibold text-[10px]">
                          ©
                        </span>
                        <span>2025 CONSTRACT</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Created by Julian Ostrowski
                      </p>
                    </div>
                  </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-slate-900">{t('workCalendar', language)} CONSTRACT</h1>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={language === 'pl' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => changeLanguage('pl')}
                >
                  PL
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => changeLanguage('en')}
                >
                  EN
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        <FloatingAssistant />
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}