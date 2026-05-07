import { useState } from "react";
import { useListJobs, useGetJobMatches } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/api";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Briefcase, MapPin, Users, Zap, Star, Bookmark, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const jobTypes = [
  { value: "", label: "All Types" },
  { value: "job", label: "Full-time" },
  { value: "internship", label: "Internship" },
  { value: "hackathon", label: "Hackathon" },
  { value: "freelance", label: "Freelance" },
];

function MatchBar({ score }: { score?: number }) {
  if (!score) return null;
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
      <Zap className="w-3 h-3 text-[#0A2540] flex-shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-1">
        <div className={cn("h-1 rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{score}% match</span>
    </div>
  );
}

interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  location?: string;
  salary?: string;
  deadline?: string;
  skills: string[];
  applicantCount: number;
  bannerImage?: string;
  logo?: string;
  rating?: number;
  ratingCount?: number;
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const headers = getAuthHeaders();

  const { data: jobsData, isLoading } = useListJobs({ type: type || undefined, search: search || undefined }, {
    request: { headers },
  });

  const { data: matches } = useGetJobMatches({
    request: { headers },
  });

  const matchMap = Array.isArray(matches)
    ? Object.fromEntries(matches.map((m: { job: { id: string }; matchScore: number }) => [m.job.id, m.matchScore]))
    : {};

  const jobs = [...((jobsData as { jobs?: Job[] })?.jobs ?? [])].sort((a, b) => {
    const scoreA = matchMap[a.id] ?? 0;
    const scoreB = matchMap[b.id] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] selection:bg-primary selection:text-white relative">
      <div className="relative z-10 p-8 space-y-12 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#0A2540]">Top employers</h1>
          <p className="text-gray-500 text-base">Explore the best graduate employers in India</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by role, company, or keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-200 bg-white focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {jobTypes.map(t => (
              <Button
                key={t.value}
                variant={type === t.value ? "default" : "outline"}
                className={cn(
                  "h-12 px-6 rounded-xl font-semibold transition-all whitespace-nowrap",
                  type === t.value 
                    ? "bg-[#0A2540] text-white" 
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                )}
                onClick={() => setType(t.value)}
                data-testid={`filter-type-${t.value || "all"}`}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Job grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[420px] rounded-2xl" />)
          ) : (jobs as Job[]).map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full"
            >
              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Logo */}
                <div className="mb-6">
                  <div className="w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-100 p-2 flex items-center justify-center overflow-hidden">
                    <img 
                      src={job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} 
                      alt={`${job.company} logo`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-[#0A2540] text-xl font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {job.company}
                  </h3>
                  <p className="text-gray-500 text-sm font-medium line-clamp-1">{job.title}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-6">
                  <span className="bg-[#0A2540] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    {job.rating || 4.5}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < Math.floor(job.rating || 4.5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                    ))}
                  </div>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3 h-3" />
                    {job.location?.split(',')[0] || "India"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                    <Users className="w-3 h-3" />
                    {job.applicantCount}
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex gap-2">
                    <Button 
                      asChild
                      className="flex-1 bg-[#0A2540] hover:bg-[#1a3a5a] text-white text-xs font-bold h-9 rounded-lg transition-all"
                    >
                      <Link href={`/jobs/${job.id}`}>Apply Now</Link>
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-[#0A2540] text-[#0A2540] hover:bg-gray-50 text-xs font-bold h-9 rounded-lg transition-all"
                    >
                      Add a review
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold h-9 rounded-lg gap-2"
                    >
                      Save <Bookmark className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <MatchBar score={matchMap[job.id]} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!isLoading && jobs.length === 0 && (
          <div className="text-center py-24 bg-white rounded-2xl border-dashed border-2 border-gray-200">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-[#0A2540] mb-2">No matching positions found</h3>
            <p className="text-gray-500">Try broadening your search or updating your skill profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
