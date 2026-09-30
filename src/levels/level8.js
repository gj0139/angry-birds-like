// 关卡 8（黎明终章）：复合要塞——冰盾掩体猪 + 石基 + 石塔木帽 + 高木塔。
// 三猪三地势：掩体后、塔帽上、高塔顶；3 鸟零容错。
export default {
  theme: 'dawn',
  birds: 3,
  blocks: [
    { x: 905, y: 750, w: 30, h: 100, material: 'ice' }, // ice shield (bottom 800)
    { x: 1060, y: 780, w: 280, h: 40, material: 'stone' }, // base (bottom 800, top 760)
    { x: 1060, y: 700, w: 40, h: 120, material: 'stone' }, // stone tower (bottom 760, top 640)
    { x: 1060, y: 628, w: 80, h: 24, material: 'wood' }, // cap on tower (bottom 640)
    { x: 1120, y: 700, w: 30, h: 80, material: 'stone' }, // side wall on base (bottom 760)
    { x: 1180, y: 680, w: 40, h: 160, material: 'wood' }, // tall wood tower (bottom 760, top 600)
  ],
  pigs: [
    { x: 960, y: 738 }, // behind shield, on base (top 760)
    { x: 1060, y: 594 }, // on cap (top 616)
    { x: 1180, y: 578 }, // on tall tower (top 600)
  ],
};
