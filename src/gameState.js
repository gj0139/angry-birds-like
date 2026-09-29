export function createGame(birdsRemaining, pigsRemaining) {
  return { phase: 'aiming', birdsRemaining, pigsRemaining, stars: 0, launchAt: null };
}

export function reduce(state, event) {
  switch (event.type) {
    case 'DRAG_START':
      return state.phase === 'aiming' ? { ...state, phase: 'dragging' } : state;
    case 'DRAG_CANCEL':
      return state.phase === 'dragging' ? { ...state, phase: 'aiming' } : state;
    case 'LAUNCH':
      if (state.phase !== 'dragging') return state;
      return {
        ...state,
        phase: 'flying',
        birdsRemaining: state.birdsRemaining - 1,
        launchAt: event.now,
      };
    case 'PIG_DIED':
      return { ...state, pigsRemaining: Math.max(0, state.pigsRemaining - 1) };
    case 'SETTLED': {
      if (state.phase !== 'flying') return state;
      if (state.pigsRemaining === 0) {
        return { ...state, phase: 'won', stars: Math.min(state.birdsRemaining + 1, 3) };
      }
      if (state.birdsRemaining === 0) return { ...state, phase: 'lost' };
      return { ...state, phase: 'aiming' };
    }
    case 'RESTART':
      return createGame(event.birds, event.pigs);
    default:
      return state;
  }
}
