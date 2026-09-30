// 关卡 6（雪地）：石柱木桥 + 冰块，3 猪（桥下/冰顶/地面）。
// 石柱 hp14，直拆代价高；打桥中段让整组塌落更划算。
export default {
  theme: 'snow',
  birds: 3,
  blocks: [
    { x: 920, y: 730, w: 30, h: 140, material: 'stone' }, // left pillar (bottom 800)
    { x: 1060, y: 730, w: 30, h: 140, material: 'stone' }, // right pillar
    { x: 990, y: 645, w: 200, h: 30, material: 'wood' }, // bridge (bottom 660 = pillar tops)
    { x: 990, y: 600, w: 60, h: 60, material: 'ice' }, // ice block on bridge (bottom 630)
  ],
  pigs: [
    { x: 990, y: 778 }, // under the bridge
    { x: 990, y: 548 }, // on ice block (top 570)
    { x: 1180, y: 778 }, // ground
  ],
};
