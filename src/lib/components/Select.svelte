<script lang="ts">
  import InputField from "./InputField.svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let value = "";
  export let name = "";
  export let label = "";
  export let items: [string, string][] = [];
  export let disabled = false;
  export let readonly = false;
  export let required = false;
  export let focused = false;
  export let hint = "";

  let active = false;
  let message = "";

  const handleFocus = () => {
    active = true;
    focused = true;
    message = hint;
  };

  const handleBlur = () => {
    if (value === "") active = false;
    focused = false;
    message = "";
  };

  // Lift label when input is not empty, not only on focus
  $: if (value) active = true;
</script>

<div class="textField" class:focused class:disabled={disabled || readonly}>
  <div class="prepend">
    <slot name="prepend" />
  </div>

  <InputField label={label + (required ? " *" : "")} {active} {focused} let:id>
    <slot name="prependInner" slot="prependInner" />
    <slot name="appendInner" slot="appendInner" />

    <select
      {id}
      {name}
      {required}
      {disabled}
      bind:value
      on:focus={handleFocus}
      on:blur={handleBlur}
      tabindex={readonly ? -1 : undefined}
    >
      <option value="" hidden />
      {#each items as [val, text]}
        <option value={val}>{text}</option>
      {/each}
    </select>
  </InputField>

  <div class="append">
    <slot name="append" />
  </div>

  <div class="hints">
    {#key message}
      <p transition:slide={{ duration: 250, easing: cubicOut }}>
        {message}
      </p>
    {/key}
  </div>
</div>

<style lang="scss">
  $blue: #1867c0;

  .textField {
    display: grid;
    color: rgb(0 0 0 / 0.7);
    grid-template-areas:
      "prepend field append"
      ". hints hints";
    grid-template-columns: min-content 1fr min-content;
    /* line-height must not impact the input nor the label to preserve
       their relative position */
    transition: color 250ms;

    &:hover {
      color: rgb(0 0 0 / 0.9);
    }

    &.focused {
      color: $blue;
      &:hover {
        color: darken($blue, 10%);
      }
    }

    &.disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  select {
    font-family: inherit;
    color: black;
    border: none;
    flex-grow: 1;
    outline: 0;
    padding: 0;
    background-color: transparent;
    font-size: inherit;
    /* If not set, browser styles will prevent it from shrinking */
    min-width: 0;
    line-height: var(--contentHeight);
    transition: background-color 250ms linear;
  }

  .prepend {
    grid-area: prepend;
    align-self: end;
    margin-right: 0.5em;
  }

  .hints {
    grid-area: hints;
    font-size: 0.8em;
    line-height: 1em;
    /* Add a small margin, so that characters are not clipped */
    height: 1.1em;
    margin-top: 0.4em;

    & > p {
      /* Prevent generic `p` styles from applying */
      font-size: inherit;
      line-height: inherit;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
