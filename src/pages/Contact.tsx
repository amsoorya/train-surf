import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageCircle, Mail, Phone, Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const FAQ_RESPONSES: Record<string, string> = {
  "how does trainsurf work": "TrainSurf uses an intelligent algorithm to find seat combinations when direct tickets are unavailable. It checks shorter segments within the same train and stitches them together for your complete journey!",
  "what is seat stitching": "Seat stitching means booking multiple shorter segments on the same train when the full journey isn't available. For example, if A→C is waitlisted, but A→B and B→C are available, you can book both!",
  "is it free": "TrainSurf is free to use! You can search for optimal seat combinations without any charges.",
  "how many seat changes": "The algorithm tries to minimize seat changes. Typically, you'll need 1-3 seat changes depending on availability. We always find the path with minimum hops!",
  "which trains supported": "TrainSurf works with all Indian Railways trains - Rajdhani, Shatabdi, Duronto, Mail/Express, and more. Just enter your train number!",
  "what is quota": "Quota refers to the reservation category - General (GN), Tatkal (TQ), Premium Tatkal (PT), Ladies (LD), etc. Each quota has separate seat allocation.",
  "overlapping segments": "Yes! TrainSurf now supports overlapping segments. If 0→5 and 4→10 are available (with overlap at station 4), we can still complete your journey!",
  "wl rac": "WL (Waitlist) means no confirmed seat yet. RAC (Reservation Against Cancellation) is a partially confirmed ticket. TrainSurf prioritizes confirmed and RAC segments!",
  "how to use sandbox": "The Sandbox/Tester lets you understand how TrainSurf works using simulated data. Go to Tester from the menu and try different scenarios!",
  "urgent mode": "Urgent mode runs the full seat-stitching algorithm to find any available path. Normal/Comfort mode only checks direct availability.",
  "default": "I'm not sure about that. For specific queries, please contact the developer:\n\n📧 Email: amjayasoorya@gmail.com\n📞 Phone: +91 9345259635"
};

export default function Contact() {
  const navigate = useNavigate();
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

  const findResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
      if (key === "default") continue;
      const keywords = key.split(" ");
      const matchCount = keywords.filter(kw => lowerQuery.includes(kw)).length;
      if (matchCount >= Math.ceil(keywords.length * 0.5)) {
        return response;
      }
    }
    
    return FAQ_RESPONSES["default"];
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

    // Simulate bot typing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Contact Us" subtitle="Get help & support">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Header>

      <main className="flex-1 px-4 -mt-4 flex flex-col">
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

        {/* Chat Bot */}
        <div className="glass-card flex-1 flex flex-col animate-slide-up delay-100 min-h-[400px]">
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
