
// Helper function to robustly check if an element is visible to the user
export const isElementVisible = (el) => {
  if (!el || !document.body.contains(el)) {
    return false;
  }

  // An element is not visible if it or an ancestor has display: none.
  // 'offsetParent' is null for such elements, except for 'position: fixed'.
  if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') {
    return false;
  }
  
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
    return false;
  }

  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
};
