import React from "react";
import { Bot, CheckCircle2, Circle, ArrowRight, Mail, Sparkles, MessageSquare, Wand2, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarContentProps {
  chatState: string;
  currentQuestionIndex: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    icon: string;
    multiSelect: boolean;
  }>;
  messages: Array<{
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
    component?: string;
  }>;
  websiteData: {
    url: string;
    themes: string[];
    hints: string[];
    contentType: string;
    socialLinks: Array<{ platform: string; url: string }>;
    title: string;
    description: string;
  } | null;
  tasteProfile: {
    tasteVector: Record<string, number>;
    confidence?: number;
    culturalAffinities?: string[];
    personalityTraits?: string[];
  } | null;
  reportSent: boolean;
  email: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  setShowEmailSection: (show: boolean) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = React.memo(({
  chatState,
  currentQuestionIndex,
  questions,
  messages,
  websiteData,
  tasteProfile,
  reportSent,
  email,
  setInputValue,
  handleSendMessage,
  setShowEmailSection,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-6 w-6 text-primary drop-shadow-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card animate-pulse shadow-sm" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">Travel AI Assistant</h2>
              <p className="text-xs text-muted-foreground">Analyzing your journey</p>
            </div>
          </div>
          <div className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Live
          </div>
        </div>
      </div>

      {/* Progress & Stats */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Journey Progress Steps */}
        <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-4 border border-border/30">
          <h3 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Journey Progress
          </h3>
          <div className="space-y-2">
            {[
              { step: "Website Analysis", status: chatState !== "initial" ? "completed" : chatState === "initial" ? "current" : "pending", icon: Globe },
              { step: "Data Confirmation", status: chatState === "profiling" || chatState === "questions" || chatState === "generating" || chatState === "recommendations" ? "completed" : chatState === "confirmation" ? "current" : "pending", icon: CheckCircle2 },
              { step: "Taste Profiling", status: chatState === "questions" || chatState === "generating" || chatState === "recommendations" ? "completed" : chatState === "profiling" ? "current" : "pending", icon: Bot },
              { step: "Preferences", status: chatState === "generating" || chatState === "recommendations" ? "completed" : chatState === "questions" ? "current" : "pending", icon: MessageSquare },
              { step: "Recommendations", status: chatState === "recommendations" ? "completed" : chatState === "generating" ? "current" : "pending", icon: Sparkles }
            ].map((item, idx) => {
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                    item.status === "completed" ? "bg-green-500/20 text-green-600" :
                    item.status === "current" ? "bg-primary/20 text-primary animate-pulse" :
                    "bg-muted/50 text-muted-foreground"
                  }`}>
                    {item.status === "completed" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : item.status === "current" ? (
                      <Circle className="h-3 w-3 fill-current" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>
                  <span className={`text-xs flex-1 transition-all duration-300 ${
                    item.status === "completed" ? "font-medium text-foreground" :
                    item.status === "current" ? "font-medium text-primary" :
                    "text-muted-foreground"
                  }`}>
                    {item.step}
                  </span>
                  {item.status === "current" && (
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Stats */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/30">
          <h3 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Session Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-primary">{messages.length}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold text-green-600">
                {chatState === "recommendations" ? "100%" : 
                 chatState === "generating" ? "85%" :
                 chatState === "review-edit" ? "75%" :
                 chatState === "questions" ? "50%" :
                 chatState === "profiling" ? "25%" :
                 chatState === "confirmation" ? "15%" :
                 chatState === "analyzing" ? "10%" : "5%"}
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>

        {/* Website Analysis Summary */}
        {websiteData && (
          <div className="bg-gradient-to-br from-accent/10 to-transparent rounded-lg p-3 border border-border/30">
            <h3 className="font-semibold text-[12px] mb-2 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-accent" />
              Website Insights
            </h3>
            <div className="space-y-2.5">
              {/* Analyzed URL */}
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Analyzed Website</div>
                <div className="text-[10px] font-mono bg-background/50 text-foreground px-2 py-1 rounded border border-border/50 break-all">
                  {websiteData.url}
                </div>
              </div>
              
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Content Type</div>
                <div className="text-[11px] font-medium text-foreground bg-accent/10 px-2 py-1 rounded inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {websiteData.contentType}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Key Themes</div>
                <div className="flex flex-wrap gap-1">
                  {websiteData.themes.slice(0, 3).map((theme: string, i: number) => (
                    <span key={i} className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                      {theme}
                    </span>
                  ))}
                  {websiteData.themes.length > 3 && (
                    <span className="bg-muted/50 text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                      +{websiteData.themes.length - 3}
                    </span>
                  )}
                </div>
              </div>
              {tasteProfile && (
                <div className="pt-1 border-t border-border/30">
                  <div className="text-[10px] text-muted-foreground mb-1">Taste Match</div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${(tasteProfile.confidence || 0.85) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-primary">
                      {Math.round((tasteProfile.confidence || 0.85) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Status */}
        {chatState === "recommendations" && reportSent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-[12px] text-green-800">
                Report Delivered
              </h3>
            </div>
            <p className="text-[10px] text-green-600 leading-relaxed">
              Your personalized PDF report has been sent to {email}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {chatState === "recommendations" && (
          <div className="space-y-2">
            <h3 className="font-semibold text-[12px] text-foreground flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              Quick Actions
            </h3>
            <div className="grid gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start h-7 text-[11px] hover:bg-primary/10 hover:text-primary hover:border-primary/30 px-2.5 group"
                onClick={() => {
                  setInputValue("Show me more destinations");
                  setTimeout(() => handleSendMessage(), 0);
                }}
              >
                <Sparkles className="h-3 w-3 mr-1.5 group-hover:animate-pulse" />
                More Destinations
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`justify-start h-7 text-[11px] px-2.5 group ${
                  reportSent 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                    : "hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                }`}
                onClick={() => {
                  setShowEmailSection(true);
                  setTimeout(() => {
                    const el = document.getElementById('email-report-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                <Mail className="h-3 w-3 mr-1.5" />
                {reportSent ? "Report Sent ✓" : "Get PDF Report"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start h-7 text-[11px] hover:bg-muted hover:text-foreground px-2.5"
                onClick={() => {
                  setInputValue("Export this conversation");
                  setTimeout(() => handleSendMessage(), 0);
                }}
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Export Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

export default SidebarContent;
