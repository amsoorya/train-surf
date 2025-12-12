import { Train, Waves } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Train className={`${iconSizes[size]} text-primary-foreground`} />
        <Waves 
          className={`absolute -bottom-1 -right-1 w-4 h-4 text-accent opacity-80`} 
        />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} text-primary-foreground tracking-tight`}>
          TrainSurf
        </span>
      )}
    </div>
  );
}
