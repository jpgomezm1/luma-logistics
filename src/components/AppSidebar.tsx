import { Package, Truck, Home, User, LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Ordenes",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Logística", 
    url: "/logistics",
    icon: Truck,
  },
  {
    title: "Rutas",
    url: "/logistics/routes",
    icon: Package,
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/30 bg-white/95 backdrop-blur-xl">
      <SidebarHeader className={cn(
        "border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/80 backdrop-blur-sm",
        isCollapsed ? "p-3" : "p-6"
      )}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="relative group">
            <div className={cn(
              "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105",
              isCollapsed ? "w-9 h-9" : "w-11 h-11"
            )}>
              <Package className={cn("text-white", isCollapsed ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white shadow-sm animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-900 text-lg tracking-tight leading-tight">Luma</h1>
              <p className="text-slate-500 text-xs font-medium tracking-wide">Control Logistico</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("overflow-hidden", isCollapsed ? "px-2 py-3" : "px-4 py-4")}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url === "/logistics" && location.pathname === "/logistics") ||
                  (item.url === "/logistics/routes" && location.pathname === "/logistics/routes");
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={isCollapsed ? item.title : undefined}
                      className={cn(
                        "w-full text-left transition-all duration-300 group relative overflow-hidden border",
                        isCollapsed 
                          ? "rounded-lg p-2.5 flex justify-center" 
                          : "rounded-lg px-3 py-3",
                        isActive 
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border-blue-200/50 hover:shadow-md" 
                          : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 border-transparent hover:border-slate-200/50 hover:shadow-sm"
                      )}
                    >
                      <NavLink to={item.url} className={cn(
                        "flex items-center w-full relative z-10",
                        isCollapsed ? "justify-center" : "gap-3"
                      )}>
                        <div className={cn(
                          "rounded-lg flex items-center justify-center transition-all duration-300",
                          isCollapsed ? "w-7 h-7" : "w-8 h-8",
                          isActive 
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md scale-105" 
                            : "bg-slate-100/80 group-hover:bg-slate-200/80 group-hover:scale-105"
                        )}>
                          <item.icon className={cn(
                            "transition-all duration-300",
                            isCollapsed ? "w-3.5 h-3.5" : "w-4 h-4",
                            isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                          )} />
                        </div>
                        {!isCollapsed && (
                          <span className={cn(
                            "text-sm font-medium transition-colors duration-300",
                            isActive ? "text-blue-700" : "text-slate-600 group-hover:text-slate-800"
                          )}>
                            {item.title}
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn(
        "mt-auto border-t border-slate-100/80 bg-gradient-to-r from-slate-50/30 to-white/50 backdrop-blur-sm",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm mb-3 shadow-sm border border-slate-200/40 hover:shadow-md transition-all duration-300">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">Usuario Activo</div>
              <div className="text-xs text-slate-500 font-medium">Administrador</div>
            </div>
          </div>
        )}

        {/* Developed by Irrelevant */}
        {!isCollapsed && (
          <div className="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm border border-slate-700/50 hover:shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-300 group">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Developed by</span>
              <div className="flex items-center gap-1.5 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="https://storage.googleapis.com/cluvi/nuevo_irre-removebg-preview.png" 
                  alt="Irrelevant Logo" 
                  className="w-16 h-auto object-contain group-hover:brightness-110 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsed version */}
        {isCollapsed && (
          <div className="mb-2 p-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm border border-slate-700/50 hover:shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-300 group flex justify-center">
            <img 
              src="https://storage.googleapis.com/cluvi/nuevo_irre-removebg-preview.png" 
              alt="Irrelevant Logo" 
              className="w-8 h-auto object-contain group-hover:scale-110 group-hover:brightness-110 transition-all duration-300"
            />
          </div>
        )}
        
        <SidebarMenuButton 
          onClick={handleLogout}
          tooltip={isCollapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "w-full text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all duration-300 font-medium group border border-transparent hover:border-red-200/60 hover:shadow-sm",
            isCollapsed 
              ? "rounded-lg p-2.5 flex justify-center" 
              : "rounded-lg px-3 py-3"
          )}
        >
          <div className={cn(
            "rounded-lg bg-red-50/80 group-hover:bg-red-100/80 flex items-center justify-center transition-all duration-300 group-hover:scale-105",
            isCollapsed ? "w-7 h-7" : "w-8 h-8"
          )}>
            <LogOut className={cn(isCollapsed ? "w-3.5 h-3.5" : "w-4 h-4")} />
          </div>
          {!isCollapsed && <span className="text-sm ml-3">Cerrar Sesión</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}