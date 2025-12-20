import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark";

const LANGUAGES = {
  en: "English",
  as: "অসমীয়া",
  bn: "বাংলা",
  bo: "བོད་སྐད",
  doi: "डोगरी",
  gu: "ગુજરાતી",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  ks: "کٲشُر",
  kok: "कोंकणी",
  mai: "मैथिली",
  ml: "മലയാളം",
  mni: "ꯃꯤꯇꯩꯂꯣꯟ",
  mr: "मराठी",
  ne: "नेपाली",
  or: "ଓଡ଼ିଆ",
  pa: "ਪੰਜਾਬੀ",
  sa: "संस्कृतम्",
  sat: "ᱥᱟᱱᱛᱟᱲᱤ",
  sd: "سنڌي",
  ta: "தமிழ்",
  te: "తెలుగు",
  ur: "اردو",
  es: "Español",
  fr: "Français",
  pt: "Português",
  de: "Deutsch",
  ar: "العربية",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

// Base English translations
const baseTranslations: Record<string, string> = {
  search: "Search",
  home: "Home",
  history: "History",
  profile: "Profile",
  contact: "Contact",
  favorites: "Favorites",
  tester: "Tester",
  settings: "Settings",
  logout: "Sign Out",
  darkMode: "Dark Mode",
  language: "Language",
  pnrStatus: "PNR Status",
  liveTrainStatus: "Live Train Status",
  trainsBetween: "Trains Between Stations",
  bookNow: "Book Now",
  reportBug: "Report Bug",
  feedback: "Feedback",
  goBack: "Go Back",
  endChat: "End Chat",
  welcome: "Welcome",
  signIn: "Sign In",
  signUp: "Sign Up",
  email: "Email",
  password: "Password",
  phone: "Phone",
  submit: "Submit",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",
  loading: "Loading...",
  error: "Error",
  success: "Success",
  noResults: "No results found",
  tryAgain: "Try Again",
};

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  languages: typeof LANGUAGES;
  t: (key: string) => string;
  isTranslating: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Translation cache
const translationCache: Record<string, Record<string, string>> = {
  en: { ...baseTranslations },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });
  
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  const [translations, setTranslations] = useState<Record<string, string>>(baseTranslations);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      if (language === "en") {
        setTranslations(baseTranslations);
        return;
      }

      // Check cache first
      if (translationCache[language]) {
        setTranslations(translationCache[language]);
        return;
      }

      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(baseTranslations);
        
        const { data, error } = await supabase.functions.invoke("translate", {
          body: { texts: textsToTranslate, targetLang: language }
        });

        if (error) {
          console.error("Translation error:", error);
          setTranslations(baseTranslations);
          return;
        }

        if (data?.translations) {
          const keys = Object.keys(baseTranslations);
          const newTranslations: Record<string, string> = {};
          keys.forEach((key, i) => {
            newTranslations[key] = data.translations[i] || baseTranslations[key];
          });
          
          // Cache the translations
          translationCache[language] = newTranslations;
          setTranslations(newTranslations);
        }
      } catch (err) {
        console.error("Translation failed:", err);
        setTranslations(baseTranslations);
      } finally {
        setIsTranslating(false);
      }
    };

    loadTranslations();
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = useCallback((key: string) => {
    return translations[key] || baseTranslations[key] || key;
  }, [translations]);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, languages: LANGUAGES, t, isTranslating }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
