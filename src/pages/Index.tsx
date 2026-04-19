import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, Zap, Shield, Users, ArrowRight, Star } from "lucide-react";

const platforms = [
  { name: "TikTok", emoji: "🎵", color: "from-pink-500 to-red-500" },
  { name: "Instagram", emoji: "📸", color: "from-purple-500 to-pink-500" },
  { name: "YouTube", emoji: "🎬", color: "from-red-500 to-red-600" },
  { name: "Twitter", emoji: "🐦", color: "from-blue-400 to-blue-500" },
  { name: "Facebook", emoji: "📘", color: "from-blue-500 to-blue-600" },
  { name: "Telegram", emoji: "✈️", color: "from-cyan-400 to-blue-500" },
];

const features = [
  { icon: Zap, title: "Instant Delivery", desc: "Orders start within minutes" },
  { icon: Shield, title: "Secure & Safe", desc: "Your accounts stay protected" },
  { icon: Users, title: "Real Engagement", desc: "Quality followers and views" },
  { icon: Star, title: "24/7 Support", desc: "We're always here to help" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-primary">Mr Trend</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> #1 SMM Panel
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-tight mb-6">
              Grow Your
              <br />
              <span className="text-primary">Social Media</span>
              <br />
              Presence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Get real followers, views, likes, and engagement for TikTok, Instagram, YouTube, and more. Fast delivery, affordable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground font-semibold px-8 h-13 text-lg">
                  Start Growing <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-border hover:border-primary/50 px-8 h-13 text-lg">
                  View Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
            Supported Platforms
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {platforms.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-all cursor-pointer"
              >
                <span className="text-3xl block mb-2">{p.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Why <span className="text-primary">Mr Trend</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We provide the best social media marketing services at the most competitive prices
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className="glass rounded-xl p-6 text-center hover:border-primary/30 transition-all h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-8 md:p-12 border-primary/20">
            <h2 className="text-3xl font-bold font-display mb-4">
              Ready to <span className="text-accent">Go Viral</span>?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators and businesses growing their social media with Mr Trend
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground font-semibold px-8">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-primary">Mr Trend</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mr Trend. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
