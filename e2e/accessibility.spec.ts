import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const [label, path] of [['home', '/'], ['language', '/language'], ['seo', '/seo'], ['ui', '/ui']]) {
  test(`${label} has no serious automated accessibility violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter(violation =>
      violation.impact === 'critical' || violation.impact === 'serious'
    )

    const failures = blocking.flatMap(violation =>
      violation.nodes.map(node => `${violation.id}: ${node.target.join(' > ')}`)
    )
    expect(failures).toEqual([])
  })
}
