// 关卡 4（沙漠）：石柱门 + 木楣，2 猪（门顶 + 门内）。
export default {
  theme: 'desert',
  birds: 3,
  blocks: [
    { x: 930, y: 750, w: 40, h: 100, material: 'stone' }, // left pillar (bottom 800)
    { x: 1050, y: 750, w: 40, h: 100, material: 'stone' }, // right pillar
    { x: 990, y: 685, w: 180, h: 30, material: 'wood' }, // lintel on pillars (bottom 700)
  ],
  pigs: [
    { x: 990, y: 648 }, // on lintel (top 670)
    { x: 990, y: 778 }, // inside the gate
  ],
};
