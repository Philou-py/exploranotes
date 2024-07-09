<script lang="ts" context="module">
  import { writable, type Writable } from "svelte/store";

  export const confirmation: Writable<{
    open: boolean;
    message: string;
    details: string;
    callback: () => void;
  }> = writable({ open: false, message: "", details: "", callback: () => {} });
</script>

<script lang="ts">
  import ThumbUp from "svelte-material-icons/ThumbUp.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import Modal from "./Modal.svelte";
  import Button from "./Button.svelte";
</script>

<Modal bind:show={$confirmation.open}>
  <div class="card">
    <header>
      <h3 class="cardTitle">{$confirmation.message}</h3>
    </header>
    <p>{$confirmation.details}</p>
    <div class="cardActions" style="justify-content: center">
      <Button
        variant="outlined"
        --primary="var(--jester-red)"
        style="margin-right: 0.6em"
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
          $confirmation.callback();
          $confirmation.open = false;
        }}
      >
        <ThumbUp slot="prepend" />
        Bien sûr !
      </Button>
    </div>
  </div>
</Modal>
