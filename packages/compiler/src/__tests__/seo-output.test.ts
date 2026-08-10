import { describe, expect, test } from 'vitest'
import { compile } from '../compiler'

describe('SEO output', () => {
  test('emits metadata sidecar files for components with metadata blocks', () => {
    const result = compile(`component Home {
  metadata {
    title: "Fast Drift"
    description: "Best speed and SEO"
    keywords: "drift, seo, frontend"
  }

  render {
    <main>Hello</main>
  }
}`, { filename: 'Home.drift' })

    expect(result.success).toBe(true)
    const metadataFile = result.files.find(file => file.path === 'Home.metadata.json')
    expect(metadataFile).toBeDefined()
    expect(metadataFile?.type).toBe('metadata')
    expect(JSON.parse(metadataFile?.content || '{}')).toMatchObject({
      title: 'Fast Drift',
      description: 'Best speed and SEO',
      keywords: ['drift', 'seo', 'frontend'],
    })
    const componentFile = result.files.find(file => file.path === 'Home.tsx')
    expect(componentFile?.content).toContain('<>\n      <Metadata metadata={_meta} />')
    expect(componentFile?.content).toContain("from '@drift/router/client'")
    expect(componentFile?.content).toContain('</>\n  )')
  })

  test('supports first-class social metadata fields', () => {
    const result = compile(`component SocialPage {
  metadata {
    title: "Drift"
    canonical: "/docs"
    robots: "index,follow"
    og.title: "Drift docs"
    og.image: "/og.png"
    twitter.card: "summary_large_image"
  }
  render { <main>Docs</main> }
}`, { filename: 'SocialPage.drift' })

    expect(result.success).toBe(true)
    const metadata = result.files.find(file => file.path === 'SocialPage.metadata.json')
    expect(JSON.parse(metadata?.content || '{}')).toMatchObject({
      canonical: '/docs',
      robots: 'index,follow',
      og: { title: 'Drift docs', image: '/og.png' },
      twitter: { card: 'summary_large_image' },
    })
  })
})
