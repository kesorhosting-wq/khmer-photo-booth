import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      display_name: displayName || null,
      phone: phone || null,
      address: address || null,
    });

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-gold/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-input/50 border-gold/20 text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-input border-gold/30 text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              className="bg-input border-gold/30 text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Address</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your delivery address"
              className="bg-input border-gold/30 text-foreground min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
