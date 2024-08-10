<script lang="ts" context="module">
  import { writable, type Writable } from "svelte/store";

  export const confirmation: Writable<{
    open: boolean;
    message: string;
    details: string;
    onConfirm: () => void;
  }> = writable({ open: false, message: "", details: "", onConfirm: () => {} });
</script>

<script lang="ts">
  import ThumbUp from "svelte-material-icons/ThumbUp.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import Modal from "./Modal.svelte";
  import Button from "./Button.svelte";
</script>

<Modal bind:show={$confirmation.open}>
  <header>
    <h3 class="cardTitle">{$confirmation.message}</h3>
  </header>
  <p>{$confirmation.details}</p>
  <div class="cardActions">
    <Button
      variant="outlined"
      --primary="var(--jester-red)"
      on:click={() => {
        $confirmation.open = false;
      }}
    >
      <Close slot="prepend" />
      Annuler
    </Button>
    <Button
      variant="elevated"
      --primary="var(--princess-blue)"
      --secondary="white"
      on:click={() => {
        $confirmation.onConfirm();
        $confirmation.open = false;
      }}
    >
      <ThumbUp slot="prepend" />
      Bien sûr !
    </Button>
  </div>
</Modal>
