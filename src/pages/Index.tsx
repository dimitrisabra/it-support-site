import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Bot, Shield, BarChart3, Zap, MessageSquare, BookOpen, ArrowRight, CheckCircle, Star, Users, Clock, Globe, Sparkles, Lock, TrendingUp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const features = [
  { icon: Bot, title: "AI-Powered Responses", desc: "Intelligent answers from your knowledge base, improving over time with real streaming." },
  { icon: BookOpen, title: "Knowledge Base", desc: "Build and manage FAQs. The AI learns from every addition instantly." },
  { icon: MessageSquare, title: "Live Chat Monitoring", desc: "View all conversations in real-time, intervene when needed." },
  { icon: Shield, title: "Escalation System", desc: "Users escalate to humans. Admins respond with personal touch." },
  { icon: BarChart3, title: "Smart Analytics", desc: "Track common questions, AI accuracy, and user engagement with charts." },
  { icon: Zap, title: "Self-Improving", desc: "Unresolved questions feed back into the knowledge base automatically." },
];

const howItWorks = [
  { step: "1", title: "User asks a question", desc: "Through the beautiful chat interface with real-time AI streaming." },
  { step: "2", title: "AI searches knowledge base", desc: "Finds the best answer from your curated FAQ library." },
  { step: "3", title: "Admin reviews & improves", desc: "Monitors chats, adds missing answers, improves existing ones." },
  { step: "4", title: "AI gets smarter", desc: "Every improvement makes future responses more accurate." },
];

const testimonials = [
  { name: "Sarah M.", role: "Head of Support", text: "Cut our response time by 80%. The self-improving loop is genius.", stars: 5 },
  { name: "James K.", role: "CTO", text: "Finally an AI support tool that actually gets better over time. Impressed.", stars: 5 },
  { name: "Priya L.", role: "Product Manager", text: "The admin dashboard gives us insights we never had. Game changer.", stars: 5 },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started",
    features: ["100 AI conversations/mo", "Basic knowledge base", "Chat history", "Email support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "For growing teams",
    features: ["Unlimited conversations", "Advanced analytics", "Priority escalations", "Saved replies", "Custom AI tone", "CSV/JSON export"],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    desc: "Full platform control",
    features: ["Everything in Pro", "Multi-admin support", "API access", "Custom integrations", "SLA guarantee", "Dedicated support", "White-label option"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const faqs = [
  { q: "How does the AI improve over time?", a: "When admins add or update knowledge base entries, the AI immediately incorporates these into future responses. Unresolved conversations are flagged so admins can fill knowledge gaps." },
  { q: "Can I export my conversation data?", a: "Yes! Users can export individual chats as markdown files. Admins can export the entire knowledge base as CSV or JSON for backup and analysis." },
  { q: "What happens when the AI can't answer?", a: "Users can escalate to a human agent with one click. Admins receive real-time notifications and can respond directly in the conversation." },
  { q: "Is my data secure?", a: "Absolutely. All data is encrypted, role-based access control ensures users only see their own data, and admins have full audit logs of all system activity." },
  { q: "Can I customize the AI's personality?", a: "Yes. Admins can configure the system prompt, response tone (formal, friendly, concise, empathetic), and maximum response length from the settings page." },
];

const Counter = ({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-heading font-extrabold text-foreground">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const smoothScroll = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">SupportAI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => smoothScroll("features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => smoothScroll("how-it-works")} className="hover:text-foreground transition-colors">How it Works</button>
            <button onClick={() => smoothScroll("pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => smoothScroll("faq")} className="hover:text-foreground transition-colors">FAQ</button>
            <Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link>
            <Link to="/status" className="hover:text-foreground transition-colors">Status</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-glow)" }} />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Self-Improving AI Support Platform</span>
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="text-foreground">Support that gets</span>
              <br />
              <span className="gradient-text">smarter every day</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              AI-powered customer support that learns from every interaction.
              Admins improve knowledge, AI becomes smarter, users get better answers.
            </p>
            <div className="flex items-center justify-center gap-4 mb-12">
              <Link to="/login">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow px-8 h-12 text-base font-semibold">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-border hover:bg-secondary h-12 px-8 text-base">
                  View Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Setup in 2 min</span>
            </div>
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl mx-auto mt-16"
          >
            <div className="glass rounded-2xl border border-border/50 p-1 card-shadow">
              <div className="bg-card rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">SupportAI Chat</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-3 w-3 text-primary" /></div>
                    <div className="bg-secondary rounded-xl rounded-bl-md px-3 py-2 text-sm text-secondary-foreground">Hi! How can I help you today? 👋</div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-primary rounded-xl rounded-br-md px-3 py-2 text-sm text-primary-foreground">How do I reset my password?</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-3 w-3 text-primary" /></div>
                    <div className="bg-secondary rounded-xl rounded-bl-md px-3 py-2 text-sm text-secondary-foreground">
                      Go to <strong>Settings → Security → Reset Password</strong>. You'll receive a confirmation email within 30 seconds. ✨
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Counter end={10000} label="Messages Handled" suffix="+" />
            <Counter end={98} label="Resolution Rate" suffix="%" />
            <Counter end={500} label="Happy Users" suffix="+" />
            <Counter end={80} label="Time Saved" suffix="%" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-medium text-primary mb-2 block">POWERFUL FEATURES</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything you need for <span className="gradient-text">intelligent support</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A complete platform where admin improvements cascade into better AI responses for every user.
              </p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className="glass-hover rounded-xl p-6 card-shadow group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-card/30 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-medium text-primary mb-2 block">HOW IT WORKS</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                The <span className="gradient-text">self-improving</span> loop
              </h2>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-heading font-bold text-lg">
                  {item.step}
                </div>
                {i < 3 && <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-border" />}
                <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><Globe className="h-5 w-5 text-success" /></div>
                <h3 className="font-heading font-bold text-lg text-foreground">For Users</h3>
              </div>
              <ul className="space-y-3">
                {["Instant AI-powered answers", "Real-time streaming responses", "Chat history & search", "Escalate to human agents", "Thumbs up/down feedback", "Pin & export conversations", "Dark/light theme", "Satisfaction ratings"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Lock className="h-5 w-5 text-primary" /></div>
                <h3 className="font-heading font-bold text-lg text-foreground">For Admins</h3>
              </div>
              <ul className="space-y-3">
                {["Real-time analytics dashboard", "Knowledge base CRUD & import/export", "Chat monitoring & intervention", "Escalation management", "User suspend/activate", "Saved replies templates", "AI behavior configuration", "Activity logs & notifications"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-card/30 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-medium text-primary mb-2 block">PRICING</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Simple, <span className="gradient-text">transparent</span> pricing
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">Start free, upgrade when you need more power.</p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 border ${
                  plan.highlighted
                    ? "border-primary bg-primary/5 glow relative"
                    : "border-border glass"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading font-bold text-lg text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-heading font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-medium text-primary mb-2 block">TESTIMONIALS</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Loved by teams worldwide</h2>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-card/30 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-medium text-primary mb-2 block">FAQ</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Frequently asked <span className="gradient-text">questions</span>
              </h2>
            </motion.div>
          </div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-xl border-border px-6">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="glass rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-glow)" }} />
            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
                <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Ready to transform your support?</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Join the platform where every answered question makes your AI smarter. Start free, scale as you grow.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link to="/login">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow px-8">
                      Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-foreground">SupportAI</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered support that gets smarter every day.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => smoothScroll("features")} className="hover:text-foreground transition-colors">Features</button></li>
                <li><button onClick={() => smoothScroll("pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => smoothScroll("faq")} className="hover:text-foreground transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2026 SupportAI. Built with intelligence.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
