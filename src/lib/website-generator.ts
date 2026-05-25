import { anthropic, MODELS } from './anthropic'

export type BusinessType = 'restaurant' | 'salon' | 'shop' | 'service' | 'other'

export interface BusinessInput {
  name: string
  type: BusinessType | null
  website: string | null
}

export interface GeneratedWebsite {
  files: {
    [path: string]: string
  }
  packageJson: {
    name: string
    scripts: Record<string, string>
    dependencies: Record<string, string>
  }
}

const WEBSITE_SYSTEM_PROMPT = `You generate complete Next.js 14 website projects ready to deploy to Vercel.
Each project is a fully functional website for a local business with AI-written content.

Requirements:
- Use TypeScript, Tailwind CSS, React
- App router pattern (Next.js 14)
- Responsive design (mobile-first)
- Fast, SEO-friendly
- Professional appearance
- Include environment for Vercel deployment

Output structure:
- app/ (pages and layouts)
- components/ (reusable components)
- public/ (static assets)
- styles/ (globals.css)
- package.json
- next.config.js
- tailwind.config.js
- tsconfig.json

Business-specific sections based on type:
- Restaurant: Menu, Reservations, Reviews
- Salon: Services, Booking, Portfolio
- Shop: Products, About, Blog
- Service: Services, Portfolio, Team
- Other: About, Services, Contact

Include compelling copy written for the specific business name and type.
Make it feel real and professional.`

const WEBSITE_GENERATION_TOOL = {
  name: 'generate_website',
  description: 'Generate a complete Next.js website project.',
  input_schema: {
    type: 'object' as const,
    properties: {
      files: {
        type: 'object',
        description: 'File paths and their contents (string map)',
        additionalProperties: { type: 'string' },
      },
      packageName: {
        type: 'string',
        description: 'Package name in kebab-case (e.g., acme-restaurant-website)',
      },
      dependencies: {
        type: 'object',
        description: 'npm dependencies and versions',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['files', 'packageName', 'dependencies'],
  },
}

export async function generateWebsite(business: BusinessInput): Promise<GeneratedWebsite> {
  const businessType = business.type || 'other'
  const typeSections = getBusinessTypeSections(businessType)

  const userPrompt = `Generate a Next.js website for this business:

Name: ${business.name}
Type: ${businessType}
Current Website: ${business.website || 'None'}

Website should include: ${typeSections}

Create a complete, production-ready Next.js 14 project with:
1. Main app directory with pages
2. Components (header, footer, navigation, etc.)
3. Tailwind CSS styling
4. TypeScript
5. AI-written copy that feels authentic to the business

Use the generate_website tool to submit the complete project structure.
Include all necessary files (next.config.js, tailwind.config.ts, package.json, etc.).`

  const response = await anthropic.messages.create({
    model: MODELS.balanced, // Use Sonnet for better code generation
    max_tokens: 4000,
    system: WEBSITE_SYSTEM_PROMPT,
    tools: [WEBSITE_GENERATION_TOOL],
    tool_choice: { type: 'tool', name: WEBSITE_GENERATION_TOOL.name },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }

  const input = toolUse.input as {
    files: Record<string, string>
    packageName: string
    dependencies: Record<string, string>
  }

  if (!input.files || !input.packageName) {
    throw new Error('Generated website missing required fields')
  }

  return {
    files: input.files,
    packageJson: {
      name: input.packageName,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        react: '^18',
        'react-dom': '^18',
        next: '^14',
        ...input.dependencies,
      },
    },
  }
}

function getBusinessTypeSections(type: BusinessType): string {
  const sections: Record<BusinessType, string> = {
    restaurant: 'Home page with hero, Menu page with items and pricing, Reservations booking, Reviews/testimonials, Contact info',
    salon: 'Home page with hero, Services list with prices, Online booking system, Portfolio/gallery, Team page, Contact',
    shop: 'Home page with featured products, Product catalog, About page, Blog section, Shopping features, Contact',
    service: 'Home page with value proposition, Services offered, Portfolio of past work, Team members, Testimonials, Contact',
    other: 'Home page, About section, Services/offerings, Portfolio, Blog (optional), Contact form',
  }
  return sections[type]
}
