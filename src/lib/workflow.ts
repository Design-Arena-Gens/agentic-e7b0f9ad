import OpenAI from 'openai';
import { addMinutes, isValid, parseISO } from 'date-fns';
import { z } from 'zod';

type Platform =
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'threads'
  | 'pinterest';

export const workflowInputSchema = z.object({
  campaignName: z.string().min(2, 'Campaign name is required'),
  niche: z.string().optional(),
  persona: z.string().min(10, 'Describe the persona in more detail'),
  brandVoice: z.string().min(5),
  offer: z.string().min(5, 'Highlight the product or offer'),
  keywords: z.string().min(3),
  platforms: z
    .array(z.enum(['instagram', 'youtube', 'facebook', 'threads', 'pinterest']))
    .min(1),
  primaryAsset: z.string(),
  variations: z.number().int().min(1).max(10),
  scheduleDate: z.string().optional(),
  autoPublish: z.boolean().default(true),
  referenceLinks: z.string().optional(),
});

export type WorkflowInput = z.infer<typeof workflowInputSchema>;

export type Workflow = {
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

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

const SYSTEM_PROMPT = `You are an elite social media creative director and marketing automation engineer.
Generate viral-first, Instagram-native scripts that can be adapted to other platforms while respecting their nuances.
Return only valid JSON.
Do not invent API tokens. Instead, point to environment variables with double braces like {{INSTAGRAM_TOKEN}}.
`;

export async function buildWorkflow(input: WorkflowInput): Promise<Workflow> {
  if (!process.env.OPENAI_API_KEY) {
    return buildMockWorkflow(input);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const schedule = resolveSchedule(input);

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: SYSTEM_PROMPT,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildUserPrompt(input, schedule.isoDates),
          },
        ],
      },
    ],
  });

  const text =
    'output_text' in response
      ? (response as unknown as { output_text?: string }).output_text
      : undefined;

  if (!text) {
    throw new Error('LLM response missing text payload');
  }

  const parsed = JSON.parse(text) as Workflow;

  const automations = enrichAutomations(parsed, input, schedule.isoDates);

  return {
    ...parsed,
    assets: parsed.assets.map((asset, index) => ({
      ...asset,
      scheduleTime: schedule.isoDates[index % schedule.isoDates.length],
    })),
    automations,
  };
}

function buildUserPrompt(
  input: WorkflowInput,
  schedule: string[],
): string {
  const references = input.referenceLinks?.trim()
    ? `References:\n${input.referenceLinks}`
    : 'No references provided.';

  return `
Campaign: ${input.campaignName}
Offer: ${input.offer}
Primary asset: ${input.primaryAsset}
Persona: ${input.persona}
Brand voice: ${input.brandVoice}
Niche: ${input.niche || 'Not specified'}
Keywords: ${input.keywords}
Platforms: ${input.platforms.join(', ')}
Variations needed: ${input.variations}
Schedule ISO slots: ${schedule.join(', ')}
${references}

Return a JSON object with keys: campaign {title, summary, hooks[]}, production {masterScript, storyboard[], audioPrompts[], editingNotes[]}, assets[]. Each asset should include: id, platform, assetType, caption, hashtags[], scheduleTime, callToAction, optimizations[]. Ensure at least one asset per requested platform. Tailor captions & CTA per platform. Provide short but specific editing notes.
  `.trim();
}

function resolveSchedule(input: WorkflowInput) {
  const base =
    input.scheduleDate && isValid(parseISO(input.scheduleDate))
      ? parseISO(input.scheduleDate)
      : new Date();

  const isoDates = input.platforms.map((_, index) =>
    addMinutes(base, index * 45).toISOString(),
  );

  return { base, isoDates };
}

function enrichAutomations(
  response: Workflow,
  input: WorkflowInput,
  schedule: string[],
): Workflow['automations'] {
  return input.platforms.map((platform, idx) => {
    const scheduleTime = schedule[idx % schedule.length];
    switch (platform) {
      case 'instagram':
        return {
          platform,
          endpoint: 'POST https://graph.facebook.com/v18.0/{{INSTAGRAM_BUSINESS_ID}}/media',
          status: input.autoPublish ? 'queued' : 'ready',
          payloadPreview: {
            image_url: '<signed-video-or-image-url>',
            caption: getCaption(response, platform),
            access_token: '{{INSTAGRAM_TOKEN}}',
            published: input.autoPublish,
            scheduled_publish_time: scheduleTime,
          },
        };
      case 'youtube':
        return {
          platform,
          endpoint: 'POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable',
          status: 'queued',
          payloadPreview: {
            part: 'snippet,status',
            snippet: {
              title: `${response.campaign.title} | Vertical Cut`,
              description: getCaption(response, platform),
              tags: extractHashtags(response, platform),
              categoryId: '22',
            },
            status: {
              privacyStatus: 'private',
              publishAt: scheduleTime,
              selfDeclaredMadeForKids: false,
            },
            access_token: '{{YOUTUBE_TOKEN}}',
          },
        };
      case 'facebook':
        return {
          platform,
          endpoint:
            'POST https://graph.facebook.com/v18.0/{{FACEBOOK_PAGE_ID}}/video_reels',
          status: input.autoPublish ? 'queued' : 'ready',
          payloadPreview: {
            video_url: '<signed-video-url>',
            description: getCaption(response, platform),
            access_token: '{{FACEBOOK_PAGE_TOKEN}}',
            scheduled_publish_time: scheduleTime,
            upload_phase: 'finish',
          },
        };
      case 'threads':
        return {
          platform,
          endpoint: 'POST https://graph.threads.net/v1.0/{{THREADS_USER_ID}}/threads',
          status: 'queued',
          payloadPreview: {
            text: getCaption(response, platform),
            media_urls: ['<signed-image-or-video-url>'],
            access_token: '{{THREADS_TOKEN}}',
            scheduled_publish_time: scheduleTime,
          },
        };
      case 'pinterest':
        return {
          platform,
          endpoint: 'POST https://api.pinterest.com/v5/pins',
          status: 'queued',
          payloadPreview: {
            board_id: '{{PINTEREST_BOARD_ID}}',
            title: response.campaign.title,
            description: getCaption(response, platform),
            media_source: {
              source_type: 'video',
              content_type: 'video/mp4',
              data: '<base64-video-bytes>',
            },
            link: '<landing-page-url>',
            scheduled_time: scheduleTime,
            access_token: '{{PINTEREST_TOKEN}}',
          },
        };
      default:
        return {
          platform,
          endpoint: 'N/A',
          status: 'ready',
          payloadPreview: {},
        };
    }
  });
}

function getCaption(response: Workflow, platform: Platform) {
  const asset = response.assets.find((item) => item.platform === platform);
  return asset?.caption ?? response.production.masterScript.slice(0, 220);
}

function extractHashtags(response: Workflow, platform: Platform) {
  const asset = response.assets.find((item) => item.platform === platform);
  return asset?.hashtags ?? [];
}

function buildMockWorkflow(input: WorkflowInput): Workflow {
  const schedule = resolveSchedule(input);
  const hooks = [
    'The 3-sentence hook that stops doom-scrolling in the first second.',
    'Transform one mundane habit into a viral narrative arc.',
    'Turn your micro-brand story into a cliffhanger with a payoff CTA.',
  ];

  const assets = input.platforms.map((platform, index) => ({
    id: `${platform}-${index + 1}`,
    platform,
    assetType:
      platform === 'instagram' ? 'reel' : platform === 'pinterest' ? 'idea pin' : 'vertical video',
    caption: `🔥 ${input.offer} — ${input.campaignName} launch day.\n${input.persona} can't ignore this.`,
    hashtags: input.keywords
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
    scheduleTime: schedule.isoDates[index % schedule.isoDates.length],
    callToAction: 'Tap the link in bio to unlock the full playbook.',
    optimizations: [
      'Hook in first 1.5s with bold motion graphic',
      'Punch-in at beat drop to highlight CTA overlay',
      'Use auto captions + emojis for emphasis',
    ],
  }));

  return {
    campaign: {
      title: `${input.campaignName} Viral Flight Plan`,
      summary: `Dominate ${input.platforms.join(', ')} with ${input.primaryAsset} concepts engineered for ${input.persona}.`,
      hooks,
    },
    production: {
      masterScript: `Intro: Pattern interrupt anchored in ${input.offer}.\nMiddle: Deliver unique mechanism & proof.\nOutro: Drive ${input.brandVoice} CTA toward offer.`,
      storyboard: [
        'Cold open with organic POV shot, overlay a punchy headline.',
        'Cut to proof or transformation moment with quick stat.',
        'Close on clear CTA with countdown timer and social proof badges.',
      ],
      audioPrompts: [
        'Energetic trap beat at 120 BPM with crisp percussions.',
        'Include swish transition effects between cuts.',
      ],
      editingNotes: [
        'Use dynamic zoom on hook statement to create urgency.',
        'Add auto captions with brand font at 96px for Reels & Shorts.',
        'Swap CTA overlay colors to match platform palette.',
      ],
    },
    assets,
    automations: enrichAutomations(
      {
        campaign: {
          title: `${input.campaignName} Viral Flight Plan`,
          summary: '',
          hooks,
        },
        production: {
          masterScript: '',
          storyboard: [],
          audioPrompts: [],
          editingNotes: [],
        },
        assets,
        automations: [],
      },
      input,
      schedule.isoDates,
    ),
  };
}
