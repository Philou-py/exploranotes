<script>
  export let checked = false;
  export let disabled = false;
  export let name = "";
  export let title = "";
  export let style = "";
  let className = "";
  export { className as class };
</script>

<label {title}>
  <slot name="left" />
  <input type="checkbox" bind:checked {disabled} {name} {style} class={className} />
  <slot name="right" />
</label>

<style lang="scss">
  $blue: #1867c0;

  label {
    display: block;
    padding: 0.5em 0;
  }

  input {
    width: 1.4em;
    height: 1.4em;
    vertical-align: bottom;
    margin-right: 0.5em;
    accent-color: $blue;
  }
</style>
