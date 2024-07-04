<script lang="ts" context="module">
</script>

<script lang="ts">
  import type { FormEventHandler } from "svelte/elements";
  import InputField from "./InputField.svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let type: "text" | "email" | "password" | "date" | "url" = "text";
  export let value = "";
  export let label = "";
  export let placeholder = "";
  export let disabled = false;
  export let maxlength: number = 200;
  export let minlength: number | undefined = undefined;
  export let pattern: string | undefined = undefined;
  export let required = false;
  export let fullWidth = false;
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

  const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
    const input = event.currentTarget;
    value = input.value;

    if (input.validity.valid && !(value.length > maxlength)) {
      state = "valid";
      message = hint;
      return;
    }

    if (input.validity.valueMissing) {
      message = ERRORS.VALUE_MISSING;
      state = "required";
      return;
    } else if (input.validity.tooShort) message = ERRORS.TOO_SHORT;
    else if (value.length > maxlength) message = ERRORS.TOO_LONG;
    else if (input.validity.typeMismatch) message = ERRORS.TYPE_MISMATCH;
    else if (input.validity.patternMismatch) message = ERRORS.PATTERN_MISMATCH;
    state = "error";
  };
</script>

<div class="textField {state}" class:focused class:fullWidth>
  <div class="prepend">
    <slot name="prepend" />
  </div>

  <InputField label={label + (required ? " *" : "")} {active} {focused} let:id>
    <slot name="prependInner" slot="prependInner" />
    <slot name="appendInner" slot="appendInner" />

    <input
      {id}
      {value}
      {type}
      {placeholder}
      {minlength}
      {pattern}
      {required}
      {disabled}
      class:showPlaceholder
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
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
  $blue: #1867c0;
  $green: #3cbe72;
  $dark-red: #9e1030;
  $red: #ff5252;

  .textField {
    display: inline grid;
    color: rgb(0 0 0 / 0.7);
    grid-template-areas:
      "prepend field append"
      ". hints hints";
    grid-template-columns: min-content 1fr min-content;
    /* line-height must not impact the input nor the label to preserve
       their relative position */
    transition: color 250ms;

    &.fullWidth {
      display: grid;
    }

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
      color: $dark-red;
      &:hover,
      &.focused {
        color: darken($dark-red, 10%);
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
  }

  input {
    font-family: inherit;
    color: black;
    border: none;
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
