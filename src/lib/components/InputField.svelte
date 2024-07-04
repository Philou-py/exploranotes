<script context="module">
  let counter = 0;
</script>

<script lang="ts">
  export let variant: "underlined" = "underlined";
  export let active = false;
  export let focused = false;
  export let label = "";

  counter++;
  let id = "input-" + counter;
</script>

<div class="inputField {variant}" class:active class:focused>
  {#if $$slots.prependInner}
    <label class="prependInner" for={id}>
      <slot name="prependInner" />
    </label>
  {/if}
  {#if label}
    <label class="label" for={id}>
      {label}
    </label>
  {/if}
  <slot {id} />
  {#if $$slots.appendInner}
    <div class="appendInner">
      <slot name="appendInner" />
    </div>
  {/if}
  <div class="line" />
</div>

<style lang="scss">
  .inputField {
    /* controls the line-height of the label, the input, the height of .prependInner
       and determines the label's horizontal position */
    --contentHeight: 1.3em;
    display: flex;
    position: relative;
    min-width: 0;
    transition: border 250ms;
  }

  label {
    cursor: inherit;
  }

  .prependInner:not(:empty) {
    display: flex;
    align-items: center;
    margin-right: 0.3em;

    :global(svg) {
      /* width and height are set to 1em */
      font-size: var(--contentHeight);
    }
  }

  .label {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    max-width: 100%;
    line-height: var(--contentHeight);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition-property: top, transform;
    transition-duration: 250ms;
  }

  .inputField.underlined {
    padding: 1.2em 0 0.1em;
    border-bottom: 1px solid;

    .label {
      top: 1.2em;
      left: 0;
      transform-origin: left;
    }

    :not(.prependInner:empty) + .label {
      left: calc(var(--contentHeight) + 0.3em);
    }

    .line {
      position: absolute;
      width: 100%;
      bottom: 0;
      border-bottom: 1px solid;
      transform: scale(0);
      transform-origin: center;
      transition: transform 300ms;
    }

    &.active {
      .label {
        top: 0;
        transform: scale(78%);
      }
    }

    &.focused {
      .line {
        transform: scale(100%);
      }
    }
  }

  /* The animation should be triggered outside the component with :global */
  @keyframes -global-shake {
    0%,
    100% {
      translate: 0 0;
    }

    10%,
    30%,
    50%,
    70%,
    90% {
      translate: -0.25em 0;
    }

    20%,
    40%,
    60%,
    80% {
      translate: 0.25em 0;
    }
  }
</style>
