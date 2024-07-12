<script lang="ts">
  import Ripple from "./Ripple.svelte";

  export let variant: "filled" | "elevated" | "flat" | "outlined" | "text" = "filled";
  export let disabled = false;
  export let size: "small" | "medium" | "large" = "medium";
  export let block = false;
  export let icon = false;
  export let shrinkToIcon = false;
  export let formSubmit = false;
  export let loading = false;
  export let style = "";
  export let tabindex: number | undefined = undefined;
  let className = "";
  export { className as class };
</script>

<button
  type={formSubmit ? "submit" : "button"}
  class="{variant} {size} {className}"
  class:block
  class:loading
  class:icon
  class:shrinkToIcon
  on:click
  {disabled}
  {style}
  {tabindex}
>
  <!-- Without these conditions, .prepend and .append have a width because of their margin -->
  {#if $$slots.prepend}
    <div class="prepend">
      <slot name="prepend" />
    </div>
  {/if}
  <div class="content">
    <slot />
  </div>
  {#if $$slots.append}
    <div class="append">
      <slot name="append" />
    </div>
  {/if}
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
    justify-content: space-between;
    align-items: center;
    outline: none;
    border: 0;
    border-radius: 20px;
    cursor: pointer;
    padding: 0 1.2em;
    font-family: inherit;
    font-size: 0.75em;
    font-weight: 500;
    text-transform: uppercase;
    height: 2.7em;
    min-width: 3.2em;
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
    margin-right: 0.4em;
  }

  .append {
    margin-left: 0.4em;
  }

  .block {
    display: flex;
    /* By default, a button won't stretch */
    width: 100%;
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
    min-width: 2.5em;
    font-size: 0.6em;
  }

  .large {
    min-width: 3.7em;
    font-size: 0.9em;
  }

  .icon {
    width: 2.5em;
    height: 2.5em;
    font-size: 0.9em;
    padding: 0;
    min-width: initial;
    border-radius: 50%;
    /* In case it is placed in a flex container */
    flex-shrink: 0;
    justify-content: center;
  }

  .icon.small {
    font-size: 0.75em;
  }

  .icon.large {
    font-size: 1.25em;
  }

  @media (max-width: 960px) {
    .shrinkToIcon {
      padding: 0;
      width: 2.7em;
      min-width: initial;
      border-radius: 50%;
      justify-content: center;
      /* In case it is placed in a flex container */
      flex-shrink: 0;
    }

    .shrinkToIcon .content {
      display: none;
    }

    .shrinkToIcon .prepend,
    .shrinkToIcon .append {
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
