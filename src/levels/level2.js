// 关卡 2：石基座 + 木柱框包冰芯 + 木顶盖，2 猪（屋顶 + 地面）。
export default {
  theme: 'forest',
  birds: 3,
  blocks: [
    { x: 980, y: 780, w: 160, h: 40, material: 'stone' }, // base on ground
    { x: 930, y: 710, w: 30, h: 100, material: 'wood' }, // left post (bottom 760 = base top)
    { x: 1030, y: 710, w: 30, h: 100, material: 'wood' }, // right post
    { x: 980, y: 710, w: 60, h: 100, material: 'ice' }, // ice core on base
    { x: 980, y: 645, w: 160, h: 30, material: 'wood' }, // cap on posts+ice (top 660)
  ],
  pigs: [
    { x: 980, y: 608 }, // on cap (cap top 630)
    { x: 1120, y: 778 }, // ground beside structure
  ],
};
