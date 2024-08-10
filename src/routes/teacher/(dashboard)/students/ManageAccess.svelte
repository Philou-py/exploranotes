<script lang="ts">
  import Button from "components/Button.svelte";
  import Modal from "components/Modal.svelte";
  import DataTable from "components/DataTable.svelte";
  import Block from "svelte-material-icons/BlockHelper.svelte";
  import Plus from "svelte-material-icons/Plus.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import { lighten } from "$lib/utilities";
  import { goto, invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { applyAction, enhance } from "$app/forms";
  import Dialog from "components/Dialog.svelte";
  import TextField from "components/TextField.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import { snackBars } from "components/SnackBars.svelte";

  interface GroupDetails {
    uid: string;
    name: string;
    admins: { key: string; name: string; email: string }[];
  }

  export let groupDetails: GroupDetails;
  let dialogOpen = false;
  let loading = "";

  const closeModal = () => {
    const searchParams = new URLSearchParams($page.url.searchParams);
    searchParams.delete("manageAccess");
    goto(`?${searchParams.toString()}`);
  };

  const handleAddRemAdmin: SubmitFunction = () => {
    return async ({ result }) => {
      switch (result.type) {
        case "success":
          invalidate("app:students");
          snackBars.haveASnack(result.data!.message);
          dialogOpen = false;
          break;
        case "failure":
          snackBars.haveASnack(result.data!.message, "error");
          break;
        case "error":
          snackBars.haveASnack(result.error.message, "error");
          break;
        default:
          await applyAction(result);
      }
      loading = "";
    };
  };
</script>

<Modal
  show={!!groupDetails.uid}
  closeOnBgClick
  closeFunc={closeModal}
  --width="clamp(600px, 50%, 800px)"
>
  <header>
    <h2 class="cardTitle center">{groupDetails.name} - Gestion des accès</h2>
  </header>

  <p class="center">
    Les professeurs administrateurs pourront modifier le groupe (dont ajouter / supprimer des
    administrateurs) et gérer les accès des professeurs aux différentes matières.
  </p>

  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "email", text: "Adresse électronique" },
      { value: "actions", text: "Actions", noSorting: true },
    ]}
    items={groupDetails.admins}
    lineNumbering
  >
    <tr slot="item" let:item={{ key, name, email }} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>{name}</td>
      <td>{email}</td>
      <td>
        <div class="flexCenter">
          <form
            method="POST"
            action="?/removeAdmin"
            use:enhance={(e) => {
              loading = "remAdmin";
              return handleAddRemAdmin(e);
            }}
          >
            <input type="hidden" name="groupUid" value={groupDetails.uid} />
            <input type="hidden" name="teacherUid" value={key} />

            <Button
              variant="text"
              --primary="var(--fiesta)"
              title="Retirer le rôle d’administrateur"
              disabled={groupDetails.admins.length === 0}
              loading={loading === "remAdmin"}
              formSubmit
              icon
            >
              <Block />
            </Button>
          </form>
        </div>
      </td>
    </tr>
  </DataTable>

  <div class="cardActions" style="justify-content: space-between;">
    <Dialog width="300px" --primary={lighten("var(--princess-blue)", 80)} bind:show={dialogOpen}>
      <Button
        slot="trigger"
        let:toggle
        on:click={toggle}
        variant="outlined"
        --primary="var(--princess-blue)"
      >
        <Plus slot="prepend" />
        Ajouter un admin
      </Button>

      <form
        method="POST"
        action="?/addAdmin"
        class="dialogContent"
        use:enhance={(e) => {
          loading = "addAdmin";
          return handleAddRemAdmin(e);
        }}
      >
        <input type="hidden" name="groupUid" value={groupDetails.uid} />

        <TextField name="email" type="email" label="Adresse électronique" required>
          <AccountCircle slot="prepend" />
        </TextField>

        <Button
          formSubmit
          variant="text"
          --primary="var(--princess-blue)"
          --secondary="transparent"
          loading={loading === "addAdmin"}
          icon
        >
          <Send />
        </Button>
      </form>
    </Dialog>

    <Button variant="outlined" --primary="var(--sugar-almond)" on:click={closeModal}>Fermer</Button>
  </div>
</Modal>

<style>
  .dialogContent {
    display: flex;
    align-items: center;
    gap: 0.5em;
    justify-content: center;
  }
</style>
