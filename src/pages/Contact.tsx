import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Mail, Phone, Send, Bot, X, Star, MessageSquare, 
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

// Complete FAQ with all 30 Q&As
const FAQ_DATA = [
  { q: "what is trainsurf", a: "TrainSurf is a web application that helps Indian Railways passengers find confirmed seat combinations when direct bookings show waitlisted, by intelligently checking shorter segments on the same train." },
  { q: "official irctc indian railways affiliated", a: "No. TrainSurf is an independent, developer-built project and is not affiliated with IRCTC or Indian Railways." },
  { q: "who built developer created", a: "TrainSurf was built by Jaya Soorya as a personal developer project inspired by real travel experience." },
  { q: "free cost price", a: "Yes. TrainSurf is free to use for searching seat-stitching possibilities." },
  { q: "how does find confirmed seats waitlisted work", a: "TrainSurf checks availability across multiple shorter segments of the same train and combines confirmed segments to form a complete journey." },
  { q: "guarantee confirmed ticket booking", a: "No. TrainSurf only suggests possible confirmed segment combinations. Final booking success depends on real-time availability on IRCTC." },
  { q: "direct ticket available what happens", a: "If the direct source-to-destination ticket is available, TrainSurf will return that option without suggesting segment splitting." },
  { q: "book tickets automatically auto booking", a: "No. TrainSurf only provides a booking plan. Users must book tickets manually on IRCTC." },
  { q: "what is seat stitching meaning", a: "Seat stitching means combining multiple shorter confirmed ticket segments on the same train to complete a longer journey." },
  { q: "minimize seat changes algorithm", a: "TrainSurf uses a backward binary search strategy to find the furthest reachable stations first, reducing the number of seat changes." },
  { q: "other railway apps why don't", a: "Checking all segment combinations is computationally expensive. TrainSurf applies pruning and optimization techniques to make it feasible." },
  { q: "no valid seat combination found", a: "TrainSurf will clearly indicate that no confirmed segment path is available for the selected journey." },
  { q: "what details need search input", a: "You need the train number, source station, destination station, journey date, class, and quota." },
  { q: "save revisit searches history", a: "Yes. Logged-in users can view their past searches and results in the search history section." },
  { q: "what is sandbox mode test", a: "Sandbox Mode allows users to test the TrainSurf algorithm without making live API calls." },
  { q: "export copy booking plan", a: "Yes. TrainSurf allows you to copy or export the suggested booking segments." },
  { q: "where does data come from api source", a: "TrainSurf uses the IRCTC API via RapidAPI to fetch train routes and seat availability." },
  { q: "real-time data live", a: "The data is fetched in real time, but actual availability may change quickly during booking." },
  { q: "results differ irctc website", a: "Availability can change between searches due to high demand, cancellations, or booking activity." },
  { q: "need account login register", a: "Basic searching may be available without login, but features like history require an account." },
  { q: "store irctc login credentials password", a: "No. TrainSurf never asks for or stores IRCTC credentials." },
  { q: "data secure security safe", a: "Yes. TrainSurf uses secure authentication and row-level security to protect user data." },
  { q: "install phone app pwa mobile", a: "Yes. TrainSurf is a Progressive Web App (PWA) and can be installed like a native app." },
  { q: "work offline internet connection", a: "Offline support is limited to cached data. Live availability checks require internet access." },
  { q: "tatkal bookings premium", a: "Tatkal availability depends on IRCTC rules. TrainSurf may not reliably support Tatkal scenarios." },
  { q: "rac tickets confirmed waiting", a: "RAC tickets are treated as conditional and may not always be considered confirmed." },
  { q: "responsible booking failures refund", a: "No. TrainSurf only provides suggestions. Final booking is done on IRCTC and subject to its rules." },
  { q: "open source github code", a: "Yes. The project source code is available on GitHub." },
  { q: "contribute help development", a: "Yes. Contributions, bug reports, and feature suggestions are welcome via GitHub." },
  { q: "contact developer email phone reach", a: "You can reach the developer via email at amjayasoorya@gmail.com or on GitHub." },
];

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
    const lowerQuery = query.toLowerCase();
    
    // Find best matching FAQ
    let bestMatch = { score: 0, answer: "" };
    
    for (const faq of FAQ_DATA) {
      const keywords = faq.q.split(" ");
      const matchCount = keywords.filter(kw => lowerQuery.includes(kw)).length;
      const score = matchCount / keywords.length;
      
      if (score > bestMatch.score && score >= 0.3) {
        bestMatch = { score, answer: faq.a };
      }
    }
    
    if (bestMatch.answer) {
      return bestMatch.answer;
    }
    
    return "I'm not sure about that specific question. Here are some things I can help with:\n\n• What is TrainSurf?\n• How does seat stitching work?\n• Is it free to use?\n• How to contact the developer?\n\nFor specific queries, please contact:\n📧 amjayasoorya@gmail.com\n📞 +91 9345259635";
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
    toast({ title: "Chat ended" });
  };

  const submitFeedback = () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    toast({ title: "Thank you for your feedback! ⭐" });
    setShowFeedback(false);
    setFeedback("");
    setRating(0);
  };

  const submitBugReport = () => {
    if (!bugReport.trim()) {
      toast({ title: "Please describe the bug", variant: "destructive" });
      return;
    }
    toast({ title: "Bug report submitted. Thanks for helping improve TrainSurf!" });
    setShowBugReport(false);
    setBugReport("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t("contact")} subtitle="Get help & support">
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
          <h3 className="font-semibold text-foreground mb-3">Developer Contact</h3>
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
              <h3 className="font-semibold text-foreground">Rate & Review</h3>
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
              placeholder="Share your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mb-3"
            />
            <Button variant="gradient" className="w-full" onClick={submitFeedback}>
              Submit Feedback
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
              placeholder="Describe the bug you encountered..."
              value={bugReport}
              onChange={(e) => setBugReport(e.target.value)}
              className="mb-3 min-h-[100px]"
            />
            <Button variant="gradient" className="w-full" onClick={submitBugReport}>
              Submit Report
            </Button>
          </div>
        )}

        {/* Chat Bot */}
        <div className="glass-card flex-1 flex flex-col animate-slide-up delay-100 min-h-[300px]">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">TrainBot</span>
            <span className="text-xs text-muted-foreground">• Online</span>
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
                placeholder="Ask me anything..."
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
