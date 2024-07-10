<script lang="ts" context="module">
  const cancelEvents = ["touchcancel", "mouseleave", "dragstart"];

  function startRipple(
    trigger: HTMLElement,
    event: MouseEvent | Touch,
    eventType: "mousedown" | "touchstart",
  ) {
    const circle = document.createElement("span");
    const diameter = Math.max(trigger.clientWidth, trigger.clientHeight);
    const rect = trigger.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter * 2}px`;
    circle.style.left = `${event.clientX - rect.left - diameter}px`;
    circle.style.top = `${event.clientY - rect.top - diameter}px`;
    circle.style.animation = "showRipple 250ms ease forwards";
    circle.className = "ripple";

    const removeRipple = () => {
      cancelEvents.forEach((name) => document.removeEventListener(name, removeRipple));
      circle.style.animation = "hideRipple 250ms cubic-bezier(0.1, -0.01, 0.58, 1) forwards";
      setTimeout(() => circle.remove(), 300);
    };

    let startTime = performance.now();
    const endRipple = () => {
      let elapsed = performance.now() - startTime;
      setTimeout(removeRipple, Math.max(0, 250 - elapsed));
    };

    const releaseEvent = eventType === "mousedown" ? "mouseup" : "touchend";
    trigger.addEventListener(releaseEvent, endRipple, { once: true });

    cancelEvents.forEach((name) => trigger.addEventListener(name, endRipple, { passive: true }));

    trigger.appendChild(circle);
  }

  const handleMouseDown = (event: MouseEvent) => {
    // Trigger on left click only
    if (event.button !== 0) {
      return;
    }
    startRipple(event.currentTarget as HTMLElement, event, "mousedown");
  };

  const handleTouchStart = (event: TouchEvent) => {
    for (const touch of event.changedTouches) {
      startRipple(event.currentTarget as HTMLElement, touch, "touchstart");
    }
  };
</script>

<script lang="ts">
  import type { Action } from "svelte/action";

  const bindRipple: Action = (rippleContainer) => {
    const trigger = rippleContainer.parentElement;
    if (!trigger) {
      console.error("This ripple container has no parent element!");
      return {};
    }
    trigger.addEventListener("touchstart", handleTouchStart, { passive: true });
    trigger.addEventListener("mousedown", handleMouseDown, { passive: true });
    return {
      destroy() {
        trigger.removeEventListener("mousedown", handleMouseDown);
        trigger.removeEventListener("touchstart", handleTouchStart);
      },
    };
  };
</script>

<!-- Prevent this div from having a box and taking part in a flex layout for example -->
<div use:bindRipple style="display: contents" />

<style>
  @keyframes -global-showRipple {
    from {
      transform: scale(0.2);
      opacity: 0.5;
    }

    to {
      transform: scale(1);
      opacity: 0.9;
    }
  }

  @keyframes -global-hideRipple {
    from {
      transform: scale(1);
      opacity: 0.9;
    }

    to {
      transform: scale(1.8);
      opacity: 0;
    }
  }

  :global(.ripple) {
    position: absolute;
    pointer-events: none;
    border-radius: 50%;
    background-color: color-mix(in srgb, var(--c2) 25%, transparent);
  }
</style>
