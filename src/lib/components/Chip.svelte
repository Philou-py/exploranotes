<script lang="ts">
  import { alternateColours } from "$lib/utilities";

  export let bgColour = "pepper-stem";
  export let style = "";
  export let size: "small" | "medium" | "large" = "small";
</script>

<span
  class={`chip ${size}`}
  style:color={alternateColours.get(bgColour) || "white"}
  style:background-color={bgColour}
  {style}
>
  <slot />
</span>

<style>
  .chip {
    display: inline-block;
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
</style>
