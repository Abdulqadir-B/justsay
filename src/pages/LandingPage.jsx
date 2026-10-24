import { Link } from "react-router-dom";
import { ArrowRight, AudioLines, BarChart3, Mic, QrCode } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Share one simple link",
    text: "Put your review link on a counter, receipt, or QR code.",
  },
  {
    icon: Mic,
    title: "Hear what customers mean",
    text: "Customers can leave a quick voice review without typing a form.",
  },
  {
    icon: BarChart3,
    title: "See the signal instantly",
    text: "Track sentiment, ratings, and recurring themes from one dashboard.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100">
            <AudioLines className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">
            JustSay
          </span>
        </Link>
        <Link to="/login" className="btn-ghost px-3 py-2 text-xs">
          Sign in
        </Link>
      </nav>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28">
        <div className="pointer-events-none absolute -right-32 top-8 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
            Voice feedback for local businesses
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Let customers just say what they think.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Collect honest voice reviews in seconds, then turn every
            conversation into a clear view of your customer experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary gap-2 px-5 py-3">
              Start collecting reviews
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary px-5 py-3">
              See how it works
            </a>
          </div>
        </div>

        <div
          className="relative mt-16 grid gap-4 sm:grid-cols-3"
          id="how-it-works"
        >
          {steps.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="border-t border-zinc-800 pt-5">
              <div className="mb-5 flex items-center justify-between">
                <Icon className="h-5 w-5 text-emerald-400" />
                <span className="font-mono text-xs text-zinc-600">
                  0{index + 1}
                </span>
              </div>
              <h2 className="text-sm font-medium text-zinc-100">{title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
