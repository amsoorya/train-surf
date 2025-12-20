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

// All translatable strings in the app
const baseTranslations: Record<string, string> = {
  // Navigation
  search: "Search",
  home: "Home",
  history: "History",
  profile: "Profile",
  contact: "Contact",
  favorites: "Favorites",
  tester: "Tester",
  settings: "Settings",
  logout: "Sign Out",
  
  // Theme & Language
  darkMode: "Dark Mode",
  language: "Language",
  translating: "Translating...",
  
  // Features
  pnrStatus: "PNR Status",
  liveTrainStatus: "Live Train",
  trainsBetween: "Trains",
  bookNow: "Book Now",
  reportBug: "Report Bug",
  feedback: "Feedback",
  goBack: "Go Back",
  endChat: "End Chat",
  
  // Auth
  welcome: "Welcome",
  signIn: "Sign In",
  signUp: "Sign Up",
  email: "Email",
  password: "Password",
  phone: "Phone",
  
  // Actions
  submit: "Submit",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",
  loading: "Loading...",
  error: "Error",
  success: "Success",
  noResults: "No results found",
  tryAgain: "Try Again",
  
  // Dashboard
  smartSeatStitching: "Smart Seat Stitching",
  findOptimalSeats: "Find optimal seat combinations",
  searchMode: "Search Mode",
  normal: "Normal",
  urgent: "Urgent",
  checkDirect: "Check direct availability only",
  fullAlgorithm: "Full seat-stitching algorithm",
  trainNumber: "Train Number",
  fromStation: "From Station",
  toStation: "To Station",
  journeyDate: "Journey Date",
  classLabel: "Class",
  quota: "Quota",
  runTrainSurf: "Run TrainSurf",
  
  // Profile
  myProfile: "My Profile",
  manageAccount: "Manage your account",
  displayName: "Display Name",
  age: "Age",
  gender: "Gender",
  saveChanges: "Save Changes",
  haveSuggestion: "Have a Suggestion?",
  shareSuggestion: "Share your ideas to improve TrainSurf...",
  submitSuggestion: "Submit Suggestion",
  contactRailways: "Contact Railways",
  quickNavigation: "Quick Navigation",
  logoutAllDevices: "Logout from All Devices",
  sessionExpired: "Session expired. Please login again.",
  
  // Contact
  developerContact: "Developer Contact",
  askAnything: "Ask me anything...",
  online: "Online",
  rateReview: "Rate & Review",
  shareYourFeedback: "Share your feedback...",
  submitFeedback: "Submit Feedback",
  describeBug: "Describe the bug you encountered...",
  submitReport: "Submit Report",
  chatEnded: "Chat ended",
  thankYouFeedback: "Thank you for your feedback!",
  bugReportSubmitted: "Bug report submitted. Thanks for helping improve TrainSurf!",
  pleaseSelectRating: "Please select a rating",
  pleaseDescribeBug: "Please describe the bug",
  
  // PNR Status
  enterPnr: "Enter your 10-digit PNR number",
  checkStatus: "Check Status",
  invalidPnr: "Please enter a valid 10-digit PNR",
  passengerDetails: "Passenger Details",
  passenger: "Passenger",
  bookingStatus: "Booking Status",
  currentStatus: "Current Status",
  coach: "Coach",
  berth: "Berth",
  
  // Trains Between
  findTrains: "Find trains between any two stations",
  searchTrains: "Search Trains",
  selectSource: "Select source station",
  selectDestination: "Select destination station",
  departure: "Departure",
  arrival: "Arrival",
  duration: "Duration",
  runsOn: "Runs On",
  
  // Live Train
  trackTrain: "Track train location and status",
  getStatus: "Get Status",
  currentLocation: "Current Location",
  lastUpdate: "Last Update",
  delay: "Delay",
  onTime: "On Time",
  late: "Late",
  
  // Tester Mode
  testerMode: "Tester Mode",
  testerModeOn: "Tester Mode ON",
  testerModeOff: "Tester Mode OFF",
  usingTestData: "Using test data",
  usingLiveData: "Using live data",
};

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  languages: typeof LANGUAGES;
  t: (key: string) => string;
  isTranslating: boolean;
  isTesterMode: boolean;
  toggleTesterMode: () => void;
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

  const [isTesterMode, setIsTesterMode] = useState(() => {
    return localStorage.getItem("testerMode") === "true";
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

  const toggleTesterMode = () => {
    setIsTesterMode(prev => {
      const newVal = !prev;
      localStorage.setItem("testerMode", String(newVal));
      return newVal;
    });
  };

  const t = useCallback((key: string) => {
    return translations[key] || baseTranslations[key] || key;
  }, [translations]);

  return (
    <AppContext.Provider value={{ 
      theme, toggleTheme, 
      language, setLanguage, languages: LANGUAGES, 
      t, isTranslating,
      isTesterMode, toggleTesterMode
    }}>
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
