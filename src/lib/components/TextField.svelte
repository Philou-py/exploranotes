<script lang="ts" context="module">
</script>

<script lang="ts">
  import type { FormEventHandler } from "svelte/elements";
  import InputField from "./InputField.svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
    import {tick} from "svelte";

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

  const setMsg = async (msg: string) => {
      message = "";
      await tick();
      message = msg;
  };

  const handleInput: FormEventHandler<HTMLInputElement> = async (event) => {
    const input = event.currentTarget;
    value = input.value;

    if (input.validity.valid && !(value.length > maxlength)) {
      await setMsg("valid");
      return;
    }

    if (input.validity.valueMissing) {
      await setMsg(ERRORS.VALUE_MISSING);
      state = "required";
      return;
    } else if (input.validity.tooShort) await setMsg(ERRORS.TOO_SHORT);
    else if (value.length > maxlength) await setMsg(ERRORS.TOO_LONG);
    else if (input.validity.typeMismatch) await setMsg(ERRORS.TYPE_MISMATCH);
    else if (input.validity.patternMismatch) await setMsg(ERRORS.PATTERN_MISMATCH);
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
    {#if message}
      <div transition:slide={{ duration: 250, easing: cubicOut }}>
        {message}
      </div>
    {/if}
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
    font-size: 20px;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
