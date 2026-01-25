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
import { User, Heart, Settings, LogOut, LogIn, Shield } from "lucide-react";
import { ProfileDialog } from "./ProfileDialog";
import { FavoritesDialog } from "./FavoritesDialog";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/auth")}
        className="text-gold hover:text-gold-light hover:bg-gold/10"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
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
        <DropdownMenuContent align="end" className="w-48 bg-card border-gold/30">
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
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </DropdownMenuItem>
            </>
          )}
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
