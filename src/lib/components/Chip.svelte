<script lang="ts">
  export let bgColour = "var(--pepper-stem)";
  export let style = "";
</script>

<span class="chip" style:background-color={bgColour} {style}>
  <slot />
</span>

<style>
  .chip {
    display: inline-block;
    text-align: center;
    color: white;
    padding: 0.15em 0.3em;
    border-radius: 0.5em;
  }
</style>
