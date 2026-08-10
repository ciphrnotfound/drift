import { useEffect } from 'react'
import type { MetadataBlock } from '@drift/types'

export interface MetadataProps {
  metadata: MetadataBlock
}

/**
 * Metadata component - updates document head with SEO metadata
 */
export function Metadata({ metadata }: MetadataProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    // Update title
    if (metadata.title) {
      document.title = metadata.title
    }

    // Update description
    if (metadata.description) {
      updateMetaTag('description', metadata.description)
    }

    // Update keywords
    if (metadata.keywords && metadata.keywords.length > 0) {
      updateMetaTag('keywords', metadata.keywords.join(', '))
    }

    // Update OG tags
    if (metadata.og) {
      Object.entries(metadata.og).forEach(([key, value]) => {
        updateMetaTag(`og:${key}`, value, 'property')
      })
    }

    // Update Twitter tags
    if (metadata.twitter) {
      Object.entries(metadata.twitter).forEach(([key, value]) => {
        updateMetaTag(`twitter:${key}`, value)
      })
    }
  }, [metadata])

  return null
}

function updateMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attr}="${name}"]`)
  
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, name)
    document.head.appendChild(element)
  }
  
  element.setAttribute('content', content)
}
