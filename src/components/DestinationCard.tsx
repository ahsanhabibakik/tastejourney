import React from "react";
import Image from "next/image";

interface Recommendation {
  destination: string;
  image?: string;
  budget?: {
    range: string;
  };
  engagement?: {
    potential: string;
  };
  highlights?: string[];
  creatorDetails?: {
    totalActiveCreators: number;
    topCreators: Array<{
      name: string;
      niche: string;
      collaboration: string;
    }>;
  };
  tags?: string[];
}

interface DestinationCardProps {
  rec: Recommendation;
  rank: number;
}

const DestinationCard: React.FC<DestinationCardProps> = React.memo(({ rec, rank }) => {
  return (
    <div className="w-full bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {rec.image ? (
          <Image 
            src={rec.image} 
            alt={rec.destination}
            width={320}
            height={192}
            className="w-full h-full object-cover"
            priority={rank <= 2}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl">🏝️</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Rank Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/95 backdrop-blur-sm text-primary text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
            #{rank}
          </div>
        </div>
        
        {/* Destination Name */}
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="font-bold text-xl text-white drop-shadow-lg">
            {rec.destination}
          </h4>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {rec.budget?.range && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">💰</div>
              <div className="text-xs font-semibold text-emerald-700">
                {rec.budget.range}
              </div>
            </div>
          )}
          {rec.engagement?.potential && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">🏝️</div>
              <div className="text-xs font-semibold text-blue-700">
                {rec.engagement.potential}
              </div>
            </div>
          )}
        </div>

        {/* Highlights */}
        {rec.highlights && rec.highlights.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Why This Destination
            </h5>
            <p className="text-sm text-foreground leading-relaxed">
              {rec.highlights.slice(0, 2).join(' • ')}
            </p>
          </div>
        )}

        {/* Creator Community */}
        {rec.creatorDetails && (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-primary flex items-center gap-2">
                🎯 Creator Hub
              </h5>
              <span className="text-xs text-muted-foreground font-semibold bg-primary/10 px-2 py-1 rounded-full">
                {rec.creatorDetails.totalActiveCreators}+ Active
              </span>
            </div>
            
            {rec.creatorDetails.topCreators.slice(0, 1).map((creator, idx) => (
              <div key={idx} className="bg-background/70 rounded-lg p-3">
                <div className="text-sm font-semibold text-foreground">
                  {creator.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {creator.niche}
                </div>
                <div className="text-sm text-primary font-medium mt-2">
                  {creator.collaboration}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Tags */}
        {rec.tags && rec.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rec.tags.slice(0, 4).map((tag: string) => (
              <span 
                key={tag} 
                className="bg-secondary/80 text-secondary-foreground text-xs px-3 py-1.5 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            {rec.tags.length > 4 && (
              <span className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full font-medium">
                +{rec.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

DestinationCard.displayName = 'DestinationCard';

export default DestinationCard;
