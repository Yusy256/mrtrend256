import { Link, useLocation } from "react-router-dom";
import { formatUGX } from "@/lib/currency";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ListOrdered,
  Wallet,
  Users,
  Gift,
  HelpCircle,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
  TrendingUp,
  Menu,
  X,
  UserCircle,
  Banknote,
  Sun,
  Moon,
  Bot,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import MrTrendAI from "@/components/MrTrendAI";

const userLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/new-order", icon: ShoppingCart, label: "New Order" },
  { to: "/orders", icon: ListOrdered, label: "My Orders" },
  { to: "/services", icon: Package, label: "Services" },
  { to: "/add-funds", icon: Wallet, label: "Add Funds" },
  { to: "/referrals", icon: Gift, label: "Referrals" },
  { to: "/support", icon: MessageSquare, label: "Support" },
  { to: "/faq", icon: HelpCircle, label: "FAQ" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const adminLinks = [
  { to: "/admin", icon: Shield, label: "Admin Dashboard" },
  { to: "/admin/users", icon: Users, label: "Manage Users" },
  { to: "/admin/services", icon: Package, label: "Manage Services" },
  { to: "/admin/orders", icon: ListOrdered, label: "All Orders" },
  { to: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
  { to: "/admin/promos", icon: Gift, label: "Promo Codes" },
  { to: "/admin/transactions", icon: Banknote, label: "Transactions" },
  { to: "/admin/tickets", icon: MessageSquare, label: "Support Tickets" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
};

export const AppSidebar = () => {
  const location = useLocation();
  const { isAdmin, signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const links = isAdmin && location.pathname.startsWith("/admin") ? adminLinks : userLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link to="/dashboard" className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold font-display text-gradient">Mr Trend</span>
      </Link>

      {profile && (
        <Link to="/profile" className="mx-4 mb-4 p-3 rounded-lg glass flex items-center gap-3 hover:bg-secondary/50 transition-colors">
          <Avatar className="w-9 h-9 border border-primary/30">
            <AvatarImage src={(profile as any)?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {(profile.full_name || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">Balance: <span className="text-primary font-bold">{formatUGX(profile.balance)}</span></p>
          </div>
        </Link>
      )}

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary glow-green"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 rounded-r-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="px-3 mb-2">
          <Link
            to={location.pathname.startsWith("/admin") ? "/dashboard" : "/admin"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-secondary transition-all"
          >
            <Shield className="w-5 h-5" />
            {location.pathname.startsWith("/admin") ? "User Panel" : "Admin Panel"}
          </Link>
        </div>
      )}

      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={() => { setChatOpen(true); setMobileOpen(false); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all"
        >
          <Bot className="w-5 h-5" />
          Mr Trend AI
        </button>
        <ThemeToggle />
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Mr Trend AI Chat Dialog */}
      {chatOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full max-w-md z-10">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <MrTrendAI />
          </div>
        </div>
      )}
    </>
  );
};
