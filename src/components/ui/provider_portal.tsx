"use client";

// File: src/ProviderPortalApp.tsx
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, Bell, CheckCircle2, Clock, Download, LogOut, Mail, MessageSquare, MoreVertical, Search, Star, User } from "lucide-react";

/**
 * WHY: Type safety for predictable state transitions.
 */
type Route = "login" | "dashboard" | "offers" | "messages" | "reports" | "profile";

type OfferStatus = "pending" | "accepted" | "declined";

type Offer = {
  id: string;
  projectTitle: string;
  holderName: string;
  budget: number;
  timelineMonths: number;
  technology: string;
  receivedAt: string; // ISO date
  status: OfferStatus;
  note?: string;
};

type ChatMessage = {
  id: string;
  from: "provider" | "holder";
  body: string;
  at: string; // ISO date
};

type Conversation = {
  id: string;
  holderName: string;
  holderInitials: string;
  projectTitle: string;
  lastSeenAt: string;
  messages: ChatMessage[];
};

const violet = {
  primary: "from-violet-600 via-indigo-500 to-purple-500",
  ring: "focus-visible:ring-violet-500",
  accent: "text-violet-600",
};

function fmtCurrency(n: number, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(d));
}

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function exportCSV(filename: string, rows: Array<Record<string, string | number>>) {
  // WHY: Simple offline export for stakeholders without backend yet.
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    // WHY: Minimal CSV escaping for commas/quotes/newlines.
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // WHY: Improves Firefox/Safari reliability.
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const seedOffers: Offer[] = [
  {
    id: "OF-1029",
    projectTitle: "Smart City Kiosk Network",
    holderName: "NEO Holdings",
    budget: 1850000,
    timelineMonths: 6,
    technology: "IoT Integration",
    receivedAt: "2025-08-03",
    status: "pending",
    note: "Looking for end-to-end provider with proven SLA.",
  },
  {
    id: "OF-1034",
    projectTitle: "Cloud Migration – Municipal Services",
    holderName: "Jeddah Municipality",
    budget: 2200000,
    timelineMonths: 8,
    technology: "Cloud Solutions",
    receivedAt: "2025-08-12",
    status: "accepted",
  },
  {
    id: "OF-1039",
    projectTitle: "Mobile App – Citizen Portal",
    holderName: "Najm Tech",
    budget: 640000,
    timelineMonths: 4,
    technology: "Mobile Development",
    receivedAt: "2025-08-18",
    status: "pending",
  },
  {
    id: "OF-1042",
    projectTitle: "Factory Telemetry Retrofit",
    holderName: "Al Noor Steel",
    budget: 930000,
    timelineMonths: 5,
    technology: "IoT Integration",
    receivedAt: "2025-08-22",
    status: "declined",
  },
];

const seedConversations: Conversation[] = [
  {
    id: "C-101",
    holderName: "NEO Holdings",
    holderInitials: "NH",
    projectTitle: "Smart City Kiosk Network",
    lastSeenAt: new Date().toISOString(),
    messages: [
      {
        id: "m1",
        from: "holder",
        body: "Hi, could you share rough milestones for the kiosk rollout?",
        at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "m2",
        from: "provider",
        body: "Absolutely. Drafting a 3-phase plan: survey, pilot, scale.",
        at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
  },
  {
    id: "C-102",
    holderName: "Jeddah Municipality",
    holderInitials: "JM",
    projectTitle: "Cloud Migration – Municipal Services",
    lastSeenAt: new Date().toISOString(),
    messages: [
      {
        id: "m1",
        from: "holder",
        body: "We need RTO <= 30 minutes across regions.",
        at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ],
  },
];

function Login({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email || "provider@example.com");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Provider Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={violet.ring}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={violet.ring}
              />
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
              Sign In
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({ email, onExport }: { email: string; onExport: () => void }) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Provider Portal</h1>
            <p className="text-xs text-muted-foreground">Manage offers, chat & performance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 rounded-xl border-violet-200"
            onClick={onExport}
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-violet-600 rounded-full text-[10px] text-white grid place-items-center">
                  5
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> Offer OF-1034 marked accepted
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-blue-600" /> New message from NEO Holdings
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" /> Response SLA due in 6h
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>PR</AvatarFallback>
                  <AvatarImage src="" alt="" />
                </Avatar>
                <span className="hidden md:inline text-sm">{email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ route, onRoute }: { route: Route; onRoute: (r: Route) => void }) {
  const items: Array<{ k: Route; label: string; icon: React.ReactNode }> = [
    { k: "dashboard", label: "Dashboard", icon: <BarChart2 className="h-4 w-4" /> },
    { k: "offers", label: "Offers", icon: <Mail className="h-4 w-4" /> },
    { k: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
    { k: "reports", label: "Performance", icon: <Star className="h-4 w-4" /> },
    { k: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  ];
  return (
    <aside className="hidden md:block w-64 border-r bg-white/50">
      <div className="p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Provider Portal</div>
        <nav className="space-y-1">
          {items.map((it) => (
            <button
              key={it.k}
              onClick={() => onRoute(it.k)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                route === it.k ? "bg-violet-50 text-violet-700" : "hover:bg-slate-50"
              )}
            >
              <span className={clsx("shrink-0", route === it.k && "text-violet-700")}>{it.icon}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="pb-2">
        <div className="text-xs text-muted-foreground">{title}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function DashboardPage({ offers }: { offers: Offer[] }) {
  const accepted = offers.filter((o) => o.status === "accepted").length;
  const pending = offers.filter((o) => o.status === "pending").length;
  const declined = offers.filter((o) => o.status === "declined").length;
  const total = offers.length;
  const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;

  const chartData = Array.from({ length: 10 }).map((_, i) => ({
    day: `W${i + 1}`,
    offers: Math.max(0, Math.round(5 + Math.sin(i) * 3 + (i % 3) * 1.2)),
    replies: Math.max(0, Math.round(3 + Math.cos(i) * 2)),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Offers Received" value={`${total}`} sub="Last 30 days" />
        <StatCard title="Accepted" value={`${accepted}`} sub={`${acceptanceRate}% success rate`} />
        <StatCard title="Pending" value={`${pending}`} sub="Action needed" />
        <StatCard title="Declined" value={`${declined}`} sub="Won't proceed" />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Activity (last 10 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="offers" stroke="#7c3aed" fill="url(#fillViolet)" />
                <Line type="monotone" dataKey="replies" stroke="#3730a3" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OffersPage({
  offers,
  onUpdate,
  onOpenChat,
}: {
  offers: Offer[];
  onUpdate: (id: string, next: Partial<Offer>) => void;
  onOpenChat: (holder: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OfferStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Offer | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers
      .filter((o) => (status === "all" ? true : o.status === status))
      .filter((o) =>
        !q
          ? true
          : [o.projectTitle, o.holderName, o.technology, o.id].join(" ").toLowerCase().includes(q)
      );
  }, [offers, query, status]);

  function openDetails(offer: Offer) {
    setActive(offer);
    setOpen(true);
  }

  function setStatusFor(id: string, s: OfferStatus) {
    onUpdate(id, { status: s });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="text-lg font-semibold">Offers</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search title, holder, tech, ID..."
              className={clsx("pl-8 w-72", violet.ring)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as OfferStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Offer</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Technology</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-medium">{o.id}</div>
                    <div className="text-xs text-muted-foreground">{o.holderName}</div>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">{o.projectTitle}</TableCell>
                  <TableCell>{o.technology}</TableCell>
                  <TableCell>{fmtCurrency(o.budget)}</TableCell>
                  <TableCell>{o.timelineMonths} mo</TableCell>
                  <TableCell>{fmtDate(o.receivedAt)}</TableCell>
                  <TableCell>
                    {o.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                    {o.status === "accepted" && (
                      <Badge className="bg-green-600 hover:bg-green-700">Accepted</Badge>
                    )}
                    {o.status === "declined" && (
                      <Badge className="bg-rose-600 hover:bg-rose-700">Declined</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetails(o)}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenChat(o.holderName)}>
                          Message holder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusFor(o.id, "accepted")}>
                          Accept
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFor(o.id, "declined")}>
                          Decline
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
            <DialogDescription>Review and take an action</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Offer ID</div>
                  <div className="font-medium">{active.id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Holder</div>
                  <div className="font-medium">{active.holderName}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Project</div>
                  <div className="font-medium">{active.projectTitle}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Technology</div>
                  <div className="font-medium">{active.technology}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="font-medium">{fmtCurrency(active.budget)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Timeline</div>
                  <div className="font-medium">{active.timelineMonths} months</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Received</div>
                  <div className="font-medium">{fmtDate(active.receivedAt)}</div>
                </div>
              </div>
              {active.note && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">Note</div>
                  <div className="text-sm">{active.note}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            {active && (
              <div className="flex gap-2">
                <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => onUpdate(active.id, { status: "declined" })}>
                  Decline
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => onUpdate(active.id, { status: "accepted" })}>
                  Accept
                </Button>
                <Button variant="outline" onClick={() => onOpenChat(active.holderName)}>
                  Message Holder
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessagesPage({
  conversations,
  onSend,
  selectedId,
  setSelectedId,
}: {
  conversations: Conversation[];
  onSend: (id: string, body: string) => void;
  selectedId: string | null;
  // WHY: Accept React state dispatcher to avoid type mismatch with setState.
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const current = conversations.find((c) => c.id === selectedId) ?? conversations[0];
  const [value, setValue] = useState("");
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight });
  }, [current?.messages.length]);

  function handleSend() {
    const text = value.trim();
    if (!text || !current) return;
    onSend(current.id, text);
    setValue("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-220px)]">
      <Card className="md:col-span-4 border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={clsx(
                  "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50",
                  current?.id === c.id && "bg-violet-50"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{c.holderInitials}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium">{c.holderName}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">{c.projectTitle}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-8 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> {current?.holderName}
            <span className="text-xs text-muted-foreground font-normal">• {current?.projectTitle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <div ref={viewRef} className="flex-1 overflow-auto pr-2" id="chat-scroll">
            {current?.messages.map((m) => (
              <div key={m.id} className={clsx("mb-3 flex", m.from === "provider" ? "justify-end" : "justify-start")}>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm",
                    m.from === "provider"
                      ? "bg-violet-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-900 rounded-bl-none"
                  )}
                >
                  <div>{m.body}</div>
                  <div className={clsx("text-[10px] mt-1", m.from === "provider" ? "text-violet-100" : "text-slate-500")}>{fmtDate(m.at)}</div>
                </motion.div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Write a message…"
              className={violet.ring}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSend}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsPage({ offers }: { offers: Offer[] }) {
  const revenue = offers.filter((o) => o.status === "accepted").reduce((acc, o) => acc + o.budget, 0);
  const successRate = offers.length ? Math.round((offers.filter((o) => o.status === "accepted").length / offers.length) * 100) : 0;
  const satisfaction = 4.8; // placeholder until ratings module is wired
  const avgDuration = offers.length ? (offers.reduce((acc, o) => acc + o.timelineMonths, 0) / offers.length).toFixed(1) : "0";

  const perf = Array.from({ length: 12 }).map((_, i) => ({
    month: `M${i + 1}`,
    revenue: Math.round(200 + Math.sin(i / 2) * 60 + i * 20),
  }));

  function exportPerf() {
    exportCSV("provider-performance.csv", [
      { metric: "Total Revenue", value: revenue },
      { metric: "Success Rate %", value: successRate },
      { metric: "Client Satisfaction", value: satisfaction },
      { metric: "Avg Project Duration (mo)", value: Number(avgDuration) },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={fmtCurrency(revenue)} sub="+12% from last month" />
        <StatCard title="Project Success Rate" value={`${successRate}%`} sub="+2% from last month" />
        <StatCard title="Client Satisfaction" value={`${satisfaction}/5`} sub="Based on recent reviews" />
        <StatCard title="Avg. Project Duration" value={`${avgDuration} months`} sub="-0.3 mo improvement" />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Revenue (12 months)</CardTitle>
          <Button variant="outline" onClick={exportPerf} className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Legal Name</div>
            <div className="font-medium">Modern Builders Co.</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Primary Tech</div>
            <div className="font-medium">IoT Integration, Cloud Solutions</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="font-medium">provider@example.com • +966 55 555 5555</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge className="bg-violet-600">Top Rated</Badge>
          <Badge className="bg-indigo-600">ISO 27001</Badge>
          <Badge className="bg-emerald-600">SLA 99.9%</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProviderPortalApp() {
  const [route, setRoute] = useState<Route>("login");
  const [email, setEmail] = useState<string>("");
  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem("pp_offers") : null;
      return cached ? (JSON.parse(cached) as Offer[]) : seedOffers;
    } catch {
      return seedOffers;
    }
  });
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem("pp_conversations") : null;
      return cached ? (JSON.parse(cached) as Conversation[]) : seedConversations;
    } catch {
      return seedConversations;
    }
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    (conversations && conversations[0]?.id) ?? null
  );

  useEffect(() => {
    localStorage.setItem("pp_offers", JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem("pp_conversations", JSON.stringify(conversations));
  }, [conversations]);

  function handleLogin(e: string) {
    setEmail(e);
    setRoute("dashboard");
  }

  function updateOffer(id: string, next: Partial<Offer>) {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...next } : o)));
  }

  function openChatFor(holderName: string) {
    const conv = conversations.find((c) => c.holderName === holderName);
    if (conv) {
      setSelectedConversationId(conv.id);
      setRoute("messages");
    }
  }

  function sendMessage(convId: string, body: string) {
    // WHY: Simple optimistic update; backend socket can replace later.
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      from: "provider",
      body,
      at: new Date().toISOString(),
    };
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, msg] } : c)));
  }

  function exportAll() {
    const rows = offers.map((o) => ({
      id: o.id,
      project: o.projectTitle,
      holder: o.holderName,
      tech: o.technology,
      budget: o.budget,
      months: o.timelineMonths,
      received: o.receivedAt,
      status: o.status,
    }));
    exportCSV("offers.csv", rows);
  }

  if (route === "login") return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-900">
      <Header email={email} onExport={exportAll} />
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3 lg:col-span-2">
          <Sidebar route={route} onRoute={setRoute} />
        </div>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {route === "dashboard" && <DashboardPage offers={offers} />}
          {route === "offers" && <OffersPage offers={offers} onUpdate={updateOffer} onOpenChat={openChatFor} />}
          {route === "messages" && (
            <MessagesPage
              conversations={conversations}
              onSend={sendMessage}
              selectedId={selectedConversationId}
              setSelectedId={setSelectedConversationId}
            />
          )}
          {route === "reports" && <ReportsPage offers={offers} />}
          {route === "profile" && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}
