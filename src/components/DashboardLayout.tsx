import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header mejorado para el trigger */}
          <header className="flex h-16 shrink-0 items-center gap-4 px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="group p-2 hover:bg-slate-100 rounded-lg transition-all duration-300 border border-transparent hover:border-slate-200/50 hover:shadow-sm">
                <Menu className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
              </SidebarTrigger>
              <Separator orientation="vertical" className="h-6 bg-slate-200/60" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600">Sistema activo</span>
              </div>
            </div>
          </header>
          
          {/* Main content con mejor spacing */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}