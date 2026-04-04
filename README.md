# Dr. Haitham A. El-Ghareeb Personal Scholarly Website

This repository contains the rebuilt bilingual personal scholarly website for Dr. Haitham A. El-Ghareeb, prepared for deployment on GitHub Pages using Astro.

The project is being developed as a modern Arabic-first scholarly site with an English interface, focused on presenting academic identity, books, critical editions, articles, research interests, and future digital scholarly projects.

## Current Status

The repository is now an Astro-based bilingual website scaffold with:

- bilingual routing for Arabic and English
- a shared base layout
- initial placeholder pages for the core sections already created
- project planning and architecture notes under `project-docs/`
- early content files under `content/`

At the moment, the implementation is still in the first functional stage: the main routes exist, but most sections still contain placeholder copy and several planned routes are not yet created.

## Implemented Routes

### Arabic

- `/`
- `/ar/`
- `/ar/about/`
- `/ar/cv/`
- `/ar/books/`
- `/ar/editions/`
- `/ar/articles/`

### English

- `/en/`
- `/en/about/`
- `/en/cv/`
- `/en/books/`
- `/en/critical-editions/`

## Repository Structure

```text
.
|-- astro.config.mjs
|-- config/
|   |-- navigation.ts
|   `-- site.ts
|-- content/
|   |-- ar/
|   `-- en/
|-- project-docs/
|-- src/
|   |-- layouts/
|   |-- pages/
|   `-- styles/
|-- README.md
`-- LICENSE
```

## Development

This project uses Astro.

### Scripts

- `npm run dev` to start the local development server
- `npm run build` to generate the production build
- `npm run preview` to preview the production build locally
- `npm run check` to run Astro checks

## Launch Notes

Before calling this a full first release, the following items still need attention:

- replace placeholder copy on the existing pages with approved scholarly content
- align the navigation with the routes that actually exist, or create the missing pages
- verify the production build in a Node.js environment with `npm`
- continue filling the scholarly sections with approved production content

## Project Documentation

Planning and implementation notes are kept in `project-docs/`, including:

- `project-plan.md`
- `site-map.md`
- `navigation-structure.md`
- `technical-architecture.md`
- `update-log.md`

## Licensing

This repository is released under the MIT License. See `LICENSE`.
