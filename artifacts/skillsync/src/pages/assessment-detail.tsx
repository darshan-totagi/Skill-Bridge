import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetAssessment, useSubmitAssessment, getGetAssessmentQueryKey, getListAssessmentResultsQueryKey, getGetUserCertificationsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, Trophy, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Question = { id: string; text: string; options: string[]; type: string };
type Answer = { questionId: string; answer: string };

export default function AssessmentDetail() {
  const [, params] = useRoute("/assessments/:id");
  const id = params?.id ?? "0";
  const [, setLocation] = useLocation();
  const headers = getAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; flagged?: boolean; certificate?: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const { data: assessment, isLoading } = useGetAssessment(id, {
    request: { headers },
  });

  const submitMutation = useSubmitAssessment();

  const assessData = assessment as { id: string; title: string; category: string; type: string; difficulty: string; duration: number; questionCount: number; questions: Question[] } | undefined;

  useEffect(() => {
    if (started) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          setFlagged(true);
          toast({
            title: "Security Violation Flagged",
            description: "Tab switching detected. This incident has been recorded and a certificate will not be issued.",
            variant: "destructive",
          });
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }, [started]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started]);

  function startAssessment() {
    setStarted(true);
    setTimeLeft((assessData?.duration ?? 30) * 60);
    setCurrentQ(0);
    setAnswers([]);
  }

  function selectAnswer(questionId: string, answer: string) {
    setAnswers(prev => {
      const without = prev.filter(a => a.questionId !== questionId);
      return [...without, { questionId, answer }];
    });
  }

  function handleSubmit() {
    clearInterval(timerRef.current);
    submitMutation.mutate({ id, data: { answers, flagged } }, {
      onSuccess: (res: any) => {
        setResult(res);
        queryClient.invalidateQueries({ queryKey: getListAssessmentResultsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getGetUserCertificationsQueryKey(undefined as any) });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({ title: "Submission failed", variant: "destructive" });
      },
    });
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeWarning = timeLeft < 120;

  if (isLoading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48" />
    </div>
  );

  if (!assessData) return <div className="p-6 text-muted-foreground">Assessment not found.</div>;

  // Result screen
  if (result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Result Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-[3rem] p-10 md:p-16 text-center shadow-2xl mb-10",
            result.passed ? "bg-green-600 text-white shadow-green-500/20" : "bg-[#030303] text-white shadow-primary/10"
          )}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 space-y-6">
            <div className={cn(
              "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl",
              result.passed ? "bg-white text-green-600" : "bg-white/10 text-white"
            )}>
              {result.passed ? <Trophy className="w-12 h-12" /> : <CheckCircle className="w-12 h-12" />}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-6xl font-black tracking-tighter leading-none">{result.score}%</h1>
              <p className="text-xl font-black uppercase tracking-widest opacity-80">
                {result.flagged ? "Flagged: Violation Detected" : result.passed ? "Assessment Passed" : "Keep Improving"}
              </p>
            </div>

            <p className="text-sm font-medium max-w-md mx-auto opacity-70">
              {result.flagged
                ? "A security violation (tab switching) was detected during your assessment. Your score has been recorded, but no certificate will be issued."
                : result.passed 
                  ? `Incredible work! You've successfully validated your expertise in ${assessData.title}.` 
                  : `You need a score of 60% or higher to earn your certification. Take some time to review and try again.`}
            </p>
          </div>
        </motion.div>

        {/* Certificate Section */}
        {result.passed && !result.flagged && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-10 glass-light rounded-[3rem] border border-black/5 mb-10 text-center space-y-8"
          >
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Credential Issued</div>
              <h3 className="text-2xl font-black tracking-tight">Your Digital Certificate</h3>
            </div>

            <div className="relative aspect-[1.414/1] bg-white border-8 border-black/5 rounded-2xl shadow-xl p-8 flex flex-col justify-between overflow-hidden group">
              <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl">S</div>
                <div className="text-right">
                  <div className="text-[8px] font-black uppercase tracking-widest text-black/30">Certificate ID</div>
                  <div className="text-[10px] font-bold font-mono">{result.certificate}</div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary">Certificate of Excellence</div>
                <h4 className="text-3xl font-black tracking-tighter leading-tight">{assessData.title} Professional</h4>
                <p className="text-xs font-medium text-black/40">This verifies that the candidate has successfully completed the required assessment with a passing grade.</p>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div className="text-left">
                  <div className="text-[8px] font-black uppercase tracking-widest text-black/30">Issued By</div>
                  <div className="text-sm font-black">SkillSync.ai</div>
                </div>
                <div className="w-16 h-16 opacity-10">
                  <Trophy className="w-full h-full" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/profile" className="flex-1">
                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-[#030303] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 gap-2">
                  View in Profile <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href={`/api/assessments/certificate/${(result as any).id}`} target="_blank" className="flex-1">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-all">
                  View Certificate
                </Button>
              </a>
            </div>
          </motion.div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/assessments">
            <Button variant="ghost" className="h-12 px-8 rounded-full font-black uppercase tracking-widest text-[10px] text-black/40 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Assessments
            </Button>
          </Link>
          {!result.passed && (
            <Button onClick={() => setResult(null)} className="h-12 px-8 rounded-full bg-black text-white font-black uppercase tracking-widest text-[10px]">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Intro screen
  if (!started) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/assessments">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </Link>
        <div className="p-8 border border-border rounded-lg bg-card text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{assessData.title}</h1>
          <p className="text-muted-foreground mb-6">{assessData.category} • {assessData.type.toUpperCase()}</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Questions", value: (assessData.questions as Question[])?.length ?? assessData.questionCount },
              { label: "Duration", value: `${assessData.duration} min` },
              { label: "Pass Score", value: "60%" },
            ].map(stat => (
              <div key={stat.label} className="p-3 bg-secondary rounded-lg">
                <div className="text-lg font-bold font-mono">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          <Button onClick={startAssessment} size="lg" className="gap-2" data-testid="button-start-assessment">
            Start Assessment <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Quiz screen
  const questions = (assessData.questions as Question[]) ?? [];
  const currentQuestion = questions[currentQ];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id)?.answer;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Timer & progress bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
        </div>
        <div className={cn("flex items-center gap-1.5 font-mono text-sm font-bold", timeWarning ? "text-red-500" : "text-foreground")}>
          <Clock className="w-4 h-4" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-1.5 mb-6">
        <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="p-6 border border-border rounded-lg bg-card mb-4"
        >
          <h2 className="font-semibold mb-5 leading-relaxed" data-testid={`question-${currentQ}`}>{currentQuestion?.text}</h2>
          <div className="space-y-2">
            {currentQuestion?.options?.map((opt: string) => (
              <button
                key={opt}
                onClick={() => selectAnswer(currentQuestion.id, opt)}
                data-testid={`option-${opt.slice(0, 10).replace(/\s/g, "-")}`}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                  currentAnswer === opt
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/40 hover:bg-secondary"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="gap-1" data-testid="button-prev">
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        {currentQ < questions.length - 1 ? (
          <Button onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))} className="gap-1" data-testid="button-next">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitMutation.isPending} data-testid="button-submit-assessment">
            {submitMutation.isPending ? "Submitting..." : "Submit Assessment"}
          </Button>
        )}
      </div>
    </div>
  );
}
