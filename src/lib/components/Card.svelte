<div class="card">
  <slot />
</div>

<style lang="scss">
  .card {
    display: grid;
    padding: 1.5em;
    grid-template:
      "header" min-content
      "content" 1fr
      "actions" min-content;
    max-height: 95%;
    overflow: auto;
    border-radius: 20px;
    box-shadow:
      0px 3px 1px -2px rgb(0 0 0 / 20%),
      0px 2px 2px 0px rgb(0 0 0 / 14%),
      0px 1px 5px 0px rgb(0 0 0 / 12%);
    color: var(--colour, #444);
    background-color: var(--bg-colour, white);

    :global(header) {
      grid-area: header;

      :global(p) {
        margin: 0;
      }

      :global(.title) {
        margin: 0;
        color: #212121;
      }

      :global(.subtitle) {
        margin: 0;
        color: rgb(0 0 0 / 0.54);
      }
    }

    :global(.content) {
      grid-area: content;
    }

    :global(.actions) {
      grid-area: actions;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }
</style>
