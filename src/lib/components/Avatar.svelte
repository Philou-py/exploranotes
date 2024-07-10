<script lang="ts">
  export let name = "";
  export let style = "";

  $: initials = name
    .split(" ")
    .map((part) => (part[0] ? part[0].toUpperCase() : ""))
    .join("");
</script>

<div class="avatarContainer" {style}>
  <span class="initials">{initials}</span>
</div>

<style>
  .avatarContainer {
    width: var(--size, 50px);
    height: var(--size, 50px);
    display: flex;
    justify-content: center;
    align-items: center;
    border-color: var(--princess-blue);
    border-radius: 50%;
    background-color: var(--aspen-gold);
  }

  .initials {
    font-size: 1.2em;
    text-align: center;
  }
</style>
