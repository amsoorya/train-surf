import { Moon, Sun, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TopBar() {
  const { theme, toggleTheme, language, setLanguage, languages, isTranslating } = useApp();

  return (
    <div className="fixed top-0 right-0 z-50 flex items-center gap-1 p-2 safe-top">
      {/* Translation Loading Indicator */}
      {isTranslating && (
        <div className="h-8 px-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-md">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Translating...</span>
        </div>
      )}

      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm border border-border/50">
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <ScrollArea className="h-64">
            {Object.entries(languages).map(([code, name]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => setLanguage(code)}
                className={language === code ? "bg-primary/10" : ""}
              >
                {name}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8 bg-background/80 backdrop-blur-sm border border-border/50"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
