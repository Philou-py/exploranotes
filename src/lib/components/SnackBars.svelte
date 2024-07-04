<script lang="ts" context="module">
  import { writable, type Writable } from "svelte/store";

  interface SnackBar {
    id: number;
    message: string;
    type: "info" | "success" | "error";
    dismissable: boolean;
  }

  const { subscribe, update }: Writable<SnackBar[]> = writable([]);
  let id = 1;

  const endASnack = (id: number) => update((bars) => bars.filter((b) => b.id !== id));

  export const snackBars = {
    subscribe,
    endASnack,
    haveASnack: (
      message: string,
      type: "info" | "success" | "error",
      duration: number = 3000,
      dismissable: boolean = true,
    ) => {
      // currentId captures id by value, which retains the original id
      // when passed to the setTimeout callback.
      const currentId = id++;
      update((bars) => [...bars, { id: currentId, message, type, dismissable }]);
      if (duration !== 0) setTimeout(() => endASnack(currentId), duration);
    },
  };
</script>

<script lang="ts">
  import Button from "./Button.svelte";
  import CloseCircleOutline from "svelte-material-icons/CloseCircleOutline.svelte";
  import { fade } from "svelte/transition";
  import { flip } from "svelte/animate";
</script>

<ul class="snackBarWrapper">
  {#each $snackBars as snack (snack.id)}
    <li
      class="snackBar {snack.type}"
      animate:flip={{ duration: 250 }}
      transition:fade={{ duration: 250 }}
    >
      <span class="message">{snack.message}</span>
      {#if snack.dismissable}
        <Button
          variant="flat"
          size="small"
          --secondary="white"
          icon
          on:click={() => endASnack(snack.id)}
        >
          <CloseCircleOutline />
        </Button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .snackBarWrapper {
    position: fixed;
    pointer-events: none;
    bottom: 0;
    left: 2.5%;
    width: 95%;
    padding: 0;
    margin: 0;
    z-index: 10000;
  }

  .snackBar {
    --primary: #2c2c2c;
    color: white;
    background-color: var(--primary);
    padding: 12px 15px;
    border-radius: 10px;
    box-shadow:
      0 3px 5px -1px rgb(0 0 0 / 20%),
      0 6px 10px 0 rgb(0 0 0 / 14%),
      0 1px 18px 0 rgb(0 0 0 / 12%);
    text-align: center;
    width: fit-content;
    margin: 0.5em auto;
    pointer-events: auto;
    display: flex;
    align-items: center;
  }

  .snackBar.info {
    --primary: var(--blue);
  }

  .snackBar.success {
    --primary: var(--green);
  }

  .snackBar.error {
    --primary: var(--red);
  }

  .message {
    margin-right: 0.3em;
  }
</style>
