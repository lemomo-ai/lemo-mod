// 打字机风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|头版头条，一字不改。|现在动手，一次就成。',
      '1|消息来源两处都核实了。|先写测试，再改代码。',
      '3|采访本上还缺一个数字。|再读一遍需求。',
      '2|稿子长了，先删一段。|把问题拆小一点。',
      '4|色带快用完了。|先备份，再动手。',
      '1|两篇稿子拼在一版，严丝合缝。|这次合并会很顺。',
      '2|校样上红笔不多。|小步提交，常对一下。',
      '3|稿子还没署名。|补上注释和文档。',
      '0|号外印好，报童已经出门。|可以发版了。',
      '5|没核实的消息别上头版。|今天别碰主分支。',
      '3|消息只有一个来源。|加日志，别靠猜。',
      '1|铅字排得整整齐齐。|放心重构。',
    ],
    en: [
      '0|Front page, not a word changed.|Start now, it works first try.',
      '1|Two sources, both confirmed.|Write the test, then the code.',
      '3|The notebook is missing one figure.|Read the requirements once more.',
      '2|The story runs long, cut a paragraph.|Break the problem into smaller parts.',
      '4|The ribbon is nearly worn through.|Back up first, then change things.',
      '1|Two stories lock up on one page.|This merge will go smoothly.',
      '2|Hardly any red ink on the proof.|Commit small, check often.',
      '3|The story has no byline yet.|Fill in the comments and docs.',
      '0|The extra is out, the newsboys are running.|Ship it.',
      '5|An unconfirmed rumor on page one.|Leave the main branch alone today.',
      '3|Only one source for the scoop.|Add logs instead of guessing.',
      '1|The type is set clean and straight.|Refactor with confidence.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。按稿子上了哪一版排
  ranks: {
    zh: ['头版头条', '头版', '要闻版', '内页', '中缝', '退稿'],
    en: ['Banner headline', 'Front page', 'Section front', 'Inside pages', 'Buried', 'Spiked'],
  },
  // 签筒名：卡片上签级上面的小字。报纸上的运势专栏
  tube: { zh: '{style} · 运势专栏', en: '{style} · Horoscope' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母。校样上的「已校 付印」章
  stamp: { zh: ['已校', '付印'], en: ['PROOF', 'OK'] },
}

export default words
