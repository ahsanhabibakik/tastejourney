import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"; // fallback spinner, replace with your Spinner if available

export function LoadingScreen() {
  const [message, setMessage] = useState<string>("");
  const prompts = [
    "🔍 Analyzing your website’s content and audience…",
    "📊 Crunching engagement numbers and themes…",
    "🎯 Mapping your creator taste profile…",
    "✈️ Calculating your top monetizable destinations…",
    "🛠️ Putting together your custom travel report…",
  ];

  useEffect(() => {
    setMessage(prompts[Math.floor(Math.random() * prompts.length)]);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
      <p className="text-lg font-medium text-foreground text-center">{message}</p>
      <p className="text-sm text-muted-foreground text-center">
        This usually takes 5–10 seconds.
      </p>
    </div>
  );
}
