import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Heart, Settings, LogOut, LogIn, UserPlus, Package } from "lucide-react";
import { ProfileDialog } from "./ProfileDialog";
import { FavoritesDialog } from "./FavoritesDialog";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth?mode=login")}
          className="text-gold hover:text-gold-light hover:bg-gold/10 text-xs sm:text-sm px-2 sm:px-3"
        >
          <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">Login</span>
        </Button>
        <Button
          size="sm"
          onClick={() => navigate("/auth?mode=register")}
          className="bg-gold text-primary-foreground hover:bg-gold-dark text-xs sm:text-sm px-2 sm:px-3"
        >
          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">Register</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-gold hover:text-gold-light hover:bg-gold/10"
          >
            <User className="w-4 h-4 mr-2" />
            {profile?.display_name || user.email?.split("@")[0] || "Account"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card border-gold/30 z-50">
          <DropdownMenuItem
            onClick={() => navigate("/orders")}
            className="cursor-pointer"
          >
            <Package className="w-4 h-4 mr-2" />
            My Orders
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setFavoritesOpen(true)}
            className="cursor-pointer"
          >
            <Heart className="w-4 h-4 mr-2" />
            My Favorites
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProfileOpen(true)}
            className="cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <FavoritesDialog open={favoritesOpen} onOpenChange={setFavoritesOpen} />
    </>
  );
};
