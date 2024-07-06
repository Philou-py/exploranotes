<script lang="ts">
  import Ripple from "./Ripple.svelte";

  export let variant: "filled" | "elevated" | "flat" | "outlined" | "text" = "filled";
  export let disabled = false;
  export let size: "small" | "medium" | "large" = "medium";
  export let block = false;
  export let icon = false;
  export let shrinkToIcon = false;
  export let loading = false;
  export let style = "";
  let className = "";
  export { className as class };
</script>

<button
  class="{variant} {size} {className}"
  class:block
  class:loading
  class:icon
  class:shrinkToIcon
  {disabled}
  {style}
  on:click
>
  <div class="prepend">
    <slot name="prepend" />
  </div>
  <div class="content">
    <slot />
  </div>
  <div class="append">
    <slot name="append" />
  </div>
  <Ripple />
</button>

<style>
  button {
    /* c1: background - c2: text */
    --c1: var(--primary, white);
    --c2: var(--secondary, black);
    color: var(--c2);
    background-color: var(--c1);
    box-sizing: border-box;
    display: inline flex;
    position: relative;
    justify-content: center;
    align-items: center;
    outline: none;
    border: 0;
    border-radius: 20px;
    cursor: pointer;
    padding: 0 1.2em;
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    text-transform: uppercase;
    height: 2.7em;
    min-width: 64px;
    max-width: 100%;
    /* To hide the ripple outside the button */
    overflow: hidden;
    transition:
      background 250ms,
      width 250ms,
      height 250ms,
      color 250ms,
      font-size 250ms,
      box-shadow 250ms,
      outline 50ms;
  }

  .content {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  button:hover {
    text-decoration: none;
    background-color: color-mix(in srgb, var(--c1) 90%, var(--c2));
  }

  button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--c1) 50%, var(--c2));
  }

  button:disabled {
    --c1: color-mix(in srgb, var(--primary, white) 30%, transparent);
    --c2: color-mix(in srgb, var(--secondary, black) 30%, transparent);
    box-shadow: none !important;
    pointer-events: none;
  }

  .prepend {
    margin-right: 8px;
  }

  .append {
    margin-left: 8px;
  }

  .block {
    display: flex;
  }

  .filled:hover {
    box-shadow:
      0 3px 1px -2px rgb(0 0 0 / 0.2),
      0 2px 2px 0 rgb(0 0 0 / 0.14),
      0 1px 5px 0 rgb(0 0 0 / 0.12);
  }

  .filled:active {
    box-shadow: none;
  }

  .elevated {
    box-shadow:
      0 3px 1px -2px rgb(0 0 0 / 0.2),
      0 2px 2px 0 rgb(0 0 0 / 0.14),
      0 1px 5px 0 rgb(0 0 0 / 0.12);
  }

  .elevated:hover {
    box-shadow:
      0px 2px 2px -1px rgba(0 0 0 / 0.2),
      0px 4px 3px rgba(0 0 0 / 0.14),
      0px 1px 6px rgba(0 0 0 / 0.12);
  }

  .elevated:active {
    box-shadow:
      0 0px 1px -1px rgba(0 0 0 / 0.2),
      0 2px 2px rgba(0 0 0 / 0.14),
      0 1px 3px rgba(0 0 0 / 0.12);
  }

  .outlined,
  .text {
    --c1: var(--secondary, transparent);
    --c2: var(--primary, black);
    border: 1px solid var(--c2);
  }

  .outlined:disabled,
  .text:disabled {
    --c1: color-mix(in srgb, var(--secondary, transparent) 30%, transparent);
    --c2: color-mix(in srgb, var(--primary, black) 30%, transparent);
  }

  .text {
    border: 0;
  }

  .small {
    min-width: 50px;
    font-size: 12px;
  }

  .large {
    min-width: 74px;
    font-size: 18px;
  }

  .icon {
    width: 50px;
    height: 50px;
    font-size: 18px;
    padding: 0;
    min-width: initial;
    border-radius: 50%;
    /* In case it is placed in a flex container */
    flex-shrink: 0;
  }

  .icon.small {
    width: 40px;
    height: 40px;
    font-size: 15px;
  }

  .icon.large {
    width: 60px;
    height: 60px;
    font-size: 25px;
  }

  @media (max-width: 960px) {
    .shrinkToIcon {
      padding: 0;
      width: 2.7em;
      min-width: initial;
      border-radius: 50%;
      /* In case it is placed in a flex container */
      flex-shrink: 0;
    }

    .shrinkToIcon .content {
      display: none;
    }

    .shrinkToIcon .prepend, .shrinkToIcon .append {
      margin: 0;
    }
  }

  .loading,
  .loading * {
    color: transparent;
    pointer-events: none;
  }

  .loading::after {
    content: "";
    position: absolute;
    width: 0.8em;
    height: 0.8em;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    border: 4px solid transparent;
    border-top-color: var(--c2);
    border-radius: 50%;
    animation: button-loading-spinner 1s ease infinite;
  }

  @keyframes button-loading-spinner {
    from {
      transform: rotate(0turn);
    }

    to {
      transform: rotate(1turn);
    }
  }
</style>
