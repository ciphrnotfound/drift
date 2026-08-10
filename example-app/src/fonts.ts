import { getFontCSS, googleFont } from '@drift/font'

export const manrope = googleFont({
  family: 'Manrope',
  weights: [400, 500, 600, 700, 800],
  subsets: ['latin'],
  variable: '--font-manrope',
})

export function installDriftFonts() {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-drift-fonts]')) return

  const style = document.createElement('style')
  style.dataset.driftFonts = 'true'
  style.textContent = getFontCSS()
  document.head.appendChild(style)
}
