<script lang="ts">
  import { alternateColours } from "$lib/utilities";

  export let bgColour = "pepper-stem";
  export let style = "";
  export let size: "small" | "medium" | "large" = "small";
</script>

<div
  class={`chip ${size}`}
  style:color={alternateColours.get(bgColour) || "white"}
  style:background-color={bgColour}
  {style}
>
  {#if $$slots.prepend}
    <div class="prepend">
      <slot name="prepend" />
    </div>
  {/if}

  <slot />

  {#if $$slots.append}
    <div class="append">
      <slot name="append" />
    </div>
  {/if}
</div>

<style>
  .chip {
    display: inline flex;
    position: relative;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    padding: 0.15em 0.3em;
    border-radius: 0.5em;
  }

  .chip.medium {
    padding: 0.25em 0.4em;
  }

  .chip.large {
    padding: 0.35em 0.5em;
  }

  .prepend {
    margin-right: 0.4em;
  }

  .append {
    margin-left: 0.4em;
  }
</style>
