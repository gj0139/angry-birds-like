// 关卡 10（水域）：沉底石塔 + 侧墩，5 猪分布在高台与池底。
export default {
  theme: 'water',
  water: { x: 460, y: 560, w: 820, h: 240 },
  birds: 3,
  blocks: [
    { x: 960, y: 760, w: 80, h: 80, material: 'stone' }, // tower base (bottom 800)
    { x: 960, y: 695, w: 80, h: 50, material: 'wood' }, // on base (bottom 720)
    { x: 960, y: 650, w: 50, h: 40, material: 'ice' }, // on wood (bottom 670)
    { x: 1190, y: 770, w: 60, h: 60, material: 'stone' }, // side block (edge 1220)
  ],
  pigs: [
    { x: 960, y: 608 }, // on ice (top 630)
    { x: 1190, y: 718 }, // on side block
    { x: 1040, y: 778 },
    { x: 1100, y: 778 },
    { x: 1250, y: 778 },
  ],
};
