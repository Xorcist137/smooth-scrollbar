import * as I from '../interfaces/';
import { eventScope, getPosition } from '../utils/';

export function middleButtonHandler(scrollbar: I.Scrollbar) {
  // Skip initialization if middle mouse scrolling is disabled
  if (scrollbar.options.enableMiddleMouseScroll === false) {
    return;
  }

  const addEvent = eventScope(scrollbar);
  const container = scrollbar.containerEl;

  let isAutoScrolling = false;
  let clickPosition = { x: 0, y: 0 };
  let animationID = 0;

  function calculateScroll(currentPos: { x: number, y: number }): I.Data2d {
    // Calculate distance from original click
    const deltaX = currentPos.x - clickPosition.x;
    const deltaY = currentPos.y - clickPosition.y;

    // Dead zone radius
    const deadZone = 5;

    // Calculate distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If inside dead zone, don't scroll
    if (distance < deadZone) {
      return { x: 0, y: 0 };
    }

    // Simple scale factor for scroll speed
    const factor = 0.2;

    return {
      x: deltaX * factor,
      y: deltaY * factor,
    };
  }

  function startAutoScrolling(pos: { x: number, y: number }) {
    isAutoScrolling = true;
    clickPosition = pos;

    // Change cursor style to indicate auto-scrolling mode
    document.body.style.cursor = 'all-scroll';

    // Start scrolling loop
    animationID = requestAnimationFrame(updateScroll);
  }

  function stopAutoScrolling() {
    if (!isAutoScrolling) return;

    isAutoScrolling = false;
    cancelAnimationFrame(animationID);

    // Restore default cursor
    document.body.style.cursor = '';
  }

  function updateScroll() {
    if (!isAutoScrolling) return;

    // Calculate scroll amount
    const { x, y } = calculateScroll(currentMousePos);

    // Apply scroll
    scrollbar.addMomentum(x, y);

    // Continue scrolling
    animationID = requestAnimationFrame(updateScroll);
  }

  // Store current mouse position
  let currentMousePos = { x: 0, y: 0 };

  // Track mouse position
  addEvent(window, 'mousemove', (evt: MouseEvent) => {
    currentMousePos = getPosition(evt);
  });

  // Handle mouse down
  addEvent(container, 'mousedown', (evt: MouseEvent) => {
    // If middle button
    if (evt.button === 1) {
      // Prevent default (which might be opening links in new tab)
      evt.preventDefault();

      // Toggle auto-scrolling
      if (isAutoScrolling) {
        stopAutoScrolling();
      } else {
        startAutoScrolling(getPosition(evt));
      }
    } else if (isAutoScrolling) {
      // Any other mouse button stops auto-scrolling
      stopAutoScrolling();
    }
  });

  // Handle window blur
  addEvent(window, 'blur', () => {
    if (isAutoScrolling) {
      stopAutoScrolling();
    }
  });

  // Handle ESC key
  addEvent(window, 'keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'Escape' && isAutoScrolling) {
      stopAutoScrolling();
    }
  });
}
