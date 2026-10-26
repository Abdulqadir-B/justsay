import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Linkedin,
  Mail,
  Mic,
  QrCode,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo.jsx";
import { createClient } from "../lib/supabase.js";

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

const faqs = [
  {
    question: "How do customers leave a voice review?",
    answer:
      "Customers scan your QR code or open your review link, then record a quick voice message without filling out a long form.",
  },
  {
    question: "How long can a review be?",
    answer:
      "JustSay is designed for focused five-second voice reviews that are easy for customers to leave and easy for businesses to review.",
  },
  {
    question: "What can I see in the business dashboard?",
    answer:
      "The dashboard brings together voice reviews, sentiment analysis, keywords, star ratings, and real-time review activity.",
  },
];

export default function LandingPage() {
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(Boolean(data.user))
    })
  }, [])

  const accountPath = isSignedIn ? "/dashboard" : "/login"
  const accountLabel = isSignedIn ? "Dashboard" : "Sign in"

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo size="md" />
        </Link>
        <Link to={accountPath} className="btn-ghost px-3 py-2 text-xs">
          {accountLabel}
        </Link>
      </nav>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28">
        <div className="pointer-events-none absolute -right-32 top-8 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
            Voice feedback for customer-focused businesses
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Let customers just say what they think.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Collect honest voice reviews in seconds, then turn every
            conversation into a clear view of your customer experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={accountPath} className="btn-primary gap-2 px-5 py-3">
              {isSignedIn ? "Open dashboard" : "Start collecting reviews"}
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

        <div className="relative mt-24 grid gap-12 border-t border-zinc-900 pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Voice review software
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Better customer feedback starts with less friction.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-500 sm:text-base">
              JustSay gives businesses a simple way to collect authentic customer
              feedback and spot patterns without asking people to write a long survey.
            </p>
          </div>

          <div className="divide-y divide-zinc-900">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group py-5 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium text-zinc-200 marker:hidden">
                  {question}
                  <span className="text-lg font-light text-zinc-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-xl pr-8 text-sm leading-6 text-zinc-500">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-zinc-500">
            Built by <span className="font-medium text-zinc-300">Abdul Qadir Bearingwala</span>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://linkedin.com/in/abdulqadir-bearingwala"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </a>
            <a
              href="mailto:abdulqadirworkstudio@gmail.com"
              className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Mail className="h-3.5 w-3.5" />
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
