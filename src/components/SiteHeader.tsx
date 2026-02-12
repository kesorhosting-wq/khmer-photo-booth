import { useState } from "react";
import { Menu } from "lucide-react";
import { FestivalThemeSwitcher, FestivalTheme, ColorMode } from "./FestivalThemeSwitcher";
import { UserMenu } from "./UserMenu";
import { CartButton } from "./CartButton";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface SiteHeaderProps {
  siteName: string;
  logo: string | null;
  logoWidth?: number;
  logoHeight?: number;
  logoPositionTop?: number | null;
  logoPositionBottom?: number | null;
  logoPositionLeft?: number | null;
  logoPositionRight?: number | null;
  headerBg: string;
  siteNameColor?: string;
  siteNameFont?: string;
  siteNameFontSize?: number;
  onSettingsChange: (settings: { siteName?: string; logo?: string | null; headerBg?: string }) => void;
  festivalTheme?: FestivalTheme;
  onFestivalThemeChange?: (theme: FestivalTheme) => void;
  colorMode?: ColorMode;
  onColorModeChange?: (mode: ColorMode) => void;
}

export const SiteHeader = ({ siteName, logo, logoWidth = 80, logoHeight = 80, logoPositionTop = 0, logoPositionBottom = null, logoPositionLeft = null, logoPositionRight = null, headerBg, siteNameColor = "#d4af37", siteNameFont = "Cinzel", siteNameFontSize = 48, festivalTheme = 'none', onFestivalThemeChange, colorMode = 'dark', onColorModeChange }: SiteHeaderProps) => {

  return (
    <header 
      className="relative py-4 sm:py-6 px-2 sm:px-4 overflow-hidden header-pattern z-40"
      style={{
        background: headerBg.startsWith('data:') || headerBg.startsWith('http') 
          ? `url(${headerBg}) center/cover` 
          : 'var(--gradient-header)'
      }}
    >

      {/* Main Header Content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center h-[100px] sm:h-[120px] pt-8 sm:pt-0"
        style={{
          paddingTop: logoPositionTop !== null ? logoPositionTop : undefined,
          paddingBottom: logoPositionBottom !== null ? logoPositionBottom : undefined,
          paddingLeft: logoPositionLeft !== null ? logoPositionLeft : undefined,
          paddingRight: logoPositionRight !== null ? logoPositionRight : undefined,
        }}
      >
        {logo && (
          <img 
            src={logo} 
            alt="Logo" 
            style={{ width: Math.min(logoWidth, window.innerWidth * 0.6), height: 'auto', maxWidth: '60vw' }}
            className="object-contain mb-2 sm:mb-3 ornament-glow"
          />
        )}
        <h1 
          className="font-bold tracking-wider text-center drop-shadow-lg px-2"
          style={{ 
            color: siteNameColor, 
            fontFamily: siteNameFont, 
            fontSize: `clamp(1.25rem, ${siteNameFontSize * 0.5}px, ${siteNameFontSize}px)` 
          }}
        >
          {siteName}
        </h1>
      </div>

      {/* Desktop: Cart, User Menu & Festival Theme Switcher */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 hidden sm:flex items-center gap-2">
        <CartButton />
        <UserMenu />
        {onFestivalThemeChange && onColorModeChange && (
          <FestivalThemeSwitcher 
            currentTheme={festivalTheme} 
            onThemeChange={onFestivalThemeChange}
            colorMode={colorMode}
            onColorModeChange={onColorModeChange}
          />
        )}
      </div>

      {/* Mobile: Hamburger menu */}
      <div className="absolute top-2 right-2 z-50 flex sm:hidden items-center gap-1">
        <UserMenu />
        <MobileMenu 
          festivalTheme={festivalTheme}
          onFestivalThemeChange={onFestivalThemeChange}
          colorMode={colorMode}
          onColorModeChange={onColorModeChange}
        />
      </div>

    </header>
  );
};

const MobileMenu = ({ festivalTheme, onFestivalThemeChange, colorMode, onColorModeChange }: {
  festivalTheme: FestivalTheme;
  onFestivalThemeChange?: (theme: FestivalTheme) => void;
  colorMode: ColorMode;
  onColorModeChange?: (mode: ColorMode) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gold hover:text-gold-light hover:bg-gold/10 h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[260px] bg-card border-gold/30">
        <SheetHeader>
          <SheetTitle className="text-gold">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex items-center gap-2">
            <CartButton />
            <span className="text-sm text-foreground">Cart</span>
          </div>
          {onFestivalThemeChange && onColorModeChange && (
            <div className="flex items-center gap-2">
              <FestivalThemeSwitcher 
                currentTheme={festivalTheme} 
                onThemeChange={onFestivalThemeChange}
                colorMode={colorMode}
                onColorModeChange={onColorModeChange}
              />
              <span className="text-sm text-foreground">Theme</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
