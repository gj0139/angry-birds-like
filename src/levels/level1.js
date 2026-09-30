// 关卡 1（教学）：门字形木架 + 1 猪，全木，≤2 层。
// 所有刚体精确贴合，避免加载瞬间自由落体造成摔伤。
export default {
  theme: 'day',
  birds: 3,
  blocks: [
    { x: 920, y: 740, w: 30, h: 120, material: 'wood' }, // left post (bottom 800)
    { x: 1030, y: 740, w: 30, h: 120, material: 'wood' }, // right post
    { x: 975, y: 665, w: 150, h: 30, material: 'wood' }, // lintel on posts (top 680)
  ],
  pigs: [{ x: 975, y: 778 }], // inside frame, resting on ground
};
