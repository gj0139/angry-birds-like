// 关卡 5（夜晚）：石基 + 木箱 + 冰柱 + 木顶盖塔，3 猪（顶/基座/地面）。
export default {
  theme: 'night',
  birds: 3,
  blocks: [
    { x: 980, y: 780, w: 200, h: 40, material: 'stone' }, // base on ground
    { x: 980, y: 730, w: 80, h: 60, material: 'wood' }, // box on base (bottom 760)
    { x: 955, y: 660, w: 25, h: 80, material: 'ice' }, // left ice col (bottom 700 = box top)
    { x: 1005, y: 660, w: 25, h: 80, material: 'ice' }, // right ice col
    { x: 980, y: 608, w: 140, h: 24, material: 'wood' }, // cap on ice cols (bottom 620)
  ],
  pigs: [
    { x: 980, y: 574 }, // on cap (top 596)
    { x: 905, y: 738 }, // on base beside box
    { x: 1150, y: 778 }, // ground outside
  ],
};
