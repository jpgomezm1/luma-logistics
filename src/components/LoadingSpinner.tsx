import { Package, Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 to-blue-600/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/5 to-indigo-300/5 rounded-full animate-ping delay-500"></div>
      </div>

      {/* Main loader container */}
      <div className="relative z-10 text-center">
        {/* Animated logo container */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-indigo-500 rounded-full animate-spin"></div>
          </div>
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 w-20 h-20 mx-auto">
            <div className="w-full h-full border-2 border-transparent border-b-blue-400 border-l-indigo-400 rounded-full animate-spin animate-reverse delay-150"></div>
          </div>

          {/* Inner spinning dots */}
          <div className="absolute inset-4 w-16 h-16 mx-auto">
            <div className="relative w-full h-full animate-spin delay-300">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 animate-pulse"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-x-1/2 animate-pulse delay-150"></div>
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2 animate-pulse delay-300"></div>
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-indigo-400 rounded-full transform -translate-y-1/2 animate-pulse delay-500"></div>
            </div>
          </div>

          {/* Central logo */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
              <Package className="w-8 h-8 text-white animate-bounce delay-700" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg animate-ping delay-1000"></div>
          </div>
        </div>

        {/* Loading text with typewriter effect */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-800 animate-fade-in-up">
            Luma
          </h2>
          
          {/* Animated loading text */}
          <div className="flex items-center justify-center gap-2 animate-fade-in-up delay-300">
            <span className="text-slate-600 font-medium">Cargando</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          {/* Progress-like indicator */}
          <div className="w-64 mx-auto mt-6 animate-fade-in-up delay-500">
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-loading-bar"></div>
            </div>
          </div>

          {/* Loading status */}
          <p className="text-sm text-slate-500 mt-4 animate-fade-in-up delay-700">
            Preparando tu experiencia...
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-reverse {
          animation: reverse 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;