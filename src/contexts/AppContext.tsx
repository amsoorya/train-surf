import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  languages: typeof LANGUAGES;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  en: {
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
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });
  
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, languages: LANGUAGES, t }}>
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
