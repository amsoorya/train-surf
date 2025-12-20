import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Mail, Phone, Send, Bot, X, Star, 
  ExternalLink, Bug, Train, Ticket, Navigation 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Complete FAQ with all 30 Q&As - improved keyword matching
const FAQ_DATA = [
  { 
    keywords: ["what", "trainsurf", "about", "is", "app", "application"],
    q: "What is TrainSurf?",
    a: "TrainSurf is a web application that helps Indian Railways passengers find confirmed seat combinations when direct bookings show waitlisted, by intelligently checking shorter segments on the same train."
  },
  { 
    keywords: ["official", "irctc", "indian", "railways", "affiliated", "government"],
    q: "Is TrainSurf official?",
    a: "No. TrainSurf is an independent, developer-built project and is not affiliated with IRCTC or Indian Railways."
  },
  { 
    keywords: ["who", "built", "developer", "created", "made", "author", "jaya", "soorya"],
    q: "Who built TrainSurf?",
    a: "TrainSurf was built by Jaya Soorya as a personal developer project inspired by real travel experience."
  },
  { 
    keywords: ["free", "cost", "price", "charge", "money", "pay", "payment"],
    q: "Is TrainSurf free?",
    a: "Yes. TrainSurf is free to use for searching seat-stitching possibilities."
  },
  { 
    keywords: ["how", "find", "confirmed", "seats", "waitlisted", "work", "works", "working"],
    q: "How does it find confirmed seats?",
    a: "TrainSurf checks availability across multiple shorter segments of the same train and combines confirmed segments to form a complete journey."
  },
  { 
    keywords: ["guarantee", "guaranteed", "confirmed", "ticket", "sure", "promise"],
    q: "Does it guarantee tickets?",
    a: "No. TrainSurf only suggests possible confirmed segment combinations. Final booking success depends on real-time availability on IRCTC."
  },
  { 
    keywords: ["direct", "ticket", "available", "already", "available"],
    q: "What if direct ticket is available?",
    a: "If the direct source-to-destination ticket is available, TrainSurf will return that option without suggesting segment splitting."
  },
  { 
    keywords: ["book", "tickets", "automatically", "auto", "booking", "automatic"],
    q: "Does it book automatically?",
    a: "No. TrainSurf only provides a booking plan. Users must book tickets manually on IRCTC."
  },
  { 
    keywords: ["seat", "stitching", "stitch", "meaning", "mean", "define", "definition"],
    q: "What is seat stitching?",
    a: "Seat stitching means combining multiple shorter confirmed ticket segments on the same train to complete a longer journey."
  },
  { 
    keywords: ["minimize", "seat", "changes", "reduce", "less", "algorithm", "change"],
    q: "How does it minimize seat changes?",
    a: "TrainSurf uses a backward binary search strategy to find the furthest reachable stations first, reducing the number of seat changes."
  },
  { 
    keywords: ["other", "railway", "apps", "why", "dont", "do", "different"],
    q: "Why don't other apps do this?",
    a: "Checking all segment combinations is computationally expensive. TrainSurf applies pruning and optimization techniques to make it feasible."
  },
  { 
    keywords: ["no", "valid", "combination", "found", "not", "available", "fail", "failed"],
    q: "What if no combination is found?",
    a: "TrainSurf will clearly indicate that no confirmed segment path is available for the selected journey."
  },
  { 
    keywords: ["details", "need", "search", "input", "required", "fields", "enter"],
    q: "What details do I need?",
    a: "You need the train number, source station, destination station, journey date, class, and quota."
  },
  { 
    keywords: ["save", "revisit", "searches", "history", "past", "previous"],
    q: "Can I save my searches?",
    a: "Yes. Logged-in users can view their past searches and results in the search history section."
  },
  { 
    keywords: ["sandbox", "mode", "test", "testing", "tester", "demo", "try"],
    q: "What is Sandbox Mode?",
    a: "Sandbox Mode allows users to test the TrainSurf algorithm without making live API calls."
  },
  { 
    keywords: ["export", "copy", "booking", "plan", "share", "download"],
    q: "Can I export the booking plan?",
    a: "Yes. TrainSurf allows you to copy or export the suggested booking segments."
  },
  { 
    keywords: ["where", "data", "come", "from", "api", "source", "fetch"],
    q: "Where does data come from?",
    a: "TrainSurf uses the IRCTC API via RapidAPI to fetch train routes and seat availability."
  },
  { 
    keywords: ["real", "time", "realtime", "live", "data", "current", "accurate"],
    q: "Is the data real-time?",
    a: "The data is fetched in real time, but actual availability may change quickly during booking."
  },
  { 
    keywords: ["results", "differ", "irctc", "website", "different", "mismatch"],
    q: "Why might results differ from IRCTC?",
    a: "Availability can change between searches due to high demand, cancellations, or booking activity."
  },
  { 
    keywords: ["account", "login", "register", "signup", "sign", "need"],
    q: "Do I need an account?",
    a: "Basic searching may be available without login, but features like history require an account."
  },
  { 
    keywords: ["store", "irctc", "login", "credentials", "password", "secure", "security"],
    q: "Does it store IRCTC credentials?",
    a: "No. TrainSurf never asks for or stores IRCTC credentials."
  },
  { 
    keywords: ["data", "secure", "security", "safe", "privacy", "protect", "protected"],
    q: "Is my data secure?",
    a: "Yes. TrainSurf uses secure authentication and row-level security to protect user data."
  },
  { 
    keywords: ["install", "phone", "app", "pwa", "mobile", "android", "ios", "download"],
    q: "Can I install on my phone?",
    a: "Yes. TrainSurf is a Progressive Web App (PWA) and can be installed like a native app."
  },
  { 
    keywords: ["work", "offline", "internet", "connection", "without", "no"],
    q: "Does it work offline?",
    a: "Offline support is limited to cached data. Live availability checks require internet access."
  },
  { 
    keywords: ["tatkal", "bookings", "premium", "urgent", "emergency"],
    q: "Does it support Tatkal?",
    a: "Tatkal availability depends on IRCTC rules. TrainSurf may not reliably support Tatkal scenarios."
  },
  { 
    keywords: ["rac", "tickets", "confirmed", "waiting", "waitlist"],
    q: "Does it consider RAC as confirmed?",
    a: "RAC tickets are treated as conditional and may not always be considered confirmed."
  },
  { 
    keywords: ["responsible", "booking", "failures", "refund", "blame", "fault"],
    q: "Is it responsible for failures?",
    a: "No. TrainSurf only provides suggestions. Final booking is done on IRCTC and subject to its rules."
  },
  { 
    keywords: ["open", "source", "github", "code", "repository", "repo"],
    q: "Is it open source?",
    a: "Yes. The project source code is available on GitHub."
  },
  { 
    keywords: ["contribute", "help", "development", "developer", "join", "volunteer"],
    q: "Can I contribute?",
    a: "Yes. Contributions, bug reports, and feature suggestions are welcome via GitHub."
  },
  { 
    keywords: ["contact", "developer", "email", "phone", "reach", "talk", "message", "call"],
    q: "How to contact the developer?",
    a: "You can reach the developer via email at amjayasoorya@gmail.com or on GitHub."
  },
];

// Greeting responses
const GREETINGS = ["hi", "hello", "hey", "hii", "hiii", "hola", "namaste", "good morning", "good evening", "good afternoon"];

export default function Contact() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi! I'm TrainBot. Ask me anything about TrainSurf - how it works, seat stitching, quotas, and more!",
      isBot: true,
      timestamp: new Date()
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

  const findResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Check for greetings
    if (GREETINGS.some(g => lowerQuery.includes(g))) {
      return "Hello! 👋 I'm TrainBot, here to help you with TrainSurf. You can ask me about:\n\n• What is TrainSurf?\n• How does seat stitching work?\n• Is it free?\n• How to use the app?\n• Contact details\n\nWhat would you like to know?";
    }

    // Check for thanks
    if (lowerQuery.includes("thank") || lowerQuery.includes("thanks") || lowerQuery.includes("thx")) {
      return "You're welcome! 😊 Is there anything else you'd like to know about TrainSurf?";
    }
    
    // Tokenize query into words
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 1);
    
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
    
    // Require at least 20% match
    if (bestMatch.faq && bestMatch.score >= 0.2) {
      return bestMatch.faq.a;
    }
    
    // Default response with suggestions
    return "I'm not sure about that specific question. Here are some things I can help with:\n\n• What is TrainSurf?\n• How does seat stitching work?\n• Is it free to use?\n• How to contact the developer?\n• Can I install it on my phone?\n• Does it work offline?\n\nFor specific queries, please contact:\n📧 amjayasoorya@gmail.com\n📞 +91 9345259635";
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: findResponse(input),
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
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
      text: "👋 Hi! I'm TrainBot. Ask me anything about TrainSurf - how it works, seat stitching, quotas, and more!",
      isBot: true,
      timestamp: new Date()
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
        <div className="glass-card flex-1 flex flex-col animate-slide-up delay-100 min-h-[300px]">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">TrainBot</span>
            <span className="text-xs text-muted-foreground">• {t("online")}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
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
              <Button size="icon" variant="gradient" onClick={sendMessage} disabled={isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
