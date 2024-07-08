<script lang="ts">
  export let show = false;
  export let closeOnBgClick = false;
  let bgElt: HTMLDivElement;

  const handleBgClick = (event: MouseEvent) => {
    if (closeOnBgClick && event.target === bgElt) {
      show = false;
    }
  };

  const keyboardClose = (event: KeyboardEvent) => {
    if (event.code === "Escape") show = false;
  };

  // An element will not focus if it is not visible.
  $: if (show) bgElt.addEventListener("transitionend", () => bgElt.focus(), { once: true });
</script>

<div
  class="bg"
  class:show
  bind:this={bgElt}
  on:click={handleBgClick}
  on:keydown={keyboardClose}
  tabindex="-1"
  role="presentation"
>
  <div class="modal">
    <slot />
  </div>
</div>

<style>
  .bg {
    top: 0;
    left: 0;
    position: fixed;
    background: rgb(0 0 0 / 0.5);
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    /* Transitioning `visibility` creates a delay: regardless of the direction,
     during the transition, `visibility` will be set to `visible`. */
    transition:
      opacity 200ms ease-out,
      visibility 200ms;
  }

  .modal {
    max-height: 95%;
    overflow: auto;
    visibility: hidden;
    transform: scale(40%);
    transition:
      transform 200ms ease-out,
      visibility 200ms;
  }

  .show {
    opacity: 1;
    visibility: visible;
  }

  .show .modal {
    transform: scale(100%);
    visibility: visible;
  }
</style>
