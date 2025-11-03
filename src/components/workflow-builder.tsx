'use client';

import { useMemo, useState } from 'react';

type Platform =
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'threads'
  | 'pinterest';

type WorkflowResponse = {
  campaign: {
    title: string;
    summary: string;
    hooks: string[];
  };
  production: {
    masterScript: string;
    storyboard: string[];
    audioPrompts: string[];
    editingNotes: string[];
  };
  assets: Array<{
    id: string;
    platform: Platform;
    assetType: string;
    caption: string;
    hashtags: string[];
    scheduleTime: string;
    callToAction: string;
    optimizations: string[];
  }>;
  automations: Array<{
    platform: Platform;
    endpoint: string;
    status: 'queued' | 'ready';
    payloadPreview: Record<string, unknown>;
  }>;
};

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube Shorts' },
  { value: 'facebook', label: 'Facebook Reels' },
  { value: 'threads', label: 'Threads' },
  { value: 'pinterest', label: 'Pinterest' },
];

const DEFAULT_FORM = {
  campaignName: '',
  niche: '',
  persona: '',
  brandVoice: 'Bold, high-energy with clear calls to action.',
  offer: '',
  keywords: '',
  platforms: PLATFORM_OPTIONS.map((p) => p.value) as Platform[],
  primaryAsset: 'vertical-video',
  variations: 3,
  scheduleDate: '',
  autoPublish: true,
  referenceLinks: '',
};

export function WorkflowBuilder() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<WorkflowResponse | null>(null);

  const scheduleLabel = useMemo(() => {
    if (!form.scheduleDate) {
      return 'Schedule date & time (ISO8601, e.g. 2024-07-01T15:30)';
    }
    return `Publish starting ${form.scheduleDate}`;
  }, [form.scheduleDate]);

  const handleInputChange = <
    Key extends keyof typeof DEFAULT_FORM,
    Value = (typeof DEFAULT_FORM)[Key],
  >(
    key: Key,
    value: Value,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlatform = (value: Platform) => {
    setForm((prev) => {
      const selected = new Set(prev.platforms);
      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }
      return { ...prev, platforms: Array.from(selected) as Platform[] };
    });
  };

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Workflow generation failed');
      }

      const data = (await res.json()) as WorkflowResponse;
      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate workflow. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 shadow-xl ring-1 ring-slate-800/50">
        <header className="mb-8 space-y-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400/80">
            AI Campaign Orchestrator
          </span>
          <h1 className="text-3xl font-semibold text-white">
            Launch viral Instagram-first campaigns
          </h1>
          <p className="text-sm text-slate-400">
            Feed the agent a campaign brief and it will generate platform-native
            assets, schedule posts, and queue cross-platform automations.
          </p>
        </header>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Campaign name
            </label>
            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.campaignName}
              placeholder="Eg. 7-Day Gut Health Reset"
              onChange={(event) =>
                handleInputChange('campaignName', event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Niche / category focus
            </label>
            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.niche}
              placeholder="Example: Holistic wellness, AI tools, daily vlogs"
              onChange={(event) => handleInputChange('niche', event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Hero offer or product
            </label>
            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.offer}
              placeholder="Explain the hook or product that will be promoted"
              onChange={(event) =>
                handleInputChange('offer', event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Audience persona
            </label>
            <textarea
              className="min-h-[72px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.persona}
              placeholder="Describe the ideal viewer including pain points, aspirational goals, and purchase triggers."
              onChange={(event) =>
                handleInputChange('persona', event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Brand voice
            </label>
            <textarea
              className="min-h-[72px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.brandVoice}
              onChange={(event) =>
                handleInputChange('brandVoice', event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Keywords & hashtags
            </label>
            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.keywords}
              placeholder="#guthealth, #morningroutine, #microbiome"
              onChange={(event) =>
                handleInputChange('keywords', event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Reference links (optional)
            </label>
            <textarea
              className="min-h-[72px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.referenceLinks}
              placeholder="Paste research sources, prior top performing posts, or inspiration links."
              onChange={(event) =>
                handleInputChange('referenceLinks', event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Core platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(({ value, label }) => {
                const active = form.platforms.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => togglePlatform(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 md:gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Primary asset
              </label>
              <select
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={form.primaryAsset}
                onChange={(event) =>
                  handleInputChange('primaryAsset', event.target.value)
                }
              >
                <option value="vertical-video">Vertical video</option>
                <option value="carousel">Carousel</option>
                <option value="static-image">Static hero image</option>
                <option value="script-only">Script + caption pack</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Variations
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={form.variations}
                onChange={(event) =>
                  handleInputChange('variations', Number(event.target.value))
                }
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Auto publish
              </label>
              <button
                type="button"
                onClick={() =>
                  handleInputChange('autoPublish', !form.autoPublish)
                }
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  form.autoPublish
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {form.autoPublish ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              {scheduleLabel}
            </label>
            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={form.scheduleDate}
              placeholder="2024-07-01T15:30"
              onChange={(event) =>
                handleInputChange('scheduleDate', event.target.value)
              }
            />
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={submit}
            className="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isSubmitting ? 'Generating...' : 'Generate workflow'}
          </button>

          {error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="min-h-full rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-inner ring-1 ring-emerald-500/20">
        {response ? (
          <WorkflowPreview response={response} />
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
      <div className="rounded-full border border-slate-800 bg-slate-900 p-4 text-emerald-300">
        ⟳
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">
          Awaiting your brief
        </h2>
        <p className="text-sm">
          Generate platform-native scripts, captions, and auto-post payloads in
          one click.
        </p>
      </div>
    </div>
  );
}

function WorkflowPreview({ response }: { response: WorkflowResponse }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pr-2">
      <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Campaign blueprint
        </h2>
        <h3 className="text-xl font-semibold text-white">
          {response.campaign.title}
        </h3>
        <p className="text-sm text-slate-300">{response.campaign.summary}</p>
        <ul className="grid gap-2 pt-3">
          {response.campaign.hooks.map((hook) => (
            <li
              key={hook}
              className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
            >
              {hook}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Production assets
        </h2>
        <article className="grid gap-3 text-sm text-slate-200">
          <div>
            <h3 className="font-semibold uppercase tracking-wide text-xs text-slate-400">
              Master script
            </h3>
            <p className="whitespace-pre-line rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              {response.production.masterScript}
            </p>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold uppercase tracking-wide text-xs text-slate-400">
              Storyboard
            </h3>
            <ol className="grid gap-2">
              {response.production.storyboard.map((frame, index) => (
                <li
                  key={frame}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"
                >
                  <span className="text-xs font-semibold text-emerald-300">
                    Scene {index + 1}
                  </span>
                  <p className="text-sm text-slate-200">{frame}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold uppercase tracking-wide text-xs text-slate-400">
              Audio prompts
            </h3>
            <ul className="grid gap-2">
              {response.production.audioPrompts.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold uppercase tracking-wide text-xs text-slate-400">
              Editing notes
            </h3>
            <ul className="grid gap-2">
              {response.production.editingNotes.map((note) => (
                <li
                  key={note}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Distribution plan
        </h2>
        <div className="grid gap-4">
          {response.assets.map((asset) => (
            <article
              key={asset.id}
              className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200"
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {asset.platform} · {asset.assetType}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(asset.scheduleTime).toLocaleString()}
                </span>
              </header>
              <p className="font-medium text-white">{asset.caption}</p>
              <span className="text-xs text-slate-400">
                CTA: {asset.callToAction}
              </span>
              <div className="flex flex-wrap gap-1 text-xs text-emerald-300">
                {asset.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ul className="grid gap-1 text-xs text-slate-400">
                {asset.optimizations.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Automation payloads
        </h2>
        <div className="grid gap-3">
          {response.automations.map((automation) => (
            <div
              key={`${automation.platform}-${automation.endpoint}`}
              className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 text-sm text-white">
                <span className="font-semibold uppercase tracking-wide text-emerald-300">
                  {automation.platform}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs uppercase tracking-widest text-emerald-200">
                  {automation.status}
                </span>
              </header>
              <p className="font-mono">{automation.endpoint}</p>
              <pre className="max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                {JSON.stringify(automation.payloadPreview, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
