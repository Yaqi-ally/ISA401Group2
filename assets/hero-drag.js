(function () {
  "use strict";

  var stage = document.querySelector("[data-draggable-stage]");
  if (!stage) return;

  var active = null;
  var pointerId = null;
  var startX = 0;
  var startY = 0;
  var baseTransform = "";
  var keyboardState = new WeakMap();

  stage.addEventListener("pointerdown", function (event) {
    var item = event.target.closest("[data-drag-item]");
    if (!item || event.button !== 0) return;
    event.preventDefault();
    active = item;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    baseTransform = getComputedStyle(item).transform;
    if (baseTransform === "none") baseTransform = "";
    item.classList.add("is-dragging");
    item.setPointerCapture?.(event.pointerId);
  });

  stage.addEventListener("pointermove", function (event) {
    if (!active) return;
    active.style.transform =
      "translate(" +
      (event.clientX - startX) +
      "px, " +
      (event.clientY - startY) +
      "px) " +
      baseTransform;
  });

  function finish() {
    if (active && pointerId !== null) {
      try {
        active.releasePointerCapture?.(pointerId);
      } catch (_) {
        // The browser may have released the pointer already.
      }
    }
    active?.classList.remove("is-dragging");
    active = null;
    pointerId = null;
  }

  stage.addEventListener("pointerup", finish);
  stage.addEventListener("pointercancel", finish);

  stage.addEventListener("keydown", function (event) {
    var item = event.target.closest("[data-drag-item]");
    if (!item || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.key) < 0) {
      return;
    }
    event.preventDefault();
    var current = keyboardState.get(item) || {
      x: 0,
      y: 0,
      base:
        getComputedStyle(item).transform === "none"
          ? ""
          : getComputedStyle(item).transform,
    };
    if (event.key === "ArrowLeft") current.x -= 10;
    if (event.key === "ArrowRight") current.x += 10;
    if (event.key === "ArrowUp") current.y -= 10;
    if (event.key === "ArrowDown") current.y += 10;
    keyboardState.set(item, current);
    item.style.transform =
      "translate(" + current.x + "px, " + current.y + "px) " + current.base;
  });
})();
