import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, User, Phone, Calendar, Users, Save, Star, Home, History, MessageCircle, FlaskConical } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileData {
  display_name: string | null;
  phone: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    phone: "",
    age: null,
    gender: "",
    email: ""
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          phone: data.phone || "",
          age: data.age || null,
          gender: data.gender || "",
          email: data.email || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name || null,
          phone: profile.phone || null,
          age: profile.age || null,
          gender: profile.gender || null
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Failed to save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: History, label: "History", path: "/history" },
    { icon: MessageCircle, label: "Contact Us", path: "/contact" },
    { icon: FlaskConical, label: "Tester", path: "/sandbox" },
    { icon: Star, label: "Favorites", path: "/favorites" },
  ];

  return (
    <div className="min-h-screen pb-8">
      <Header title="My Profile" subtitle="Manage your account settings">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="px-4 -mt-4 space-y-4">
        {/* Profile Form */}
        <div className="glass-card p-5 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{profile.display_name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{profile.email || user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  placeholder="Your name"
                  className="pl-10"
                  value={profile.display_name || ""}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="+91 9876543210"
                  className="pl-10"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="age">Age</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    className="pl-10"
                    value={profile.age || ""}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={profile.gender || ""} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                  <SelectTrigger className="h-10">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="glass-card p-4 animate-slide-up delay-100">
          <h3 className="font-semibold text-foreground mb-3">Quick Navigation</h3>
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/auth");
          }}
        >
          Sign Out
        </Button>
      </main>
    </div>
  );
}
