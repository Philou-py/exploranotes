<script lang="ts">
  import type { FormEventHandler } from "svelte/elements";
  import InputField from "./InputField.svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let type: "text" | "email" | "password" | "date" | "url" = "text";
  export let value = "";
  export let name = "";
  export let label = "";
  export let placeholder = "";
  export let autocomplete = "off";
  export let disabled = false;
  export let maxlength: number = 200;
  export let minlength: number | undefined = undefined;
  export let pattern: string | undefined = undefined;
  export let required = false;
  export let focused = false;
  export let hint = "";

  const ERRORS = {
    PATTERN_MISMATCH: "Ce champ est requis",
    TOO_LONG: `Longueur max : ${maxlength}`,
    TOO_SHORT: `Longueur min : ${minlength}`,
    TYPE_MISMATCH:
      type === "email"
        ? "Email invalide"
        : type === "url"
          ? "URL invalide"
          : type === "date"
            ? "Date invalide"
            : "",
    VALUE_MISSING: "Ce champ est requis.",
  };

  let state: "default" | "required" | "valid" | "error" = "default";
  // Browsers auto-fill date fields
  let active = type === "date";
  let showPlaceholder = false;
  let message = "";
  let dirty = false;
  let input: HTMLInputElement;

  const handleFocus = () => {
    active = true;
    focused = true;
    showPlaceholder = true;
    if (state === "default" || state === "valid") message = hint;
  };

  const handleBlur = () => {
    if (value === "" && type !== "date") active = false;
    focused = false;
    showPlaceholder = false;
    if (state === "default" || state === "valid") message = "";
  };

  $: {
    // Reset custom message for maxlength: the input will be valid if no other error is detected
    if (input) input.setCustomValidity("");

    // All variables should be figure for reactivity
    if (disabled) {
      state = "default";
      message = "";
      // Resetting 'value' is necessary, as when toggling props, 'input.validity'
      // does not take into account the new prop.
      value = "";
      dirty = false;
      handleBlur();
    } else if (input && dirty) {
      // maxlength is not placed on the input to allow the user to continue typing
      // even past the limit
      if (input.validity.valid && !(value.length > maxlength)) {
        state = "valid";
        message = hint;
      } else {
        if (required && input.validity.valueMissing) {
          message = ERRORS.VALUE_MISSING;
          state = "required";
        } else {
          if (minlength && input.validity.tooShort) message = ERRORS.TOO_SHORT;
          else if (value.length > maxlength) {
            message = ERRORS.TOO_LONG;
            input.setCustomValidity(`Veuillez entrer au maximum ${maxlength} caractères.`);
          } else if (type && input.validity.typeMismatch) message = ERRORS.TYPE_MISMATCH;
          else if (pattern && input.validity.patternMismatch) message = ERRORS.PATTERN_MISMATCH;
          state = "error";
        }
      }
    }
  }

  // Binding 'value' on the input is not allowed when 'type' is variable
  const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
    const input = event.currentTarget;
    value = input.value;
    if (!dirty) dirty = true;
  };
</script>

<div class="textField {state}" class:focused class:disabled>
  <div class="prepend">
    <slot name="prepend" />
  </div>

  <InputField label={label + (required ? " *" : "")} {active} {focused} let:id>
    <slot name="prependInner" slot="prependInner" />
    <slot name="appendInner" slot="appendInner" />

    <input
      {id}
      {value}
      {name}
      {type}
      {placeholder}
      {autocomplete}
      {minlength}
      {pattern}
      {required}
      {disabled}
      class:showPlaceholder
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      bind:this={input}
    />
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
  /* Old colours:
     $blue: #1867c0;
     $green: #3cbe72;
     $red: #ff5252;
  */

  $jesterRed: #9e1030;
  /* Princess blue */
  $blue: #00539c;
  /* Eden */
  $green: lighten(#264e36, 20%);
  /* Fiesta */
  $red: lighten(#dd4132, 10%);

  .textField {
    display: grid;
    color: rgb(0 0 0 / 0.7);
    grid-template-areas:
      "prepend field append"
      ". hints hints";
    grid-template-columns: min-content 1fr min-content;
    /* line-height must not impact the input nor the label to preserve
       their relative position */
    transition:
      color 250ms,
      opacity 250ms;

    &:hover {
      color: rgb(0 0 0 / 0.9);
    }

    &.focused {
      color: $blue;
      &:hover {
        color: darken($blue, 10%);
      }
    }

    &.valid {
      color: $green;
      &:hover,
      &.focused {
        color: darken($green, 10%);
      }
    }

    &.required {
      color: $jesterRed;
      &:hover,
      &.focused {
        color: darken($jesterRed, 10%);
      }
    }

    &.error {
      color: $red;
      &:hover,
      &.focused {
        color: darken($red, 10%);
      }

      /*
      :global(.label) {
        animation-name: shake;
        animation-duration: 0.9s;
      }
      */
    }

    &.disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  input {
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

    &::placeholder {
      color: transparent;
      transition: color 200ms;
    }

    &.showPlaceholder::placeholder {
      color: rgb(0 0 0 / 0.5);
    }
  }

  .prepend {
    grid-area: prepend;
    align-self: end;
    margin-right: 0.5em;
  }

  .hints {
    grid-area: hints;
    font-size: 0.8em;
    /* Include a small margin, so that characters are not clipped.
       Instead, they will overflow slightly under the hints div. */
    line-height: 1.1em;
    /* Set the height to prevent it from disappearing when it contains no text */
    height: 1em;
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
