// The legend at the bottom of the panel

// The scale that makes a row of `total` px fit in `available` px
export const MIN_LEGEND_SCALE = 0.7

export const legendScale = (total: number, available: number): number => {
  if (total <= 0 || available <= 0 || total <= available) {
    return 1
  }
  return Math.max(available / total, MIN_LEGEND_SCALE)
}

const GLYPH_SIZE = '14px'
const LABEL_FONT_SIZE = '10px'

// The row of the legend, found from the label of one of its entries
export const findLegendRow = (doc: Document, label: string): HTMLElement | null => {
  for (const leaf of Array.from(doc.querySelectorAll('div'))) {
    if (leaf.childElementCount !== 0 || leaf.textContent !== label) {
      continue
    }
    const entry = leaf.parentElement
    const row = entry?.parentElement
    if (!entry || !row || !entry.querySelector('img')) {
      continue
    }
    if (row.dataset.rerollLegend === '1' || getComputedStyle(row).flexWrap === 'wrap') {
      return row
    }
  }
  return null
}

export const fitLegendRow = (row: HTMLElement, hidden: readonly string[] = []): void => {
  row.dataset.rerollLegend = '1'
  row.style.flexWrap = 'nowrap'
  row.style.justifyContent = 'flex-end'
  row.style.overflow = 'hidden'
  row.style.transform = ''

  for (const entry of Array.from(row.children) as HTMLElement[]) {
    entry.style.flexShrink = '0'
    entry.style.whiteSpace = 'nowrap'
    entry.style.padding = '2px 3px'
    entry.style.height = 'auto'
    // an entry is its glyphs (two when Steam merges L1 and R1) then its label
    const parts = Array.from(entry.children) as HTMLElement[]
    const label = parts.pop()
    entry.style.display = label && hidden.includes(label.textContent ?? '') ? 'none' : ''
    for (const glyph of parts) {
      // wide enough for all its images
      glyph.style.width = 'auto'
      glyph.style.display = 'flex'
      glyph.style.gap = '2px'
      glyph.style.height = GLYPH_SIZE
      for (const image of Array.from(glyph.querySelectorAll('img'))) {
        image.style.width = GLYPH_SIZE
        image.style.height = GLYPH_SIZE
      }
    }
    if (label) {
      label.style.fontSize = LABEL_FONT_SIZE
      label.style.marginLeft = '3px'
      label.style.height = 'auto'
    }
  }

  // the row takes the width the bar leaves it
  const bar = row.parentElement
  if (bar) {
    const style = getComputedStyle(bar)
    const available = bar.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0')
    row.style.flex = 'none'
    row.style.width = `${available}px`
  }

  const total = Array.from(row.children).reduce((sum, entry) => sum + (entry as HTMLElement).getBoundingClientRect().width, 0)
  const scale = legendScale(total, row.clientWidth)
  if (scale < 1) {
    row.style.transformOrigin = 'right center'
    row.style.transform = `scale(${scale})`
  }
}

// Keeps the legend on one line as long as it is called
export const keepLegendOnOneLine = (doc: Document, label: string, hidden: readonly string[] = []): (() => void) => {
  let row: HTMLElement | null = null
  let observer: MutationObserver | null = null

  const look = () => {
    if (row && row.isConnected) {
      return
    }
    observer?.disconnect()
    row = findLegendRow(doc, label)
    if (!row) {
      return
    }
    const found = row
    observer = new MutationObserver(() => fitLegendRow(found, hidden))
    observer.observe(found, { childList: true, subtree: true, characterData: true })
    fitLegendRow(found, hidden)
  }

  look()
  const timer = window.setInterval(look, 500)
  return () => {
    window.clearInterval(timer)
    observer?.disconnect()
  }
}
