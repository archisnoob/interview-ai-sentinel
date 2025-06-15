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

export const getElementScore = (el) => {
  let score = 0;
  try {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex, 10) || 0;
    const position = style.position;
    const className = el.className && typeof el.className === 'string' ? el.className.toLowerCase() : '';
    const id = el.id ? el.id.toLowerCase() : '';
    const innerText = el.innerText ? el.innerText.toLowerCase() : '';

    if (['fixed', 'absolute'].includes(position)) score += 1;
    if (zIndex > 9999) score += 1;
    if (className.includes('assistant') || id.includes('ai')) score += 1;
    if (/ask me anything|how can i help|ai assistant/i.test(innerText)) score += 1;

    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        const elementArea = rect.width * rect.height;
        const screenArea = window.innerWidth * window.innerHeight;
        if (elementArea > 0.5 * screenArea) score += 1;
    }
  } catch (e) {
    // Ignore elements that can't be processed
  }
  
  return score;
};
