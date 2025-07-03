import { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Store, LogOut, TrendingUp, Clock, CheckCircle, Package, User } from 'lucide-react';

interface HeaderProps {
  user: SupabaseUser | null;
  stats: {
    total: number;
    pendientes: number;
    despachados: number;
  };
  onLogout: () => void;
}

const Header = ({ user, stats, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border border-white shadow-sm animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Luma
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Dashboard de Pedidos
              </p>
            </div>
          </div>

          {/* Stats Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-6">
              {/* Total */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total</p>
                  <p className="text-lg font-bold text-slate-800">{stats.total}</p>
                </div>
              </div>

              {/* Pendientes */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-medium">Pendientes</p>
                  <p className="text-lg font-bold text-amber-700">{stats.pendientes}</p>
                </div>
              </div>

              {/* Despachados */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Despachados</p>
                  <p className="text-lg font-bold text-emerald-700">{stats.despachados}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User info y logout */}
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/40 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm"></div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-32">{user?.email}</p>
                <p className="text-xs text-slate-500 font-medium">Administrador</p>
              </div>
            </div>

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-red-200/50 text-red-600 hover:text-red-700 hover:bg-red-50/80 hover:border-red-300/50 transition-all duration-300 font-medium group shadow-sm hover:shadow-md"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50/80 group-hover:bg-red-100/80 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                <LogOut className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline text-sm">Cerrar sesión</span>
            </Button>
          </div>
        </div>

        {/* Stats móvil */}
        <div className="lg:hidden mt-4 pt-4 border-t border-slate-200/50">
          <div className="grid grid-cols-3 gap-3">
            {/* Total móvil */}
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/50 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">Total</p>
                <p className="text-lg font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>

            {/* Pendientes móvil */}
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs text-amber-600 font-medium">Pendientes</p>
                <p className="text-lg font-bold text-amber-700">{stats.pendientes}</p>
              </div>
            </div>

            {/* Despachados móvil */}
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs text-emerald-600 font-medium">Despachados</p>
                <p className="text-lg font-bold text-emerald-700">{stats.despachados}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;