import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KEYWORDS = [
  // 项目
  { type: 'PROJECT', char: '诵', name: '朗诵' },
  { type: 'PROJECT', char: '威', name: '紫威' },
  { type: 'PROJECT', char: '翔', name: '飞翔' },
  // 演员
  { type: 'ACTOR', char: '洋', name: '梓洋' },
  { type: 'ACTOR', char: '威', name: '紫威' },
  { type: 'ACTOR', char: '翔', name: '鹏飞' },
  { type: 'ACTOR', char: '素', name: '素人' },
  { type: 'ACTOR', char: '数', name: '数字人' },
  // 编导
  { type: 'EDITOR', char: '塔', name: '波塔' },
  { type: 'EDITOR', char: '峰', name: '杨鉴峰' },
  { type: 'EDITOR', char: '丹', name: '赵丹丹' },
  { type: 'EDITOR', char: '赵', name: '赵丹丹' },
  { type: 'EDITOR', char: '娟', name: '杜娟' },
  { type: 'EDITOR', char: '滢', name: '邝滢' },
  { type: 'EDITOR', char: '富', name: '李有富' },
  // 剪辑
  { type: 'CUTTER', char: '隽', name: '马先隽' },
  { type: 'CUTTER', char: '歌', name: '高志歌' },
  { type: 'CUTTER', char: '俊', name: '邓俊' },
  { type: 'CUTTER', char: '希', name: '卢瑞希' },
  { type: 'CUTTER', char: '茵', name: '林舒茵' },
  { type: 'CUTTER', char: '志', name: '高志歌' },
  // 投放
  { type: 'INVESTOR', char: '娟', name: '林杏娟' },
  { type: 'INVESTOR', char: '玉', name: '钟小玉' },
  { type: 'INVESTOR', char: '宠', name: '周宠' },
  { type: 'INVESTOR', char: '亮', name: '丁明亮' },
  { type: 'INVESTOR', char: '霞', name: '韦静霞' },
  { type: 'INVESTOR', char: '阳', name: '林阳阳' },
  { type: 'INVESTOR', char: '初', name: '董映初' },
  { type: 'INVESTOR', char: '梅', name: '陈婉梅' },
  { type: 'INVESTOR', char: '青', name: '唐青青' },
  { type: 'INVESTOR', char: '飞', name: '王飞' },
  { type: 'INVESTOR', char: '武', name: '章鹏武' },
  { type: 'INVESTOR', char: '跃', name: '林怀跃' },
  { type: 'INVESTOR', char: '娇', name: '连天娇' },
  { type: 'INVESTOR', char: '鹏', name: '李桂鹏' },
  { type: 'INVESTOR', char: '如', name: '王如如' },
  { type: 'INVESTOR', char: '帆', name: '杨帆' },
  { type: 'INVESTOR', char: '佩', name: '林哲佩' },
  { type: 'INVESTOR', char: '桢', name: '刘桢' },
  { type: 'INVESTOR', char: '雨', name: '王雨' },
  { type: 'INVESTOR', char: '逍', name: '熊逍' },
  { type: 'INVESTOR', char: '泽', name: '李浩泽' },
  { type: 'INVESTOR', char: '强', name: '吴伟强' },
  { type: 'INVESTOR', char: '博', name: '刘博' },
  { type: 'INVESTOR', char: '昊', name: '钟昊' },
  { type: 'INVESTOR', char: '杰', name: '刘俊杰' },
  { type: 'INVESTOR', char: '婷', name: '朱婷' },
  { type: 'INVESTOR', char: '昵', name: '刘小昵' },
  { type: 'INVESTOR', char: '炜', name: '林泽炜' },
  { type: 'INVESTOR', char: '涛', name: '杨涛' },
  { type: 'INVESTOR', char: '莎', name: '陈莎' },
  { type: 'INVESTOR', char: '丹', name: '王丹丹' },
  { type: 'INVESTOR', char: '心', name: '赵文心' },
  { type: 'INVESTOR', char: '磊', name: '李磊' },
  { type: 'INVESTOR', char: '勤', name: '周祥勤' },
  { type: 'INVESTOR', char: '言', name: '李言' },
  { type: 'INVESTOR', char: '健', name: '邱健' },
  { type: 'INVESTOR', char: '念', name: '熊念' },
  { type: 'INVESTOR', char: '娜', name: '张娜' },
  { type: 'INVESTOR', char: '倩', name: '李倩' },
  { type: 'INVESTOR', char: '通', name: '通用' },
  { type: 'INVESTOR', char: '琦', name: '王文琦' },
  { type: 'INVESTOR', char: '雪', name: '徐冬雪' },
  { type: 'INVESTOR', char: '华', name: '张精华' },
  { type: 'INVESTOR', char: '盼', name: '欧阳盼' },
]

async function main() {
  let created = 0
  let skipped = 0
  for (const kw of KEYWORDS) {
    try {
      await prisma.keyword.upsert({
        where: { type_char: { type: kw.type, char: kw.char } },
        update: { name: kw.name },
        create: kw,
      })
      created++
    } catch (e) {
      console.error(`跳过 ${kw.type} ${kw.char}:`, e)
      skipped++
    }
  }
  console.log(`✅ 关键词写入完成：${created} 条，跳过 ${skipped} 条`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
