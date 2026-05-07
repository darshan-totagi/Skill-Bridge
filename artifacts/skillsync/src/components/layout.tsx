import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useListNotifications, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/api";
import {
  LayoutDashboard, Briefcase, ClipboardList, BookOpen, FileText,
  TrendingUp, Code2, GraduationCap, Bell, Trophy, Users, User,
  LogOut, Menu, X, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs & Internships", icon: Briefcase },
  { href: "/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/learning", label: "Learning Hub", icon: BookOpen },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/career", label: "Career Track", icon: TrendingUp },
  { href: "/freelance", label: "Freelance", icon: Code2 },
  { href: "/college/forms", label: "College Forms", icon: GraduationCap },
  { href: "/college/announcements", label: "Announcements", icon: Bell },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin", label: "Admin", icon: Users, roles: ["admin"] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const { data: notifications } = useListNotifications({
    request: { headers: getAuthHeaders() },
    query: { queryKey: getListNotificationsQueryKey() },
  });

  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: { read: boolean }) => !n.read).length : 0;

  const filteredNav = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role ?? "");
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#030303] flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 border-r border-white/5",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-8 py-10">
          <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-white font-black text-xl tracking-tighter leading-none">SkillSync<span className="text-primary">.ai</span></div>
              <div className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mt-1">Enterprise v2.0</div>
            </div>
          </Link>
        </div>

        {/* User Status Card */}
        <div className="px-6 mb-8">
          <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-sm border border-primary/10">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-black truncate tracking-tight">{user?.name}</div>
                <div className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">{user?.role?.replace("_", " ")}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
                <span>Platform XP</span>
                <span>Lv.{user?.level}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((user?.xp ?? 0) % 500) / 5)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] px-4 mb-4">Core Systems</div>
          {filteredNav.map(item => {
            const active = location === item.href || location.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  data-testid={`nav-${item.href.replace(/\//g, "-").slice(1)}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group relative overflow-hidden",
                    active
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active ? "text-white" : "text-white/50 group-hover:text-primary")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.href === "/college/announcements" && unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] rounded-full px-2 py-0.5 font-black">{unreadCount}</span>
                  )}
                  {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-2 mt-auto">
          <Link href="/profile">
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/10 transition-all group">
              <User className="w-4 h-4 text-white/50 group-hover:text-primary" />
              Profile Settings
            </button>
          </Link>
          <button
            onClick={logout}
            data-testid="button-logout"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group"
          >
            <LogOut className="w-4 h-4 text-red-500/20 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top bar */}
        <header className="flex items-center gap-6 px-8 h-20 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <button
            className="lg:hidden text-black/40 hover:text-black transition-colors"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/30">System Operational</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-black/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-black">{user?.xp ?? 0} <span className="text-black/20">XP</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-black">{user?.streak ?? 0} <span className="text-black/20">STREAK</span></span>
              </div>
            </div>
            
            <button className="relative p-2 rounded-xl hover:bg-black/5 transition-colors">
              <Bell className="w-5 h-5 text-black/40" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
