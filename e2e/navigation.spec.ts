import { expect, test } from '@playwright/test'

test('rapid links commit only the latest route', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByRole('navigation').getByRole('link', { name: 'Language' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'SEO', exact: true }).click()

  await expect(page).toHaveURL(/\/seo$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SEO that ships')
  await expect(page.getByRole('navigation').getByRole('link', { name: 'SEO', exact: true })).toHaveAttribute('data-active', 'true')
  expect(errors).toEqual([])
})

test('browser history restores the previous scroll position', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('frontend language')
  await page.evaluate(() => window.scrollTo(0, 2300))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1800)

  await page.getByRole('navigation').getByRole('link', { name: 'Components' }).click()
  await expect(page).toHaveURL(/\/ui$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  const restoredState = await page.evaluate(() => history.state?.__drift?.scroll)
  expect(restoredState?.[1]).toBeGreaterThan(1800)
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeGreaterThan(1800)
})

test('query and hash URLs survive initial route matching', async ({ page }) => {
  await page.goto('/language?mode=source#routing', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/language\?mode=source#routing$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('interface is')
  await expect.poll(() => page.evaluate(() => window.location.search)).toBe('?mode=source')
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#routing')
})

test('404 routes recover through client navigation', async ({ page }) => {
  await page.goto('/not-a-real-route', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This route drifted away.')
  await expect(page).toHaveTitle(/404/)
  await page.getByRole('link', { name: 'Return home' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('frontend language')
})

test('every public route owns metadata', async ({ page }) => {
  for (const path of ['/', '/language', '/seo', '/ui']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/Drift/)
    const metadata = await page.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    }))
    expect(metadata.description?.length).toBeGreaterThan(40)
    expect(new URL(metadata.canonical || '').pathname).toBe(path)
  }
})
