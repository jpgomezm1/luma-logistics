import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si ya está autenticado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.user) {
          navigate('/dashboard');
        }
      }
    );

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Store className="h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold text-primary">
            Electrodomésticos Medellín
          </h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-8">
          Sistema de gestión de pedidos
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
            size="lg"
          >
            Acceder al Dashboard
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Inicia sesión para gestionar los pedidos de la empresa
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
