// 邮筒风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
// 在这个风格里，抽签是从明信片架上抽一张：签级是这封信走的邮路，从特快专递到原件退回
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '1|地址写全，邮编对上。|先把接口的输入输出写清楚。',
      '0|邮票贴正，邮戳清楚。|现在动手，一次就成。',
      '2|信封太厚，分两封寄。|一个提交只做一件事。',
      '3|邮资还差一角。|缺的那一步补上，再说做完了。',
      '4|收件人搬家了。|先确认路径和配置还在。',
      '1|风雨天，邮差照样准时。|放心重构。',
      '3|邮戳盖糊了。|日志写清楚，别靠猜。',
      '0|挂号信，签收了。|可以发版了。',
      '5|信一投进邮筒，就拿不回来了。|今天别强推，也别碰主分支。',
      '2|回执还没寄回来。|等测试跑完再下结论。',
      '3|信里忘了夹照片。|补上注释和文档。',
      '4|包裹在分拣中心压了三天。|卡住了，就把问题拆小。',
    ],
    en: [
      '1|Full address, matching postcode.|Pin down the inputs and outputs first.',
      '0|Stamp on straight, postmark crisp.|Go ahead, it works the first time.',
      '2|Too thick for one envelope, so send two.|One commit, one change.',
      '3|Ten cents short on postage.|Finish the missing step before calling it done.',
      '4|The recipient has moved.|Check that the paths and config still exist.',
      '1|The carrier shows up on time, rain or shine.|Refactor with confidence.',
      '3|The postmark came out smudged.|Write clear logs instead of guessing.',
      '0|The registered letter was signed for.|Ship it.',
      '5|Once it is in the mailbox, it is gone.|No force pushes today, and leave main alone.',
      '2|The receipt has not come back yet.|Wait for the tests before you decide.',
      '3|The photo never made it into the envelope.|Add the missing comments and docs.',
      '4|The parcel sat at the depot for three days.|When stuck, cut the problem smaller.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['特快专递', '挂号信', '平信', '欠资', '滞留', '退信'],
    en: ['Express', 'Registered', 'Standard', 'Postage due', 'Held up', 'Return to sender'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 明信片架', en: '{style} · Postcard rack' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['吉日', '邮戳'], en: ['POST', 'MARK'] },
}

export default words
