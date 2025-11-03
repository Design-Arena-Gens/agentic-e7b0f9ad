## Agentic Viral Workflow

An AI-first automation console for spinning up Instagram-optimized content, adapting it for YouTube Shorts, Facebook Reels, Threads, and Pinterest, and exporting ready-to-fire publishing payloads for each platform.

### Features
- Brief-driven campaign builder tailored for Instagram-first virality.
- LLM-generated hooks, storyboards, editing notes, and captions.
- Cross-platform distribution grid with CTA, hashtag, and optimization guidance.
- Auto-publish payloads mapped to the official Graph, YouTube Data, Threads, and Pinterest APIs.
- Fallback mock workflow when no OpenAI key is provided so the UI is always demo-ready.

### Configuration
Create a `.env.local` file with the credentials you intend to wire up:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini

# Social graph tokens pulled from your secrets vault
INSTAGRAM_TOKEN=
INSTAGRAM_BUSINESS_ID=
FACEBOOK_PAGE_TOKEN=
FACEBOOK_PAGE_ID=
THREADS_TOKEN=
THREADS_USER_ID=
YOUTUBE_TOKEN=
PINTEREST_TOKEN=
PINTEREST_BOARD_ID=
```

Only `OPENAI_API_KEY` is required for live AI generation. When omitted the app falls back to a deterministic sample workflow so designers and stakeholders can still review the flow.

### Local Development
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to brief campaigns, generate assets, and inspect automation payloads.

### Production Build
```bash
npm run build
npm start
```

### Deployment
The project is Vercel-ready. After setting the environment variables in the Vercel dashboard:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-e7b0f9ad
```
