import { useState, useEffect } from "react";
import { Settings, Snowflake, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FestivalTheme = 'none' | 'christmas';
export type ColorMode = 'dark' | 'light';

interface FestivalThemeSwitcherProps {
  currentTheme: FestivalTheme;
  onThemeChange: (theme: FestivalTheme) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

export const FestivalThemeSwitcher = ({ 
  currentTheme, 
  onThemeChange,
  colorMode,
  onColorModeChange
}: FestivalThemeSwitcherProps) => {
  const [open, setOpen] = useState(false);

  const handleThemeSelect = (theme: FestivalTheme) => {
    onThemeChange(theme);
    setOpen(false);
  };

  const handleColorModeToggle = () => {
    onColorModeChange(colorMode === 'dark' ? 'light' : 'dark');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-cream/80 hover:text-cream hover:bg-gold/20"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 border-[#FCBBEA] z-[100]" style={{ backgroundColor: '#F863D0' }} align="end">
        <div className="flex flex-col gap-2">
          <p className="text-xs px-2 pb-1 border-b border-[#FCBBEA]/50 font-semibold" style={{ color: '#F527BE', textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}>Theme Settings</p>
          <Button
            variant={currentTheme === 'christmas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleThemeSelect(currentTheme === 'christmas' ? 'none' : 'christmas')}
            className={`justify-start gap-2 ${currentTheme === 'christmas' ? 'text-white hover:opacity-90' : 'text-white hover:bg-[#FCBBEA]/30'}`}
            style={currentTheme === 'christmas' ? { backgroundColor: '#FCBBEA' } : undefined}
          >
            <Snowflake className="w-4 h-4" />
            Christmas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleColorModeToggle}
            className="justify-start gap-2 text-white hover:bg-[#FCBBEA]/30"
          >
            {colorMode === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                Dark Mode
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// String lights component for Christmas
export const ChristmasLights = () => {
  const lights = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: ['#ff0000', '#00ff00', '#ffff00', '#0066ff', '#ff00ff', '#00ffff'][i % 6],
    delay: i * 0.15,
  }));

  return (
    <div className="fixed top-0 left-0 right-0 h-8 pointer-events-none z-35 flex justify-between px-2">
      {lights.map((light) => (
        <div key={light.id} className="relative">
          {/* Wire */}
          <div className="absolute top-0 left-1/2 w-px h-4 bg-green-800" />
          {/* Bulb */}
          <div
            className="w-3 h-4 rounded-b-full mt-4 animate-christmas-light"
            style={{
              backgroundColor: light.color,
              boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}`,
              animationDelay: `${light.delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Snowflake border effect
export const SnowflakeBorder = () => {
  const cornerSnowflakes = [
    { position: 'top-2 left-2', size: 'text-2xl' },
    { position: 'top-2 right-2', size: 'text-2xl' },
    { position: 'bottom-2 left-2', size: 'text-2xl' },
    { position: 'bottom-2 right-2', size: 'text-2xl' },
    { position: 'top-2 left-1/4', size: 'text-lg' },
    { position: 'top-2 right-1/4', size: 'text-lg' },
    { position: 'bottom-2 left-1/4', size: 'text-lg' },
    { position: 'bottom-2 right-1/4', size: 'text-lg' },
    { position: 'top-1/4 left-2', size: 'text-lg' },
    { position: 'top-1/4 right-2', size: 'text-lg' },
    { position: 'bottom-1/4 left-2', size: 'text-lg' },
    { position: 'bottom-1/4 right-2', size: 'text-lg' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {cornerSnowflakes.map((sf, i) => (
        <div
          key={i}
          className={`absolute ${sf.position} ${sf.size} text-white/60 animate-sparkle`}
          style={{ animationDelay: `${i * 0.3}s` }}
        >
          ❄
        </div>
      ))}
      {/* Frost border effect */}
      <div className="absolute inset-0 border-4 border-white/10 rounded-lg m-1" 
        style={{ 
          boxShadow: 'inset 0 0 30px rgba(255,255,255,0.1), inset 0 0 60px rgba(200,230,255,0.05)' 
        }} 
      />
    </div>
  );
};

// Snow effect component for Christmas theme
export const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 4 + Math.random() * 8,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <ChristmasLights />
      <SnowflakeBorder />
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-snowfall text-white opacity-80"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              fontSize: `${flake.size}px`,
            }}
          >
            ❄
          </div>
        ))}
        {/* Snow accumulation at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/40 to-transparent" />
        {/* Snow piles */}
        <div className="absolute bottom-0 left-[10%] w-20 h-6 bg-white/30 rounded-t-full" />
        <div className="absolute bottom-0 left-[30%] w-16 h-4 bg-white/25 rounded-t-full" />
        <div className="absolute bottom-0 right-[20%] w-24 h-5 bg-white/35 rounded-t-full" />
        <div className="absolute bottom-0 right-[40%] w-14 h-4 bg-white/20 rounded-t-full" />
      </div>
    </>
  );
};


// Fireworks component for Bon Om Touk
export const Fireworks = () => {
  const [fireworks, setFireworks] = useState<Array<{ id: number; left: number; top: number; color: string; delay: number }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6', '#F97316'];
    const fw = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 40,
      color: colors[i % colors.length],
      delay: Math.random() * 4,
    }));
    setFireworks(fw);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-25 overflow-hidden">
      {fireworks.map((fw) => (
        <div
          key={fw.id}
          className="absolute animate-firework"
          style={{
            left: `${fw.left}%`,
            top: `${fw.top}%`,
            animationDelay: `${fw.delay}s`,
          }}
        >
          {/* Firework burst */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-firework-particle"
              style={{
                backgroundColor: fw.color,
                boxShadow: `0 0 6px ${fw.color}, 0 0 12px ${fw.color}`,
                transform: `rotate(${i * 30}deg) translateY(-20px)`,
                animationDelay: `${fw.delay}s`,
              }}
            />
          ))}
          {/* Center glow */}
          <div
            className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 animate-firework-center"
            style={{
              backgroundColor: fw.color,
              boxShadow: `0 0 20px ${fw.color}, 0 0 40px ${fw.color}`,
              animationDelay: `${fw.delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Traditional Dragon Boat decoration
export const DragonBoats = () => {
  const [boats, setBoats] = useState<Array<{ id: number; delay: number; duration: number; yOffset: number }>>([]);

  useEffect(() => {
    const boatsList = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      delay: i * 2,
      duration: 10 + Math.random() * 5,
      yOffset: i * 15,
    }));
    setBoats(boatsList);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-25 overflow-hidden">
      {boats.map((boat) => (
        <div
          key={boat.id}
          className="absolute animate-dragon-boat"
          style={{
            bottom: `${20 + boat.yOffset}px`,
            animationDelay: `${boat.delay}s`,
            animationDuration: `${boat.duration}s`,
          }}
        >
          {/* Dragon boat with rowers */}
          <div className="flex items-end">
            {/* Dragon head */}
            <span className="text-3xl">🐉</span>
            {/* Boat body with rowers */}
            <div className="flex items-center bg-gradient-to-r from-red-800 via-red-600 to-red-800 rounded-b-lg px-2 py-1 -ml-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="text-lg animate-rowing" style={{ animationDelay: `${i * 0.2}s` }}>🚣</span>
              ))}
            </div>
            {/* Dragon tail */}
            <span className="text-2xl -ml-1">🎏</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Bon Om Touk effect component (Water Festival)
export const BonOmToukEffect = () => {
  const [lanterns, setLanterns] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  useEffect(() => {
    const lanternsList = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 4,
    }));
    setLanterns(lanternsList);
  }, []);

  return (
    <>
      <Fireworks />
      <DragonBoats />
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        {/* Floating lanterns */}
        {lanterns.map((lantern) => (
          <div
            key={lantern.id}
            className="absolute animate-lantern-float"
            style={{
              left: `${lantern.left}%`,
              bottom: '25%',
              animationDelay: `${lantern.delay}s`,
              fontSize: '24px',
            }}
          >
            🏮
          </div>
        ))}
        {/* Moon */}
        <div className="absolute top-8 right-12 text-6xl animate-pulse opacity-80">🌕</div>
        {/* Stars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${8 + Math.random() * 8}px`,
            }}
          >
            ✦
          </div>
        ))}
        {/* Water effect */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-600/30 via-blue-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-400/20 to-transparent animate-water-shimmer" />
      </div>
    </>
  );
};
