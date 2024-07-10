<script lang="ts">
  import { slide } from "svelte/transition";

  export let openByDefault = false;
  export let open = openByDefault;

  const toggle = () => open = !open;
</script>

<slot name="trigger" {toggle} />
{#if open}
  <div transition:slide={{ duration: 250 }}>
    <slot />
  </div>
{/if}

<style>
  div {
    margin-left: 10px;
  }
</style>
