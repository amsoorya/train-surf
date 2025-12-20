import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft, User, Phone, Calendar, Users, Save, Star, Home, History, MessageCircle, FlaskConical, Train, AlertCircle, HelpCircle, PhoneCall, Mail, Lightbulb, Send } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileData {
  display_name: string | null;
  phone: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
}

const RAILWAY_CONTACTS = [
  { name: "IRCTC Customer Care", phone: "14646", email: "care@irctc.co.in", type: "enquiry" },
  { name: "Railway Enquiry", phone: "139", email: null, type: "enquiry" },
  { name: "Complaints (CPGRAMS)", phone: "1800-111-321", email: "railmadad@rb.railnet.gov.in", type: "complaint" },
  { name: "RailMadad Helpline", phone: "139", email: "railmadad@rb.railnet.gov.in", type: "complaint" },
  { name: "Security Helpline (RPF)", phone: "182", email: null, type: "security" },
  { name: "Vigilance Complaints", phone: "1800-111-322", email: "cvo@rb.railnet.gov.in", type: "complaint" },
];

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    phone: "",
    age: null,
    gender: "",
    email: ""
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut({ scope: 'global' });
        toast({ title: t("sessionExpired") });
        navigate("/auth");
      }, SESSION_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimeout));
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, [navigate, t]);

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
      toast({ title: t("success") + "!" });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const submitSuggestion = async () => {
    if (!suggestion.trim()) {
      toast({ title: "Please enter a suggestion", variant: "destructive" });
      return;
    }
    setSubmittingSuggestion(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Thank you for your suggestion! 💡" });
    setSuggestion("");
    setSubmittingSuggestion(false);
  };

  const logoutFromAllDevices = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    toast({ title: t("logoutAllDevices") });
    navigate("/auth");
  };

  const navItems = [
    { icon: Home, label: t("home"), path: "/dashboard" },
    { icon: History, label: t("history"), path: "/history" },
    { icon: MessageCircle, label: t("contact"), path: "/contact" },
    { icon: FlaskConical, label: t("tester"), path: "/sandbox" },
    { icon: Star, label: t("favorites"), path: "/favorites" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <Header title={t("myProfile")} subtitle={t("manageAccount")}>
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
              <Label htmlFor="displayName">{t("displayName")}</Label>
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
              <Label htmlFor="phone">{t("phone")}</Label>
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
                <Label htmlFor="age">{t("age")}</Label>
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
                <Label>{t("gender")}</Label>
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
              {saving ? t("loading") : t("saveChanges")}
            </Button>
          </div>
        </div>

        {/* Suggestion Section */}
        <div className="glass-card p-4 animate-slide-up delay-50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">{t("haveSuggestion")}</h3>
          </div>
          <Textarea
            placeholder={t("shareSuggestion")}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            className="mb-3"
            rows={3}
          />
          <Button
            variant="gradient"
            className="w-full"
            onClick={submitSuggestion}
            disabled={submittingSuggestion}
          >
            <Send className="w-4 h-4 mr-2" />
            {submittingSuggestion ? t("loading") : t("submitSuggestion")}
          </Button>
        </div>

        {/* Railway Contacts */}
        <div className="glass-card p-4 animate-slide-up delay-100">
          <div className="flex items-center gap-2 mb-3">
            <Train className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t("contactRailways")}</h3>
          </div>
          
          <div className="space-y-2">
            {RAILWAY_CONTACTS.map((contact, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  {contact.type === "enquiry" && <HelpCircle className="w-4 h-4 text-accent flex-shrink-0" />}
                  {contact.type === "complaint" && <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />}
                  {contact.type === "security" && <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="glass-card p-4 animate-slide-up delay-200">
          <h3 className="font-semibold text-foreground mb-3">{t("quickNavigation")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={logoutFromAllDevices}
          >
            {t("logoutAllDevices")}
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive hover:bg-destructive/10"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
          >
            {t("logout")}
          </Button>
        </div>
      </main>
    </div>
  );
}
