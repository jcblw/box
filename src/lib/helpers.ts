import { css, SerializedStyles, CSSObject } from '@emotion/core'
import { StyleGuideHash, BoxProps } from '../types'

type CSSToStyle = (cssProp: CSSObject) => SerializedStyles

export const cssToStyle: CSSToStyle = cssProp =>
  cssProp ? css(cssProp) : css({})

export function mapToPair<T>(props: Partial<BoxProps<T>>) {
  return (key: string): [string, string | number | unknown] => [key, props[key]]
}

interface MappingAccum {
  used: string[]
  key: string
  value: string | number | unknown
}

type MapToStyleGuideValue = (
  accum: MappingAccum
) => (
  val: SerializedStyles | null,
  curr: StyleGuideHash
) => SerializedStyles | null

export const mapToStyleGuideValue: MapToStyleGuideValue = ({
  used = [],
  key,
  value,
}) => (val, curr) => {
  if (val) return val
  if (curr[key]) {
    used.push(key)
    if (
      (typeof value === 'string' || typeof value === 'number') &&
      curr[key][value]
    ) {
      return cssToStyle(curr[key][value] as CSSObject)
    }
  }
  return val
}

const cssDataPattern: RegExp = /^data-css/

interface PropsToStylesRet {
  used: string[]
  styles: SerializedStyles[]
}

export function propsToStyles<T>(stylesObjs: StyleGuideHash) {
  return (props: Partial<BoxProps<T>>): PropsToStylesRet => {
    const used: string[] = []
    const styles = Object.keys(props)
      .map(mapToPair(props))
      .map(pair => {
        const [key, value] = pair
        if (cssDataPattern.test(key)) {
          used.push(key)
          return key.replace(cssDataPattern, 'css')
        }
        return [stylesObjs].reduce(
          mapToStyleGuideValue({ used, key, value }),
          null
        )
      })
      .filter(x => x) as SerializedStyles[]
    return { used, styles }
  }
}