// 关卡 8（黎明终章）：石基双柱 + 冰台 + 木箱 + 冰顶六件塔，3 猪（塔内/塔顶/侧翼）。
export default {
  theme: 'dawn',
  birds: 3,
  blocks: [
    { x: 1000, y: 780, w: 240, h: 40, material: 'stone' }, // base (top 760)
    { x: 950, y: 705, w: 30, h: 110, material: 'wood' }, // left col (bottom 760, top 650)
    { x: 1050, y: 705, w: 30, h: 110, material: 'wood' }, // right col
    { x: 1000, y: 638, w: 180, h: 24, material: 'ice' }, // ice slab (bottom 650 = col tops)
    { x: 1000, y: 591, w: 70, h: 70, material: 'wood' }, // wood box (bottom 626 = slab top)
    { x: 1000, y: 536, w: 40, h: 40, material: 'ice' }, // ice crown (bottom 556 = box top)
  ],
  pigs: [
    { x: 1000, y: 738 }, // inside on base top (760)
    { x: 1000, y: 494 }, // on ice crown (top 516)
    { x: 1200, y: 778 }, // side wing
  ],
};
