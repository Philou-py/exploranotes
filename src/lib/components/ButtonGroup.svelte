<script lang="ts">
  import { slide } from "svelte/transition";

  export let openByDefault = false;
  export let open = openByDefault;
  export let links: [string, string][] = [];

  const toggle = () => (open = !open);
</script>

<slot name="trigger" {toggle} />
{#if open}
  <div transition:slide={{ duration: 250 }}>
    <slot />
    {#each links as [link, text] (link)}
      <a href={link} tabindex="-1">
        <slot name="btn" {text} />
      </a>
    {/each}
  </div>
{/if}

<style>
  div {
    margin-left: 10px;
  }
</style>
