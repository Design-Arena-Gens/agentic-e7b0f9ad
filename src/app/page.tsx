import { WorkflowBuilder } from "@/components/workflow-builder";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black py-16 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:px-12">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400/80">
            Viral Engine
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            AI workflow for Instagram-first campaigns that syndicate everywhere.
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Generate hooks, scripts, format-specific captions, and publishing
            payloads pre-wired to Instagram Graph API, YouTube Shorts, Facebook
            Reels, Threads, and Pinterest. Built to ship directly from Vercel.
          </p>
        </header>
        <WorkflowBuilder />
      </div>
    </main>
  );
}
