import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Mail, Phone, Send, Bot, X, Star, 
  ExternalLink, Bug, Train, Ticket, Navigation,
  HelpCircle, Lightbulb, Shield, Zap, Clock, MapPin,
  Smartphone, Globe, Users, CreditCard, RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  quickReplies?: string[];
}

// Complete FAQ with 30+ Q&As - improved keyword matching
const FAQ_DATA = [
  { 
    keywords: ["what", "trainsurf", "about", "is", "app", "application", "tell", "explain"],
    q: "What is TrainSurf?",
    a: "TrainSurf is a smart web application that helps Indian Railways passengers find confirmed seat combinations when direct bookings show waitlisted. It intelligently checks shorter segments on the same train and stitches them together! 🚂",
    quickReplies: ["How does seat stitching work?", "Is it free?", "Who built it?"]
  },
  { 
    keywords: ["official", "irctc", "indian", "railways", "affiliated", "government", "real"],
    q: "Is TrainSurf official?",
    a: "No, TrainSurf is an independent, developer-built project and is NOT affiliated with IRCTC or Indian Railways. It's a personal project built to help travelers!",
    quickReplies: ["Who built TrainSurf?", "Is my data secure?"]
  },
  { 
    keywords: ["who", "built", "developer", "created", "made", "author", "jaya", "soorya", "owner"],
    q: "Who built TrainSurf?",
    a: "TrainSurf was built by Jaya Soorya as a personal developer project, inspired by his real travel experiences with Indian Railways. 👨‍💻",
    quickReplies: ["How to contact?", "Can I contribute?"]
  },
  { 
    keywords: ["free", "cost", "price", "charge", "money", "pay", "payment", "subscription", "premium"],
    q: "Is TrainSurf free?",
    a: "Yes! 🎉 TrainSurf is completely free to use. There are no hidden charges or subscriptions. Search as many seat combinations as you want!",
    quickReplies: ["How does it work?", "Any limitations?"]
  },
  { 
    keywords: ["how", "find", "confirmed", "seats", "waitlisted", "work", "works", "working", "algorithm", "logic"],
    q: "How does TrainSurf find confirmed seats?",
    a: "Here's the magic! ✨ When your direct ticket is waitlisted, TrainSurf:\n\n1️⃣ Gets the train's complete route\n2️⃣ Checks availability for shorter segments\n3️⃣ Uses a smart algorithm to find confirmed combinations\n4️⃣ Stitches them together for your complete journey!\n\nThis means you might get confirmed tickets where a direct booking wouldn't work!",
    quickReplies: ["What is seat stitching?", "Does it guarantee tickets?"]
  },
  { 
    keywords: ["guarantee", "guaranteed", "confirmed", "ticket", "sure", "promise", "100", "always"],
    q: "Does it guarantee tickets?",
    a: "No, TrainSurf doesn't guarantee tickets. 🎯 It suggests possible confirmed segment combinations based on current availability. Final booking success depends on real-time availability when you book on IRCTC.",
    quickReplies: ["Where to book?", "Why might results differ?"]
  },
  { 
    keywords: ["direct", "ticket", "available", "already"],
    q: "What if direct ticket is available?",
    a: "If the direct source-to-destination ticket is already available/confirmed, TrainSurf will show that option directly without suggesting segment splitting. No need to overcomplicate! 😊",
    quickReplies: ["When to use TrainSurf?", "How does algorithm work?"]
  },
  { 
    keywords: ["book", "tickets", "automatically", "auto", "booking", "automatic", "buy", "purchase"],
    q: "Does it book automatically?",
    a: "No, TrainSurf does NOT book tickets automatically. 🎫 It only provides a smart booking PLAN. You must book tickets manually on IRCTC's official website or app.",
    quickReplies: ["Open IRCTC", "How to use the plan?"]
  },
  { 
    keywords: ["seat", "stitching", "stitch", "meaning", "mean", "define", "definition", "concept"],
    q: "What is seat stitching?",
    a: "Seat stitching is a clever technique! 🧵 It means combining multiple shorter confirmed ticket segments on the SAME train to complete a longer journey.\n\nExample: If Delhi→Kolkata is waitlisted, but Delhi→Kanpur (confirmed) + Kanpur→Kolkata (confirmed) are available, you can book both and travel on the same train!",
    quickReplies: ["Any disadvantages?", "How to minimize seat changes?"]
  },
  { 
    keywords: ["minimize", "seat", "changes", "reduce", "less", "algorithm", "change", "fewer", "minimum"],
    q: "How does it minimize seat changes?",
    a: "TrainSurf uses a backward binary search strategy! 🔍 It starts from your destination and finds the FURTHEST reachable confirmed station first. This smart approach minimizes the number of seat changes needed.",
    quickReplies: ["How many changes maximum?", "Is it comfortable?"]
  },
  { 
    keywords: ["other", "railway", "apps", "why", "dont", "do", "different", "unique", "special"],
    q: "Why don't other apps do this?",
    a: "Great question! 🤔 Checking ALL segment combinations is computationally expensive. There could be hundreds of possible combinations! TrainSurf applies smart pruning and optimization techniques to make this feasible in seconds.",
    quickReplies: ["How fast is it?", "Is it open source?"]
  },
  { 
    keywords: ["no", "valid", "combination", "found", "not", "available", "fail", "failed", "nothing", "empty"],
    q: "What if no combination is found?",
    a: "If no confirmed segment path is available, TrainSurf will clearly show 'No results found'. 😔 This means even splitting won't help - the train might be fully booked throughout. Try another date or train!",
    quickReplies: ["Find alternative trains", "Check PNR status"]
  },
  { 
    keywords: ["details", "need", "search", "input", "required", "fields", "enter", "form", "fill"],
    q: "What details do I need?",
    a: "To search, you need:\n\n📝 Train Number (e.g., 12301)\n📍 Source Station (e.g., NDLS)\n📍 Destination Station (e.g., HWH)\n📅 Journey Date\n🎟️ Class (SL, 3A, 2A, 1A)\n📋 Quota (General, Tatkal, etc.)",
    quickReplies: ["How to find train number?", "What are quotas?"]
  },
  { 
    keywords: ["save", "revisit", "searches", "history", "past", "previous", "old", "recent"],
    q: "Can I save my searches?",
    a: "Yes! 📜 Logged-in users can view their past searches in the History section. You can also save frequently used routes to Favorites for quick access!",
    quickReplies: ["Go to History", "Go to Favorites"]
  },
  { 
    keywords: ["sandbox", "mode", "test", "testing", "tester", "demo", "try", "practice", "sample"],
    q: "What is Tester Mode?",
    a: "Tester Mode is a demo feature! 🧪 It lets you explore TrainSurf with sample data without making real API calls. Perfect for understanding how the app works before using it for actual journeys.",
    quickReplies: ["Enable Tester Mode", "How to use?"]
  },
  { 
    keywords: ["export", "copy", "booking", "plan", "share", "download", "screenshot"],
    q: "Can I export the booking plan?",
    a: "Yes! 📋 After TrainSurf finds a path, you can copy or share the segment details. This makes it easy to reference when booking on IRCTC!",
    quickReplies: ["How to book on IRCTC?", "Any tips?"]
  },
  { 
    keywords: ["where", "data", "come", "from", "api", "source", "fetch", "get", "retrieve"],
    q: "Where does data come from?",
    a: "TrainSurf fetches real availability data from official IRCTC APIs via secure connections. The data is the same as what you'd see on the IRCTC website! 🔗",
    quickReplies: ["Is it real-time?", "Why might results differ?"]
  },
  { 
    keywords: ["real", "time", "realtime", "live", "data", "current", "accurate", "updated", "fresh"],
    q: "Is the data real-time?",
    a: "The data is fetched in real-time when you search! ⚡ However, availability can change quickly during peak booking times. The status shown is accurate at the moment of search.",
    quickReplies: ["Best time to book?", "Why results may differ?"]
  },
  { 
    keywords: ["results", "differ", "irctc", "website", "different", "mismatch", "wrong", "incorrect"],
    q: "Why might results differ from IRCTC?",
    a: "Availability can change rapidly! 🔄 Between your TrainSurf search and opening IRCTC, seats might get booked, cancelled, or released. Always double-check on IRCTC before booking.",
    quickReplies: ["Go to IRCTC", "How to book faster?"]
  },
  { 
    keywords: ["account", "login", "register", "signup", "sign", "need", "required", "must"],
    q: "Do I need an account?",
    a: "Basic searching works without login! 🔓 However, features like Search History, Favorites, and personalized settings require a free account.",
    quickReplies: ["Create account", "What data is stored?"]
  },
  { 
    keywords: ["store", "irctc", "login", "credentials", "password", "secure", "security", "safe"],
    q: "Does it store IRCTC credentials?",
    a: "Absolutely NOT! 🔒 TrainSurf NEVER asks for or stores your IRCTC login details. Booking is always done directly on IRCTC's official platform.",
    quickReplies: ["Is my data secure?", "Privacy policy"]
  },
  { 
    keywords: ["data", "secure", "security", "safe", "privacy", "protect", "protected", "encrypt"],
    q: "Is my data secure?",
    a: "Yes! 🛡️ TrainSurf uses:\n\n✅ Secure HTTPS connections\n✅ Row-level security on database\n✅ Encrypted authentication\n✅ No IRCTC credentials stored\n\nYour search history is private to your account.",
    quickReplies: ["Who can see my data?", "Delete my account"]
  },
  { 
    keywords: ["install", "phone", "app", "pwa", "mobile", "android", "ios", "download", "homescreen"],
    q: "Can I install on my phone?",
    a: "Yes! 📱 TrainSurf is a Progressive Web App (PWA). You can install it like a native app:\n\n📲 Android: Tap browser menu → 'Add to Home Screen'\n📲 iPhone: Tap Share → 'Add to Home Screen'\n\nWorks offline too!",
    quickReplies: ["Does it work offline?", "Get notifications?"]
  },
  { 
    keywords: ["work", "offline", "internet", "connection", "without", "no", "network"],
    q: "Does it work offline?",
    a: "Partially! 📴 The app interface works offline, but live availability checks require internet connection. Cached data like your history remains accessible offline.",
    quickReplies: ["Install the app", "Save favorites"]
  },
  { 
    keywords: ["tatkal", "bookings", "premium", "urgent", "emergency", "fast", "quick"],
    q: "Does it support Tatkal?",
    a: "TrainSurf supports Tatkal quota in searches. ⚡ However, Tatkal has special IRCTC rules and the availability window is very limited. Seat stitching may be less effective for Tatkal due to rapid booking.",
    quickReplies: ["When does Tatkal open?", "Tips for Tatkal"]
  },
  { 
    keywords: ["rac", "tickets", "confirmed", "waiting", "waitlist", "status", "wl"],
    q: "Does it consider RAC as confirmed?",
    a: "RAC (Reservation Against Cancellation) is treated as a conditional status. 🎫 TrainSurf primarily looks for CNF (confirmed) tickets. RAC seats may still require you to share or might upgrade later.",
    quickReplies: ["What is RAC?", "WL vs RAC"]
  },
  { 
    keywords: ["responsible", "booking", "failures", "refund", "blame", "fault", "liability", "legal"],
    q: "Is it responsible for failures?",
    a: "No. ⚠️ TrainSurf only provides suggestions based on current availability. Final booking is done on IRCTC and is subject to their terms. TrainSurf is not responsible for booking outcomes.",
    quickReplies: ["IRCTC contact", "Refund policy"]
  },
  { 
    keywords: ["open", "source", "github", "code", "repository", "repo", "contribute"],
    q: "Is it open source?",
    a: "Yes! 🌟 TrainSurf's source code is available on GitHub. Feel free to explore, learn, or contribute!",
    quickReplies: ["How to contribute?", "Report a bug"]
  },
  { 
    keywords: ["contribute", "help", "development", "developer", "join", "volunteer", "improve"],
    q: "Can I contribute?",
    a: "Absolutely! 🤝 Contributions, bug reports, and feature suggestions are welcome via GitHub. You can also share feedback through this chat!",
    quickReplies: ["Report bug", "Submit feedback", "Contact developer"]
  },
  { 
    keywords: ["contact", "developer", "email", "phone", "reach", "talk", "message", "call", "speak"],
    q: "How to contact the developer?",
    a: "You can reach the developer through:\n\n📧 Email: amjayasoorya@gmail.com\n📞 Phone: +91 9345259635\n💬 GitHub: Open an issue or PR\n\nFeedback is always appreciated! 💜",
    quickReplies: ["Send email", "Report bug", "Submit feedback"]
  },
  { 
    keywords: ["language", "translation", "hindi", "tamil", "bengali", "translate", "regional"],
    q: "Which languages are supported?",
    a: "TrainSurf supports 30+ languages! 🌍 Including Hindi, Tamil, Bengali, Telugu, Marathi, and many more Indian and international languages. Change language from the top bar!",
    quickReplies: ["How to change language?", "Add new language"]
  },
  { 
    keywords: ["class", "sleeper", "ac", "1a", "2a", "3a", "sl", "cc", "2s", "types"],
    q: "Which classes are supported?",
    a: "TrainSurf supports all IRCTC classes:\n\n🛏️ SL - Sleeper\n❄️ 3A - Third AC\n❄️ 2A - Second AC\n❄️ 1A - First AC\n💺 CC - Chair Car\n💺 2S - Second Sitting\n💺 EC - Executive Chair\n\nAnd more!",
    quickReplies: ["Best class for travel?", "Class fare comparison"]
  },
  { 
    keywords: ["quota", "general", "ladies", "senior", "defence", "types", "different"],
    q: "What are different quotas?",
    a: "IRCTC has several booking quotas:\n\n📋 GN - General Quota\n⚡ TQ - Tatkal Quota\n👩 LD - Ladies Quota\n👴 SS - Senior Citizen\n🎖️ DF - Defence Forces\n📍 PQ - Pooled Quota\n\nAnd more for specific categories!",
    quickReplies: ["Which quota to use?", "Tatkal timing"]
  },
  { 
    keywords: ["time", "best", "book", "when", "booking", "window", "open", "hours"],
    q: "Best time to book tickets?",
    a: "Pro tips for booking! ⏰\n\n📅 General: Opens 120 days before journey\n⚡ Tatkal: Opens at 10 AM (AC) / 11 AM (Non-AC), one day before\n🌙 Best time: Early morning or late night for less traffic\n💡 Tip: Have your details ready before Tatkal opens!",
    quickReplies: ["Tatkal tips", "How to book faster?"]
  },
  { 
    keywords: ["pnr", "check", "status", "meaning", "number", "find", "where"],
    q: "What is PNR and how to check?",
    a: "PNR (Passenger Name Record) is your 10-digit booking reference! 🎫 You can check it:\n\n1️⃣ In TrainSurf's PNR Status section\n2️⃣ On IRCTC website\n3️⃣ Via SMS: Send 'PNR <number>' to 139\n\nIt shows your current booking status!",
    quickReplies: ["Check PNR now", "What do statuses mean?"]
  },
  { 
    keywords: ["help", "support", "issue", "problem", "error", "not", "working", "broken"],
    q: "Need help or facing issues?",
    a: "Sorry to hear you're having trouble! 😟 Here's how to get help:\n\n🐛 Bug? Use the Report Bug button below\n💡 Suggestion? Use the Feedback button\n📧 Complex issue? Email amjayasoorya@gmail.com\n💬 Quick question? I'm here to help!\n\nDescribe your issue and I'll try to assist!",
    quickReplies: ["Report bug", "Submit feedback", "Contact developer"]
  },
  { 
    keywords: ["feature", "new", "upcoming", "planned", "roadmap", "future", "update"],
    q: "Any upcoming features?",
    a: "Exciting things in the works! 🚀\n\n✨ Price comparison\n✨ Alternative route suggestions\n✨ Push notifications\n✨ More regional languages\n✨ Enhanced analytics\n\nStay tuned and share your feature requests!",
    quickReplies: ["Submit suggestion", "Report bug"]
  },
];

// Conversation starters
const CONVERSATION_STARTERS = [
  "How does TrainSurf work?",
  "Is it free to use?",
  "How to install the app?",
  "Check my PNR status",
  "Contact the developer",
];

// Greeting responses
const GREETINGS = ["hi", "hello", "hey", "hii", "hiii", "hola", "namaste", "good morning", "good evening", "good afternoon", "sup", "yo", "howdy"];

// Contextual follow-ups
const CONTEXTUAL_RESPONSES: Record<string, { text: string; quickReplies?: string[] }> = {
  "bye": { text: "Goodbye! 👋 Have a safe journey! Feel free to come back anytime you need help with your train bookings!", quickReplies: ["Start new chat"] },
  "thanks": { text: "You're welcome! 😊 Is there anything else you'd like to know about TrainSurf?", quickReplies: ["No, that's all", "Yes, one more question"] },
  "ok": { text: "Great! Let me know if you have any other questions! 🚂", quickReplies: ["What is TrainSurf?", "How to use?"] },
  "awesome": { text: "Glad I could help! 🎉 Anything else you'd like to explore?", quickReplies: ["Show features", "Contact developer"] },
  "cool": { text: "Thanks! Let me know if you need anything else! 😎", quickReplies: ["More questions", "That's all"] },
};

export default function Contact() {
  const navigate = useNavigate();
  const { t } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi! I'm TrainBot, your smart assistant for all things TrainSurf!\n\nI can help you with:\n• Understanding how seat stitching works\n• Finding your way around the app\n• Answering FAQs about bookings\n• Technical support\n\nWhat would you like to know?",
      isBot: true,
      timestamp: new Date(),
      quickReplies: CONVERSATION_STARTERS
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [bugReport, setBugReport] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const findResponse = (query: string): { text: string; quickReplies?: string[] } => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Check for greetings
    if (GREETINGS.some(g => lowerQuery === g || lowerQuery.startsWith(g + " ") || lowerQuery.startsWith(g + "!"))) {
      return { 
        text: "Hello! 👋 Great to meet you! I'm TrainBot, here to help you with TrainSurf.\n\nWhat would you like to know about?",
        quickReplies: ["What is TrainSurf?", "How to use?", "Is it free?", "Install app"]
      };
    }

    // Check for contextual responses
    for (const [keyword, response] of Object.entries(CONTEXTUAL_RESPONSES)) {
      if (lowerQuery.includes(keyword)) {
        return response;
      }
    }

    // Check for action requests
    if (lowerQuery.includes("pnr") && (lowerQuery.includes("check") || lowerQuery.includes("status"))) {
      return { 
        text: "You can check your PNR status in our dedicated section! 🎫 Just enter your 10-digit PNR number and get instant results.",
        quickReplies: ["Go to PNR Status", "What is PNR?", "Other questions"]
      };
    }

    if (lowerQuery.includes("live") && lowerQuery.includes("train")) {
      return { 
        text: "Track any train in real-time! 🚂 Just enter the train number and see current location, delays, and upcoming stations.",
        quickReplies: ["Go to Live Status", "How accurate is it?", "Other questions"]
      };
    }
    
    // Tokenize query into words
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    
    // Find best matching FAQ using keyword matching
    let bestMatch = { score: 0, faq: null as typeof FAQ_DATA[0] | null };
    
    for (const faq of FAQ_DATA) {
      let matchCount = 0;
      
      // Check each query word against keywords
      for (const word of queryWords) {
        for (const keyword of faq.keywords) {
          if (keyword.includes(word) || word.includes(keyword)) {
            matchCount++;
            break;
          }
        }
      }
      
      // Also check if query words appear in the question
      const questionWords = faq.q.toLowerCase().split(/\s+/);
      for (const word of queryWords) {
        if (questionWords.some(qw => qw.includes(word) || word.includes(qw))) {
          matchCount += 0.5;
        }
      }
      
      const score = matchCount / Math.max(queryWords.length, 1);
      
      if (score > bestMatch.score) {
        bestMatch = { score, faq };
      }
    }
    
    // Require at least 15% match (lowered threshold)
    if (bestMatch.faq && bestMatch.score >= 0.15) {
      return { text: bestMatch.faq.a, quickReplies: bestMatch.faq.quickReplies };
    }
    
    // Default response with suggestions
    return { 
      text: "I'm not sure about that specific question. 🤔 Here are some topics I can help with:",
      quickReplies: ["What is TrainSurf?", "How to use?", "Is it free?", "Install app", "Contact developer"]
    };
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

    const response = findResponse(messageText);
    
    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: response.text,
      isBot: true,
      timestamp: new Date(),
      quickReplies: response.quickReplies
    };

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleQuickReply = (reply: string) => {
    // Handle navigation quick replies
    if (reply === "Go to PNR Status" || reply === "Check PNR now") {
      navigate("/pnr-status");
      return;
    }
    if (reply === "Go to Live Status") {
      navigate("/live-train");
      return;
    }
    if (reply === "Go to History") {
      navigate("/history");
      return;
    }
    if (reply === "Go to Favorites") {
      navigate("/favorites");
      return;
    }
    if (reply === "Open IRCTC" || reply === "Go to IRCTC") {
      window.open("https://www.irctc.co.in", "_blank");
      return;
    }
    if (reply === "Report bug") {
      setShowBugReport(true);
      return;
    }
    if (reply === "Submit feedback") {
      setShowFeedback(true);
      return;
    }
    if (reply === "Send email" || reply === "Contact developer") {
      window.open("mailto:amjayasoorya@gmail.com", "_blank");
      return;
    }
    if (reply === "Start new chat") {
      endChat();
      return;
    }
    
    sendMessage(reply);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endChat = () => {
    setMessages([{
      id: "1",
      text: "👋 Hi! I'm TrainBot, your smart assistant for all things TrainSurf!\n\nI can help you with:\n• Understanding how seat stitching works\n• Finding your way around the app\n• Answering FAQs about bookings\n• Technical support\n\nWhat would you like to know?",
      isBot: true,
      timestamp: new Date(),
      quickReplies: CONVERSATION_STARTERS
    }]);
    toast({ title: t("chatEnded") });
  };

  const submitFeedback = () => {
    if (rating === 0) {
      toast({ title: t("pleaseSelectRating"), variant: "destructive" });
      return;
    }
    toast({ title: t("thankYouFeedback") + " ⭐" });
    setShowFeedback(false);
    setFeedback("");
    setRating(0);
  };

  const submitBugReport = () => {
    if (!bugReport.trim()) {
      toast({ title: t("pleaseDescribeBug"), variant: "destructive" });
      return;
    }
    toast({ title: t("bugReportSubmitted") });
    setShowBugReport(false);
    setBugReport("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t("contact")} subtitle={t("developerContact")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="flex-1 px-4 -mt-4 flex flex-col pb-20">
        {/* Developer Contact */}
        <div className="glass-card p-4 mb-4 animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3">{t("developerContact")}</h3>
          <div className="space-y-2">
            <a href="mailto:amjayasoorya@gmail.com" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
              <Mail className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">amjayasoorya@gmail.com</span>
            </a>
            <a href="tel:+919345259635" className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
              <Phone className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">+91 9345259635</span>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => navigate("/pnr-status")}
          >
            <Ticket className="w-4 h-4" />
            <span className="text-xs">{t("pnrStatus")}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => navigate("/live-train")}
          >
            <Navigation className="w-4 h-4" />
            <span className="text-xs">{t("liveTrainStatus")}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => navigate("/trains-between")}
          >
            <Train className="w-4 h-4" />
            <span className="text-xs">{t("trainsBetween")}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => window.open("https://www.irctc.co.in", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-xs">{t("bookNow")}</span>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("goBack")}
          </Button>
          <Button variant="outline" size="sm" onClick={endChat} className="flex-1">
            <X className="w-4 h-4 mr-1" /> {t("endChat")}
          </Button>
        </div>
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowFeedback(true)} className="flex-1">
            <Star className="w-4 h-4 mr-1" /> {t("feedback")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBugReport(true)} className="flex-1">
            <Bug className="w-4 h-4 mr-1" /> {t("reportBug")}
          </Button>
        </div>

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="glass-card p-4 mb-4 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground">{t("rateReview")}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFeedback(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder={t("shareYourFeedback")}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mb-3"
            />
            <Button variant="gradient" className="w-full" onClick={submitFeedback}>
              {t("submitFeedback")}
            </Button>
          </div>
        )}

        {/* Bug Report Modal */}
        {showBugReport && (
          <div className="glass-card p-4 mb-4 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground">{t("reportBug")}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowBugReport(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              placeholder={t("describeBug")}
              value={bugReport}
              onChange={(e) => setBugReport(e.target.value)}
              className="mb-3 min-h-[100px]"
            />
            <Button variant="gradient" className="w-full" onClick={submitBugReport}>
              {t("submitReport")}
            </Button>
          </div>
        )}

        {/* Chat Bot */}
        <div className="glass-card flex-1 flex flex-col animate-slide-up delay-100 min-h-[350px]">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-foreground text-sm">TrainBot</span>
              <span className="text-xs text-success ml-2">● {t("online")}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={endChat} className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.isBot
                        ? "bg-muted text-foreground rounded-bl-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isBot ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                {/* Quick Replies */}
                {msg.isBot && msg.quickReplies && msg.id === messages[messages.length - 1]?.id && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-2">
                    {msg.quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder={t("askAnything")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button size="icon" variant="gradient" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
