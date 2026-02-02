import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoading: boolean;
  minimumLoadTime?: number;
}

export const LoadingScreen = ({ isLoading, minimumLoadTime = 800 }: LoadingScreenProps) => {
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Start fade out animation
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, minimumLoadTime);

      // Remove loader after fade animation
      const removeTimer = setTimeout(() => {
        setShowLoader(false);
      }, minimumLoadTime + 500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isLoading, minimumLoadTime]);

  if (!showLoader) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Floating decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-[10%] left-[15%] text-3xl animate-float opacity-60">💖</span>
        <span className="absolute top-[20%] right-[20%] text-2xl animate-float animation-delay-1000 opacity-60">✨</span>
        <span className="absolute bottom-[30%] left-[10%] text-2xl animate-float animation-delay-2000 opacity-60">🌸</span>
        <span className="absolute bottom-[20%] right-[15%] text-3xl animate-float animation-delay-3000 opacity-60">🎀</span>
        <span className="absolute top-[40%] left-[5%] text-xl animate-float animation-delay-4000 opacity-60">💕</span>
        <span className="absolute top-[15%] left-[50%] text-2xl animate-float animation-delay-2000 opacity-60">🦋</span>
        <span className="absolute bottom-[40%] right-[8%] text-xl animate-float animation-delay-1000 opacity-60">🌷</span>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo/Brand */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-400 flex items-center justify-center shadow-lg shadow-pink-300/50 animate-pulse">
            <span className="text-4xl">🎀</span>
          </div>
          {/* Sparkle ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-pink-300/50 animate-ping" />
        </div>

        {/* Brand name */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
          Pinkkaa
        </h1>

        {/* Loading indicator */}
        <div className="flex flex-col items-center gap-3">
          {/* Bouncing dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          {/* Loading text */}
          <p className="text-pink-600/80 text-sm font-medium">
            Loading cuteness...
          </p>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 flex gap-2">
        <span className="text-pink-300 text-xl">♡</span>
        <span className="text-rose-300 text-xl">♡</span>
        <span className="text-fuchsia-300 text-xl">♡</span>
      </div>
    </div>
  );
};
