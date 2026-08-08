# Rural Companion

Rural AI – Complete Product Flow

## Quick start

Run the workable prototype locally (Node 18+ recommended):

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal (commonly http://localhost:8080 or http://localhost:5173).

Full run options and troubleshooting are in [docs/RUNNING.md](docs/RUNNING.md#L1).

The goal of this app isn’t to build another chatbot. It’s to build an AI companion for rural India that feels natural to use even for someone who has never used AI before. The user should never have to think about languages, menus, or which feature to open. They simply speak, and the AI handles the rest.

⸻

1.⁠ ⁠Launch Experience

The app opens to a completely minimal screen.

In the center is a calm, softly animated orb.

Around the orb are words like Speak, Welcome, Namaste, Boliye, Vanakkam, Kem Cho, Sat Sri Akal, etc. written in every major Indian language. These words fade as they move farther away from the center, creating the feeling that every language converges into one place.

There are no buttons, no login screen, and no language selector.

The only instruction is:

“Speak in any language.”

This immediately communicates that the technology adapts to the user—not the other way around.

⸻

2.⁠ ⁠Language Detection

The user simply speaks naturally.

For example:

“My wheat crop has started turning yellow.”

The AI automatically detects:

•⁠ ⁠Language

•⁠ ⁠Dialect (where possible)

•⁠ ⁠Preferred voice

•⁠ ⁠Preferred UI language

Within a second, the interface smoothly transitions into that language.

The user never has to manually change any settings.

This preference is remembered for future sessions.

⸻

3.⁠ ⁠Home Screen Transformation

Once the language is detected, the orb shrinks and moves slightly upward while remaining the center of the interface.

The words surrounding it gracefully dissolve and transform into intelligent feature cards.

The orb now becomes the permanent AI assistant that is always available for general conversation.

Everything else expands around it.

The transition should feel like the app is “waking up.”

⸻

4.⁠ ⁠The AI Orb

The orb remains the heart of the application.

Users can tap it at any time to ask absolutely anything.

Examples:

•⁠ ⁠Tell me a story.

•⁠ ⁠Explain rainfall.

•⁠ ⁠Help me calculate fertilizer.

•⁠ ⁠Write a letter.

•⁠ ⁠Solve my child’s homework.

•⁠ ⁠Translate this sentence.

This is the general-purpose AI.

The specialized features simply provide additional tools around it.

⸻

5.⁠ ⁠Intelligent AI Routing

The user should never have to decide which feature to use.

If they say:

“My tomato leaves have black spots.”

The AI automatically routes the request to the Agriculture Agent.

If they ask:

“Which government scheme can I apply for?”

The Government Agent handles it.

If they upload a document, the Document Agent takes over.

To the user, it still feels like they’re talking to one assistant.

⸻

Core AI Agents

🌾 Agriculture Agent

This is the most important feature.

Capabilities:

•⁠ ⁠Crop disease detection from images

•⁠ ⁠Pest identification

•⁠ ⁠Nutrient deficiency analysis

•⁠ ⁠Irrigation advice

•⁠ ⁠Fertilizer recommendations

•⁠ ⁠Organic alternatives

•⁠ ⁠Crop planning

•⁠ ⁠Seasonal guidance

•⁠ ⁠Weather-based farming advice

•⁠ ⁠Soil-related recommendations

•⁠ ⁠Harvest timing suggestions

Future:

•⁠ ⁠Satellite insights

•⁠ ⁠Farm record keeping

•⁠ ⁠Yield prediction

⸻

🏛 Government Scheme Agent

Government information is usually difficult to understand.

The AI simplifies everything.

Capabilities:

•⁠ ⁠Find eligible schemes

•⁠ ⁠Explain schemes simply

•⁠ ⁠Required documents

•⁠ ⁠Application guidance

•⁠ ⁠Deadline reminders

•⁠ ⁠Pension information

•⁠ ⁠Subsidies

•⁠ ⁠Scholarships

•⁠ ⁠Insurance schemes

•⁠ ⁠Farmer welfare schemes

Instead of searching government websites, users simply ask naturally.

⸻

📄 Document Agent

Many rural users struggle with official paperwork.

Users upload:

•⁠ ⁠Land papers

•⁠ ⁠Aadhaar-related notices

•⁠ ⁠Bank letters

•⁠ ⁠Government circulars

•⁠ ⁠Medical reports

•⁠ ⁠Electricity bills

•⁠ ⁠Legal notices

The AI:

•⁠ ⁠Reads the document

•⁠ ⁠Explains it in simple language

•⁠ ⁠Summarizes it

•⁠ ⁠Highlights important dates

•⁠ ⁠Warns about missing documents

•⁠ ⁠Translates it if needed

⸻

❤️ Health Agent

Not for diagnosis, but for accessible healthcare guidance.

Capabilities:

•⁠ ⁠Explain symptoms

•⁠ ⁠Basic first aid

•⁠ ⁠Maternal care

•⁠ ⁠Child healthcare

•⁠ ⁠Vaccination schedules

•⁠ ⁠Nutrition guidance

•⁠ ⁠Medicine reminders

•⁠ ⁠Nearby health center suggestions

•⁠ ⁠Emergency instructions

⸻

💰 Market Agent

Designed for farmers and small business owners.

Capabilities:

•⁠ ⁠Crop prices

•⁠ ⁠Nearby mandi prices

•⁠ ⁠Price trends

•⁠ ⁠Selling recommendations

•⁠ ⁠Profit estimation

•⁠ ⁠Weather impact on pricing

•⁠ ⁠Demand insights

⸻

📚 Education Agent

Supports both children and adults.

Capabilities:

•⁠ ⁠Homework help

•⁠ ⁠Explain concepts simply

•⁠ ⁠Spoken learning

•⁠ ⁠Practice quizzes

•⁠ ⁠Scholarship information

•⁠ ⁠Career guidance

•⁠ ⁠Digital literacy

⸻

🐄 Livestock Agent

For animal care.

Capabilities:

•⁠ ⁠Animal disease identification

•⁠ ⁠Feed recommendations

•⁠ ⁠Vaccination reminders

•⁠ ⁠Milk production guidance

•⁠ ⁠Breeding information

•⁠ ⁠Veterinary advice

•⁠ ⁠Image-based analysis

⸻

🚨 Emergency Agent

One dedicated emergency space.

Capabilities:

•⁠ ⁠Emergency numbers

•⁠ ⁠Disaster guidance

•⁠ ⁠First aid

•⁠ ⁠Nearby hospitals

•⁠ ⁠Women’s safety contacts

•⁠ ⁠Ambulance information

•⁠ ⁠Flood and weather alerts

⸻

Voice-First Experience

The app is designed assuming many users will never type.

Every feature supports:

•⁠ ⁠Voice input

•⁠ ⁠Voice responses

•⁠ ⁠Local language conversations

•⁠ ⁠Natural speech

Typing is optional.

⸻

Camera Intelligence

The camera becomes another way to communicate.

Users can point it at:

•⁠ ⁠Crops

•⁠ ⁠Documents

•⁠ ⁠Medicine strips

•⁠ ⁠Government notices

•⁠ ⁠Machinery

•⁠ ⁠Livestock

•⁠ ⁠Bills

•⁠ ⁠Fertilizer bags

The AI understands the image and responds conversationally.

⸻

Offline Support

Many villages have unreliable internet.

The app should continue working gracefully.

Capabilities:

•⁠ ⁠Cache previous conversations

•⁠ ⁠Queue voice requests

•⁠ ⁠Sync automatically when internet returns

•⁠ ⁠Show offline status clearly

⸻

Personalization

The AI gradually learns:

•⁠ ⁠Preferred language

•⁠ ⁠Village

•⁠ ⁠Crops grown

•⁠ ⁠Family members

•⁠ ⁠Frequently used services

•⁠ ⁠Common questions

This enables more useful suggestions over time.

⸻

Contextual Home Screen

Instead of showing static cards forever, the home screen evolves based on context.

Examples:

Morning:

•⁠ ⁠Rain expected today.

•⁠ ⁠Water your crops after sunset.

•⁠ ⁠Market prices have increased.

•⁠ ⁠A subsidy deadline is approaching.

During the vaccination period:

•⁠ ⁠Your livestock vaccination is due.

During harvest:

•⁠ ⁠Best nearby market today.

The home screen becomes proactive instead of reactive.

⸻

Overall Design Philosophy

The interface should follow one simple principle:

One AI. Many specialists. Zero complexity.

Users never think in terms of “apps,” “features,” or “agents.” They simply speak in the language they’re comfortable with. The AI understands their intent, routes the request to the appropriate specialist behind the scenes, and returns a clear, actionable response.

That is the experience judges will remember—not because it has the most features, but because it removes friction and makes technology feel genuinely accessible. Build a modern mobile-first web prototype (NOT just static UI) for a Human-Centered Rural AI Assistant.

The goal is to create a believable, interactive prototype that feels like a real product. Prioritize smooth animations, transitions and clean UX over backend complexity.

Design Language

•⁠ ⁠Minimal

•⁠ ⁠Apple-inspired

•⁠ ⁠Soft white background (#FAFAFA)

•⁠ ⁠Blue accent (#4A7DFF)

•⁠ ⁠Glassmorphism only where subtle

•⁠ ⁠Large whitespace

•⁠ ⁠Rounded corners (24-32px)

•⁠ ⁠SF Pro / Inter font

•⁠ ⁠No clutter

•⁠ ⁠Premium, calm and approachable

•⁠ ⁠Everything should feel effortless

---

PAGE 1 — Welcome Screen

This is the onboarding screen.

The entire screen should only contain one central interactive orb.

The orb should be soft blue with subtle internal animated swirling lines.

It should slowly breathe (scale animation 98%-102%).

Around the orb should be many words floating in a radial pattern.

Use greetings and "Speak" prompts from major Indian languages.

Examples include

Speak

Boliye

Namaste

Vanakkam

Kem Cho

Sat Sri Akal

Namaskara

Swagatam

Welcome

Include scripts from

English

Hindi

Marathi

Gujarati

Punjabi

Tamil

Telugu

Malayalam

Kannada

Bengali

Assamese

Odia

Urdu

Konkani

Maithili

Sanskrit

Kashmiri

The farther a word is from the orb, the lower its opacity.

Words should drift extremely slowly.

No language picker.

At the bottom display

"Speak in any language"

with a microphone icon.

---

Interaction

When user taps the orb

Start browser speech recognition.

Record the user's speech.

Detect the spoken language automatically using browser capabilities if possible.

If browser language detection is unavailable, simulate detection based on recognized text.

For prototype purposes assume English is spoken if recognition succeeds.

Display

"Listening..."

Then

"English detected"

Animate this smoothly.

---

Transition

After language detection

Animate all floating language words fading away.

Orb shrinks from approximately 220px to 90px.

Orb moves smoothly toward upper-middle of screen.

Feature cards animate in around the orb with staggered spring animations.

This transition should feel premium.

---

PAGE 2 — AI Home

Keep the orb permanently visible.

The orb is now the global AI assistant.

Clicking it opens a chat modal.

Around the orb display feature cards.

Cards should appear organically around the orb instead of a rigid grid.

Features:

🌾 Agriculture Assistant

🏛 Government Schemes

📄 Document Assistant

❤️ Health Assistant

💰 Market Prices

📚 Education

🐄 Livestock Care

🚨 Emergency

Each card should contain

Icon

Title

Short description

Hover animation

Tap animation

---

General AI

The orb represents the main AI.

Clicking it opens a fullscreen chat interface.

Chat should support

text input

microphone button

dummy responses

typing animation

Suggested prompts

Examples

"Why are my crop leaves yellow?"

"What schemes can I apply for?"

"Explain this document"

"Help my child study"

---

Feature Cards

Clicking any feature opens a dedicated page.

Each page only needs enough functionality for demo purposes.

Agriculture

Upload crop image

Preview image

Fake AI loading animation

Display realistic diagnosis card

Government

Input occupation

Input land size

Generate dummy eligible schemes

Documents

Upload image

Preview

Generate summary

Health

Symptom textbox

Generate basic guidance

Education

Question input

Generate AI explanation

Market

Choose crop

Display sample market prices

Livestock

Upload animal image

Generate health suggestion

Emergency

Emergency contacts

First aid

Nearby services (dummy)

---

Architecture

Use React.

Use TypeScript.

Use TailwindCSS.

Component based.

Create reusable components.

Do NOT hardcode repeated UI.

Use Framer Motion for animations.

Keep code clean and modular.

---

Animations

Every transition should feel polished.

Orb breathing

Orb shrink

Cards slide in

Cards slightly float

Fade animations

Page transitions

Loading shimmer

Typing animation

Micro interactions

No flashy effects.

---

Prototype Requirements

This is a hackathon prototype.

Backend is NOT required.

Use mocked AI responses.

Use local state.

No authentication.

No database.

No API keys.

No login.

Everything should work as a believable interactive prototype.

Focus on UX, animations and flow rather than production backend.

Build every page and navigation so judges can click through the complete experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ce9011e5-9f97-49e8-a315-e9f357947f0b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
