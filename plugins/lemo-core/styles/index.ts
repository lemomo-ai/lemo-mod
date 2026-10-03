import type { LemoStyle } from '../types'
import { apothecary } from './apothecary'
import { aquarium } from './aquarium'
import { bakery } from './bakery'
import { blueprint } from './blueprint'
import { campfire } from './campfire'
import { dessert } from './dessert'
import { eightBit } from './eight-bit'
import { greenhouse } from './greenhouse'
import { launchpad } from './launchpad'
import { lemonLab } from './lemon-lab'
import { lighthouse } from './lighthouse'
import { metro } from './metro'
import { mineral } from './mineral'
import { mixtape } from './mixtape'
import { newsroom } from './newsroom'
import { nightMarket } from './night-market'
import { observatory } from './observatory'
import { opera } from './opera'
import { plain } from './plain'
import { polar } from './polar'
import { postOffice } from './post-office'

// 20 套主题风格，各有自己的像素画、配色、文字和音效；
// 排列顺序就是面板里风格按钮和 /lemo-mod 风格 列表的顺序。
// 最后是素色 plain：没有像素画，音效借用柠檬实验室的，也用来确认换一包风格数据就能整套换
export const STYLES: Readonly<Record<string, LemoStyle>> = {
  'lemon-lab': lemonLab, mineral, mixtape, observatory, greenhouse, bakery, metro, opera, 'eight-bit': eightBit, launchpad,
  campfire, dessert, 'post-office': postOffice, apothecary, newsroom, polar, aquarium, 'night-market': nightMarket, lighthouse, blueprint,
  plain,
}
export const DEFAULT_STYLE = 'lemon-lab'
