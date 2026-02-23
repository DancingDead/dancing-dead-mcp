---
name: press-releases
description: "Automatic generation of promotional content for Dancing Dead Records label releases. Use this skill whenever the user requests: Spotify/streaming pitches, press releases, artist presentations or biographies, track or EP descriptions, catchphrases/hooks/taglines, YouTube descriptions, translations of press content (FR<>EN), or anti-AI rewriting of promotional text. Trigger on phrases like 'write a pitch', 'press release for', 'present the artist', 'biography of', 'track description', 'catchphrase for', 'YouTube description', 'translate this press release', 'make this text more natural'. Also trigger when the user mentions any Dancing Dead Records, Den Haku Records, or STYX release and needs promotional copy. This skill applies CRAC templates specific to EDM/electronic music marketing."
---

# Press Releases — Dancing Dead Records

Generate promotional content (pitches, press releases, artist bios, track/EP descriptions, hooks, YouTube copy, translations) for Dancing Dead Records and its imprints (Den Haku Records, STYX).

## Automated Workflow

For every request, follow these steps in order:

### Step 1 — Detect Request Type

Identify from the user's message:

1. **Content type**: pitch | press-release-artist | press-release-track | press-release-ep | hook | youtube | translation | anti-ai
2. **Language**: EN (default) or FR
3. **Length**: standard | short (YouTube) | single phrase (hook)
4. **Context**: all information provided by the user

### Step 2 — Gather Information

Collect via Notion MCP, Spotify MCP, user input, or web search:

- **Artist**: name, origin, style, influences, past releases, notable events
- **Track**: title, artist(s), genre, BPM, key, mood, key musical elements
- **EP**: title, artist(s), track count, track names, overall concept
- **Artwork**: if available, use it to build a narrative universe

### Step 3 — Complementary Research

Perform web searches to:

- Understand the **musical genre** precisely (characteristics, reference artists)
- Identify **relevant playlists** (Spotify, Apple Music)
- Suggest **suitable events/festivals** for the style
- Verify artist information when incomplete

**CRITICAL**: All information must be accurate and verifiable. Never invent facts.

### Step 4 — Apply the Matching CRAC Template

See the templates section below. Pick the template matching the detected content type.

### Step 5 — Anti-AI Verification

Before delivering, ensure the text:

- Avoids overly generic formulations
- Uses varied, specific vocabulary
- Has natural structure with no detectable AI pattern
- Does not overuse emphatic adjectives
- Stays factual and engaging without cliche

### Step 6 — Final Checklist

Verify before sending:

- Length respected (+/-10% margin)
- All information is accurate
- No mention of other labels
- No excessive superlatives
- Natural style (not AI-detectable)
- Varied and specific vocabulary
- Perfect grammar and spelling (EN or FR)
- Tone adapted to context (pitch != press release)
- Suggested playlists/events are real and relevant
- If artwork mentioned: coherent narrative universe

---

## CRAC Templates

### Template 1 — Spotify/Streaming Pitch (~100 words)

**Context**: Write a pitch for streaming platforms to obtain playlisting for a dance/EDM release.

**Role**: Expert in EDM communication, community management, and music marketing.

**Action**:
1. Introduce the track and artist
2. Describe the musical genre precisely
3. Detail key musical elements (groove, synths, breaks, atmosphere)
4. Convey the energy and feeling
5. Suggest relevant playlists or events (based on research)
6. If artwork provided: create narrative universe coherent with visuals

**Output**: ~100 words, professional and fluid English.

**Constraints**:
- DO: 100% accurate info, in-depth genre research, real playlists, use artwork context
- NEVER: invent info, use generic formulations, mention other labels, produce AI-detectable style

**Required input**: track_name, artist_name, genre. Optional: mood, artwork_theme.

---

### Template 2 — Press Release: Artist Presentation (~100-150 words)

**Context**: Write the artist section of a press release for media, presenting the artist behind the release.

**Role**: Expert in EDM communication, community management, and music marketing.

**Action**:
1. Present the artist compellingly
2. Highlight their journey and notable achievements
3. Describe their musical style and artistic identity
4. Create an attractive vision of the character
5. Make the text pleasant and interesting to read

**Output**: ~100-150 words, professional and engaging English.

**Constraints**:
- DO: accurate info (web research if needed), captivating text, avoid generic phrases
- NEVER: over-emphasize influence on the industry, mention other labels, use AI-detectable style, use excessive superlatives

**Required input**: artist_name, artist_info, style.

---

### Template 3 — Press Release: Track Presentation (~150 words)

**Context**: Following the artist presentation, present the track itself for the press release.

**Role**: Expert in EDM communication, community management, and music marketing.

**Action**:
1. Describe the track engagingly
2. Convey emotions and sensations felt while listening
3. Detail key musical elements (production, arrangements, atmosphere)
4. If artwork provided: create narrative connection with visuals
5. Make the reader travel into the track's universe

**Output**: ~150 words, professional and immersive English.

**Constraints**:
- DO: accurate info, in-depth genre research, sensory/immersive descriptions, use artwork for narrative
- NEVER: generic descriptions, AI-detectable style, excessive technical jargon

**Required input**: track_name, artist_name, genre, track_ideas. Optional: artwork_theme.

---

### Template 4 — Press Release: EP Presentation (~200 words)

**Context**: Present a complete EP (multiple tracks) for a press release.

**Role**: Expert in EDM communication, community management, and music marketing.

**Action**:
1. Present the EP as a coherent global project
2. Describe its artistic identity
3. Present each track individually (briefly)
4. Explain the overall vision
5. Convey emotions and the musical journey proposed

**Output**: ~200 words, professional and narrative English.

**Constraints**:
- DO: accurate info on all tracks, narrative coherence, immersive descriptions
- NEVER: generic descriptions, AI-detectable style, unbalance the presentation (all tracks matter)

**Required input**: ep_name, artist_names, track_count, track_names, genre. Optional: ep_concept.

---

### Template 5 — Catchphrase/Hook (~1 punchy phrase)

**Context**: Create a short, punchy catchphrase to quickly present a track and encourage listening.

**Role**: Expert in EDM copywriting and music marketing.

**Action**:
1. Create 5 different proposals
2. Capture the essence of the track in one sentence
3. Motivate immediate listening
4. Use impactful and specific vocabulary

**Output**: 5 distinct phrases, each ~15-25 words max.

**Constraints**:
- DO: punchy and memorable, specific to the track, varied vocabulary between proposals
- NEVER: marketing cliches, excessive superlatives ("the best", "revolutionary")

**Required input**: track_description.

---

### Template 6 — Short YouTube Presentation (~50-100 words, SEO optimized)

**Context**: Condense an existing artist or track presentation for a YouTube video description.

**Role**: Music SEO expert and EDM communication specialist.

**Action (Artist version)**:
1. Condense artist presentation to 50-100 words
2. Optimize for YouTube SEO
3. Highlight: genre, similar major artists, events, festivals

**Action (Track version)**:
1. Condense track description to 50-100 words
2. Optimize for YouTube SEO (EDM fans)
3. Keep key elements and atmosphere

**Output**: ~50-100 words, SEO optimized for EDM fans.

**Constraints**:
- DO: SEO optimized with relevant keywords, preserve essential info, mention relevant artists/events
- NEVER: lose the essence of the original, lose key emotions

**Required input**: source_text (original presentation to condense).

---

### Template 7 — Translation & Adaptation (FR <-> EN)

**Context**: Translate and adapt a presentation/press release for a different audience.

**Role**: Bilingual music communication expert FR/EN.

**Action**:
1. Translate faithfully
2. Adapt cultural references if necessary
3. Preserve tone and energy of original text
4. Adjust formulations to sound natural in target language

**Output**: Same length as original, fluent target language.

**Constraints**:
- DO: faithful but natural translation, adapt cultural references, preserve energy and tone
- NEVER: awkward literal translation, loss of important information

**Required input**: source_text, target_language (FR or EN).

---

### Template 8 — Anti-AI Detection Rewrite

**Context**: A generated text sounds too "AI" and needs to be rewritten to pass unnoticed.

**Role**: Experienced human writer in music communication.

**Action**:
1. Analyze the text provided by user (manually rewritten version)
2. Identify the style and structure used
3. Understand the patterns that make the text "human"
4. Reproduce this style for future generations

**Output**: Style analysis + confirmation of understanding.

**Constraints**:
- DO: deeply analyze sentence structure, identify specific vocabulary, understand tone variations, memorize patterns
- NEVER: simply paraphrase

**Required input**: ai_text (original AI text), human_text (human-rewritten model to follow).

---

## Dancing Dead Records Style Guide

### Vocabulary to FAVOR

- **Atmosphere**: immersive, hypnotic, journey, sonic landscape
- **Energy**: driving, relentless, pulsating
- **Textures**: shimmering, cascading, layered
- **Context**: peak-time, dancefloor, late-night

### Vocabulary to AVOID

- **Too emphatic**: game-changing, revolutionary, groundbreaking
- **Too casual**: banger, absolute heater
- **Cliches**: the next big thing, destined for greatness

### Sentence Structure

- Vary sentence length (short + long)
- Use commas to create rhythm
- Alternate factual descriptions and sensory evocations

### Reference Artists (for relevant comparisons)

- **Progressive House**: Eric Prydz, Cristoph, Yotto, ARTBAT
- **Melodic Techno**: Tale Of Us, Stephan Bodzin, Anyma
- **Deep House**: Nora En Pure, Yotto, Lane 8
- **Techno**: Adam Beyer, Amelie Lens, Charlotte de Witte

---

## Error Handling

### Missing Information

If essential information is missing:

1. List what's missing
2. Ask the user to provide it OR perform web searches to find it

Example:
```
To generate a quality pitch, I need:
- Precise musical genre (you said "EDM" but can you specify: house, techno, trance?)
- Approximate BPM
- General track mood

Can you provide this, or should I search Notion/Spotify for it?
```

### Inconsistency Detection

If provided information seems inconsistent, signal and ask for clarification.

Example:
```
You mention "deep house" but with 150 BPM and an "aggressive" mood.
Deep house is generally ~120 BPM with a softer atmosphere.
Is it rather hard techno or drum & bass?
```

---

## Quick Iteration

The user can request adjustments without repeating all info:

- "Shorter version"
- "More energetic tone"
- "Less technical"
- "More narrative"

Adjust immediately without re-asking for context.

## Supported Languages

- **English** (default for international releases)
- **French** (on explicit request)

## Integration

This skill works with Notion MCP (artist files, release info, briefs) and Spotify MCP (track data, playlist references).
