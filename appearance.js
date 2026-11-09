// Appearance remains usable while game data loads or planner initialization fails.
(() => {
  const root = document.documentElement;
  for (const [id, attribute, key, allowed, fallback] of [
    ['style-choice', 'style', 'umaplan-style', ['tokyo', 'nakayama', 'kyoto', 'hanshin', 'chukyo', 'sapporo', 'hakodate', 'fukushima', 'niigata', 'kokura', 'okinawa'], 'tokyo'],
    ['theme-choice', 'theme', 'umaplan-theme', ['system', 'light', 'dark'], 'system'],
  ]) {
    const control = document.getElementById(id);
    if (!control) continue;
    control.value = allowed.includes(root.dataset[attribute]) ? root.dataset[attribute] : fallback;
    const apply = () => {
      const value = allowed.includes(control.value) ? control.value : fallback;
      root.dataset[attribute] = value;
      try { localStorage.setItem(key, value); } catch { /* Session-only when storage is unavailable. */ }
    };
    control.addEventListener('input', apply);
    control.addEventListener('change', apply);
  }
})();
