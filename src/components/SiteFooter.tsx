import { Facebook } from "lucide-react";

interface FooterSettings {
  siteName: string;
  logo: string | null;
  footerText: string;
  footerBgColor: string;
  footerTextColor: string;
  footerDescription: string;
  footerFacebookUrl: string | null;
  footerTiktokUrl: string | null;
  footerTelegramUrl: string | null;
  footerFacebookIconUrl: string | null;
  footerTiktokIconUrl: string | null;
  footerTelegramIconUrl: string | null;
  footerPaymentText: string;
  footerPaymentIconUrl: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface SiteFooterProps {
  settings: FooterSettings;
  categories: Category[];
}

export const SiteFooter = ({ settings, categories }: SiteFooterProps) => {
  return (
    <footer style={{ backgroundColor: settings.footerBgColor }}>
      {/* Main Footer Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {/* Logo & Description Column */}
          <div className="col-span-2 md:col-span-1 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              {settings.logo && (
                <img 
                  src={settings.logo} 
                  alt="Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
                />
              )}
              <span className="text-base sm:text-lg font-semibold" style={{ color: settings.footerTextColor }}>{settings.siteName}</span>
            </div>
            <p className="text-xs sm:text-sm" style={{ color: settings.footerTextColor, opacity: 0.8 }}>
              {settings.footerDescription}
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: settings.footerTextColor }}>Products</h3>
            <ul className="space-y-1 sm:space-y-2">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <span 
                    className="text-xs sm:text-sm cursor-pointer transition-colors hover:opacity-70"
                    style={{ color: settings.footerTextColor, opacity: 0.8 }}
                  >
                    {category.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: settings.footerTextColor }}>Company</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <span 
                  className="text-xs sm:text-sm cursor-pointer transition-colors hover:opacity-70"
                  style={{ color: settings.footerTextColor, opacity: 0.8 }}
                >
                  About Us
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: settings.footerTextColor }}>Follow Us</h3>
            <div className="flex gap-2 sm:gap-3">
              {settings.footerTelegramUrl && (
                <a 
                  href={settings.footerTelegramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
                  style={{ backgroundColor: settings.footerTelegramIconUrl ? 'transparent' : '#0088cc' }}
                >
                  {settings.footerTelegramIconUrl ? (
                    <img src={settings.footerTelegramIconUrl} alt="Telegram" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2s-.18-.03-.26-.02c-.11.02-1.86 1.18-5.26 3.47-.5.34-.95.51-1.36.5-.45-.01-1.31-.25-1.95-.46-.78-.26-1.4-.4-1.35-.84.03-.23.36-.46.99-.69 3.88-1.69 6.47-2.8 7.77-3.34 3.7-1.54 4.47-1.81 4.97-1.82.11 0 .36.02.52.14.13.1.17.24.18.36-.01.06-.01.14-.02.22z"/>
                    </svg>
                  )}
                </a>
              )}
              {settings.footerTiktokUrl && (
                <a 
                  href={settings.footerTiktokUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
                  style={{ backgroundColor: settings.footerTiktokIconUrl ? 'transparent' : 'black' }}
                >
                  {settings.footerTiktokIconUrl ? (
                    <img src={settings.footerTiktokIconUrl} alt="TikTok" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  )}
                </a>
              )}
              {settings.footerFacebookUrl && (
                <a 
                  href={settings.footerFacebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
                  style={{ backgroundColor: settings.footerFacebookIconUrl ? 'transparent' : '#1877f2' }}
                >
                  {settings.footerFacebookIconUrl ? (
                    <img src={settings.footerFacebookIconUrl} alt="Facebook" className="w-full h-full object-cover" />
                  ) : (
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTopColor: settings.footerTextColor, borderTopWidth: '1px' }}>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div 
            className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-center"
            style={{ color: settings.footerTextColor }}
          >
            <span>{settings.footerText}</span>
            {settings.footerPaymentText && (
              <span className="flex items-center gap-2">
                {settings.footerPaymentText}
                {settings.footerPaymentIconUrl && (
                  <img 
                    src={settings.footerPaymentIconUrl} 
                    alt="Payment" 
                    className="h-5 sm:h-6 object-contain"
                  />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};