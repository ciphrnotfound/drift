import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

test('all public routes fit a mobile viewport', async ({ page }) => {
  for (const path of ['/', '/language', '/seo', '/ui', '/missing']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
    await expect(page.getByRole('navigation')).toBeVisible()
  }
})
