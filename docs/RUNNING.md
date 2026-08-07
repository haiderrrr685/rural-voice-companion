# Running the Rural Companion Prototype

Quick start (Node 18+, npm/pnpm/bun):

1. Install dependencies

npm:

```bash
npm install
```

pnpm:

```bash
pnpm install
```

bun:

```bash
bun install
```

2. Start the dev server

```bash
npm run dev
```

3. Open the app

Open http://localhost:5173 in your browser.

Build and preview (production-like):

```bash
npm run build
npm run preview
```

Troubleshooting & tips for prototype:

- If ports are busy, Vite will suggest an alternate port — use that URL.
- If you need environment variables, create a `.env` file at the project root.
- The main entry is served by Vite; changes hot-reload automatically.
- To test a production build locally, use `npm run build` then `npm run preview`.

Other ways to run and check the prototype

- Using `pnpm` (faster installs when available):

```bash
pnpm install
pnpm dev
```

- Using `bun`:

```bash
bun install
bun run dev
```

- Docker (quick local container):

1. Create a simple `Dockerfile` using Node 18+ and build the image:

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

2. Build and run:

```bash
docker build -t rural-companion .
docker run -p 5173:5173 rural-companion
```

- Test a production build locally (serve the built files):

```bash
npm run build
npm run preview
# or use a static server after build
npx serve dist
```

- Deploy previews: Vercel, Netlify, and similar platforms work well — connect the repo and use the `build` script.

Quick checks and tips

- If the dev server picks a different port, copy the URL shown in the terminal.
- If HMR appears not to update, check the browser console for errors.
- For environment variables, create `.env` or `.env.local` at the project root. Example variables are in `/.env.example`.

If you want, I'll start the install and spin up the dev server here so you can inspect the live output.