import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { Button, Card, CardBody, Input, Stack } from '../index'

describe('@drift/ui components', () => {
  test('Button supports Drift variants and Tailwind overrides', () => {
    const html = renderToStaticMarkup(
      <Button variant="danger" size="lg" tw="rounded-xl" loading>
        Delete
      </Button>
    )

    expect(html).toContain('drift-ui-button')
    expect(html).toContain('rounded-xl')
    expect(html).toContain('data-variant="danger"')
    expect(html).toContain('data-size="lg"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('disabled=""')
  })

  test('Card and Stack compose layout primitives', () => {
    const html = renderToStaticMarkup(
      <Stack direction="row" align="center" justify="between" gap="6">
        <Card interactive>
          <CardBody>Content</CardBody>
        </Card>
      </Stack>
    )

    expect(html).toContain('drift-ui-stack')
    expect(html).toContain('data-direction="row"')
    expect(html).toContain('data-justify="between"')
    expect(html).toContain('drift-ui-card')
    expect(html).toContain('data-interactive="true"')
  })

  test('Input maps invalid state to accessibility attributes', () => {
    const html = renderToStaticMarkup(<Input invalid placeholder="Email" />)

    expect(html).toContain('drift-ui-input')
    expect(html).toContain('data-invalid="true"')
    expect(html).toContain('aria-invalid="true"')
  })
})
