import { useGetLearningRecommendations, useGetLearningProgress, useGetLearningRoadmap, useUpdateLearningProgress, getGetLearningRecommendationsQueryKey, getGetLearningProgressQueryKey, getGetLearningRoadmapQueryKey } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { BookOpen, CheckCircle, ExternalLink, Flame, Target, ChevronRight, Play, FileText, Youtube, Globe, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const priorityColor: Record<string, string> = {
  high: "text-red-600 bg-red-500/10 border-red-500/30",
  medium: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30",
  low: "text-green-600 bg-green-500/10 border-green-500/30",
};

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  course: Play,
  youtube: Youtube,
  documentation: FileText,
  platform: Globe,
  roadmap: Map,
};

export default function Learning() {
  const headers = getAuthHeaders();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"recommendations" | "roadmap">("recommendations");

  const { data: recommendations, isLoading: loadingRecs } = useGetLearningRecommendations({
    request: { headers },
  });

  const { data: progress, isLoading: loadingProgress } = useGetLearningProgress({
    request: { headers },
  });

  const { data: roadmap } = useGetLearningRoadmap({
    request: { headers },
  });

  const updateProgress = useUpdateLearningProgress();

  function markComplete(id: string) {
    updateProgress.mutate({ data: { recommendationId: id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLearningProgressQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLearningRecommendationsQueryKey() });
        toast({ title: "Progress updated!", description: "+10 XP earned." });
      },
    });
  }

  const recs = Array.isArray(recommendations) ? recommendations : [];
  const completedIds = new Set(Array.isArray((progress as { completedIds?: string[] })?.completedIds) ? (progress as { completedIds: string[] }).completedIds : []);
  const prog = progress as { streak?: number; completedItems?: number; totalItems?: number; weeklyCompleted?: number; weeklyGoal?: number } | undefined;

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white relative">
      {/* Universal Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 space-y-12 max-w-7xl mx-auto">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[3rem] bg-[#030303] text-white p-10 md:p-16 shadow-2xl shadow-primary/10"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full mb-6 border border-primary/20">
                Personalized Education
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                Learning <span className="text-primary">Hub</span>
              </h1>
              <p className="text-white/40 text-lg font-medium mt-4">
                Personalized learning paths curated by AI for your specific career goals.
              </p>
            </div>
            
            <div className="flex items-center gap-3 glass-dark p-2 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="px-6 py-2">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Completed Items</div>
                <div className="text-2xl font-black text-primary leading-none mt-1">{prog?.completedItems ?? 0}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingProgress ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[2.5rem]" />) : (
            <>
              <div className="p-8 glass-light rounded-[2.5rem] border border-black/5 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-orange-500/10 text-orange-600">
                  <Flame className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">{prog?.streak ?? 0}</div>
                  <div className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">Day Streak</div>
                </div>
              </div>
              <div className="p-8 glass-light rounded-[2.5rem] border border-black/5 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-green-500/10 text-green-600">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">{prog?.completedItems ?? 0}</div>
                  <div className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">Completed</div>
                </div>
              </div>
              <div className="p-8 glass-light rounded-[2.5rem] border border-black/5 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-600">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">{prog?.totalItems ?? recs.length}</div>
                  <div className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">Total Items</div>
                </div>
              </div>
              <div className="p-8 glass-light rounded-[2.5rem] border border-black/5 flex flex-col justify-center">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-3">
                  <span>Weekly Goal</span>
                  <span>{prog?.weeklyCompleted ?? 0}/{prog?.weeklyGoal ?? 5}</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((prog?.weeklyCompleted ?? 0) / (prog?.weeklyGoal ?? 5)) * 100)}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black/5 rounded-2xl w-fit">
          {[{ id: "recommendations", label: "Recommendations" }, { id: "roadmap", label: "Career Roadmap" }].map(tab => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "h-12 px-8 rounded-xl font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-black/40 hover:text-black"
              )}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "recommendations" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingRecs ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)
            ) : recs.map((rec: any, i: number) => {
              const completed = rec.completed || completedIds.has(rec.id);
              const Icon = typeIcon[rec.type] ?? BookOpen;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className={cn(
                    "group p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative overflow-hidden h-full flex flex-col justify-between",
                    completed 
                      ? "border-green-500/20 bg-green-50/30 opacity-75" 
                      : "border-black/5 bg-white hover:bg-[#030303]"
                  )} data-testid={`card-rec-${rec.id}`}>
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                      <Icon className="w-24 h-24 text-primary" />
                    </div>

                    <div>
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          completed ? "bg-green-500/10 text-green-600" : "bg-primary/10 group-hover:bg-primary"
                        )}>
                          <Icon className={cn("w-6 h-6", completed ? "text-green-600" : "text-primary group-hover:text-white")} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {rec.isMatched && !completed && (
                            <Badge className="bg-primary text-white border-none text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary/20">
                              <Zap className="w-2 h-2" /> Skill Match
                            </Badge>
                          )}
                          <Badge variant="outline" className={cn(
                            "rounded-full uppercase tracking-widest text-[10px] font-black px-3 py-1",
                            completed ? "border-green-500/20 text-green-600" : "border-black/10 group-hover:border-white/20 group-hover:text-white"
                          )}>
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">{rec.skill}</div>
                      <h3 className="text-xl font-black mb-1 group-hover:text-white transition-colors tracking-tight leading-tight line-clamp-2">{rec.title}</h3>
                      <p className="text-black/40 font-bold text-xs mb-6 group-hover:text-white/40 transition-colors uppercase tracking-widest">{rec.provider} {rec.duration && `• ${rec.duration}`}</p>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <a href={rec.url} target="_blank" rel="noreferrer" className="flex-1">
                        <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold gap-2">
                          <ExternalLink className="w-4 h-4" /> Open
                        </Button>
                      </a>
                      {!completed && (
                        <Button 
                          variant="outline"
                          className="h-12 px-6 rounded-2xl border-black/10 group-hover:border-white/20 group-hover:text-white font-bold"
                          onClick={() => markComplete(rec.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {((roadmap as any)?.stages ?? []).map((stage: any, i: number) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-8 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden",
                  stage.completed 
                    ? "border-green-500/20 bg-green-50/30" 
                    : "border-black/5 bg-white shadow-sm hover:shadow-xl"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 border",
                    stage.completed 
                      ? "bg-green-500 text-white border-green-600" 
                      : "bg-black/5 text-black/20 border-black/5"
                  )}>
                    {stage.completed ? <CheckCircle className="w-7 h-7" /> : stage.stage}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-black tracking-tight">{stage.title}</div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {stage.skills.map((s: string) => (
                        <span key={s} className="text-[10px] font-black uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full text-black/40">{s}</span>
                      ))}
                    </div>
                  </div>
                  {!stage.completed && i > 0 && (
                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-black/20" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
