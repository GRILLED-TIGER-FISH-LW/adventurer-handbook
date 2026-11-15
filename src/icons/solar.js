import {
  HomeIcon,
  MapPointIcon,
  GiftIcon,
  HamburgerMenuIcon,
  Sun2Icon,
  MoonIcon,
} from '@solar-icons/vue/linear'
import {
  HomeIcon as HomeBold,
  MapPointIcon as MapPointBold,
  GiftIcon as GiftBold,
  HamburgerMenuIcon as HamburgerMenuBold,
  Sun2Icon as Sun2Bold,
  MoonIcon as MoonBold,
} from '@solar-icons/vue/bold'

/* 内容图标统一走 Solar：linear 是常规，bold 是选中/强调。
   以后加功能：这里加一行 + router 里写名字，就完事 */
const SETS = {
  home: { linear: HomeIcon, bold: HomeBold },
  'map-point': { linear: MapPointIcon, bold: MapPointBold },
  gift: { linear: GiftIcon, bold: GiftBold },
  'hamburger-menu': { linear: HamburgerMenuIcon, bold: HamburgerMenuBold },
  'sun-2': { linear: Sun2Icon, bold: Sun2Bold },
  moon: { linear: MoonIcon, bold: MoonBold },
}

export function solarIcon(name, bold = false) {
  const set = SETS[name]
  return set ? (bold ? set.bold : set.linear) : null
}
