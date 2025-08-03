import { useEffect, useState, useMemo } from "react";
import { Brain, Sparkles, Target, Zap, Globe, TrendingUp } from "lucide-react";

export default function LoadingScreen() {
  const [message, setMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const steps = useMemo(() => [
    { icon: Brain, text: "Analyzing your website's content and audience", color: "text-blue-500" },
    { icon: TrendingUp, text: "Crunching engagement numbers and themes", color: "text-green-500" },
    { icon: Target, text: "Mapping your creator taste profile", color: "text-purple-500" },
    { icon: Globe, text: "Calculating your top monetizable destinations", color: "text-orange-500" },
    { icon: Zap, text: "Putting together your custom travel report", color: "text-pink-500" },
  ], []);

  useEffect(() => {
    const randomStep = Math.floor(Math.random() * steps.length);
    setCurrentStep(randomStep);
    setMessage(steps[randomStep].text);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
    
    return () => clearInterval(progressInterval);
  }, [steps]);

  const CurrentIcon = steps[currentStep]?.icon || Brain;

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-fade-in">
      {/* Enhanced Loading Animation */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute top-0 right-0 bottom-0 left-0 w-20 h-20 border-4 border-muted rounded-full animate-spin">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1" />
        </div>
        
        {/* Inner pulsing icon */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
          <CurrentIcon className={`h-8 w-8 ${steps[currentStep]?.color || 'text-primary'} animate-pulse`} />
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-full" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute -inset-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full animate-bounce"
              style={{
                left: `${20 + Math.cos(i * Math.PI / 3) * 40}px`,
                top: `${20 + Math.sin(i * Math.PI / 3) * 40}px`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-80 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Processing</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
      
      {/* Status Message */}
      <div className="text-center space-y-3 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-lg font-semibold text-foreground">
            {message}
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Our AI is working its magic to create personalized recommendations just for you.
          This usually takes 5–10 seconds.
        </p>
      </div>
      
      {/* Loading Steps Indicator */}
      <div className="flex items-center space-x-3 mt-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || progress > 80;
          
          return (
            <div
              key={index}
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                isActive 
                  ? 'border-primary bg-primary/10 scale-110' 
                  : isCompleted
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-muted-foreground/30 bg-muted/30'
              }`}
            >
              <StepIcon 
                className={`h-4 w-4 ${
                  isActive 
                    ? step.color 
                    : isCompleted
                    ? 'text-green-500'
                    : 'text-muted-foreground/50'
                }`} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
