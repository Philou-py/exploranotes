<script>
  export let checked = false;
  export let disabled = false;
  export let name = "";
  export let value = "yes";
  export let title = "";
  export let style = "";
  let className = "";
  export { className as class };
</script>

<label {title} {style}>
  <slot name="left" />
  <input type="checkbox" bind:checked bind:value on:change {disabled} {name} class={className} />
  <slot name="right" />
</label>

<style lang="scss">
  /* Princess blue */
  $blue: #00539c;

  label {
    display: block;
  }

  input {
    width: 1.4em;
    height: 1.4em;
    vertical-align: bottom;
    margin: 0 0.5em;
    accent-color: $blue;
  }
</style>
