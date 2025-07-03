import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Store, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  stats: {
    total: number;
    pendientes: number;
    despachados: number;
  };
  onLogout: () => void;
}

const Header = ({ user, stats, onLogout }: HeaderProps) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">
                Electrodomésticos Medellín
              </h1>
              <p className="text-sm text-muted-foreground">
                Dashboard de Pedidos
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">
                Total: <span className="text-primary">{stats.total}</span>
              </span>
              <span className="font-medium">
                Pendientes: <span className="text-warning">{stats.pendientes}</span>
              </span>
              <span className="font-medium">
                Despachados: <span className="text-success">{stats.despachados}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>

        {/* Stats móvil */}
        <div className="md:hidden mt-3 pt-3 border-t border-border">
          <div className="flex justify-center gap-6 text-sm">
            <span className="font-medium">
              Total: <span className="text-primary">{stats.total}</span>
            </span>
            <span className="font-medium">
              Pendientes: <span className="text-warning">{stats.pendientes}</span>
            </span>
            <span className="font-medium">
              Despachados: <span className="text-success">{stats.despachados}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;