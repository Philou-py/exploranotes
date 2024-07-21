<script lang="ts">
  import type { SubmitFunction } from "@sveltejs/kit";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import Check from "svelte-material-icons/Check.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import AccountEdit from "svelte-material-icons/AccountEdit.svelte";
  import Block from "svelte-material-icons/BlockHelper.svelte";
  import { confirmation } from "components/ConfirmationModal.svelte";
  import AddStudents from "./AddStudents.svelte";
  import EditStudent from "./EditStudent.svelte";
  import { enhance, applyAction } from "$app/forms";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";

  export let data;
  let editStudent = { uid: "", firstName: "", lastName: "", email: "", hasAccount: false };
  let editModalOpen = false;

  const handleDeleteStudent: SubmitFunction = () => {
    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message!);
          invalidate("app:students");
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
    };
  };

  const formRefs: Record<string, HTMLFormElement> = {};
</script>

<div class="container students">
  <h1>Élèves</h1>

  <AddStudents />
  <EditStudent student={editStudent} bind:modalOpen={editModalOpen} />

  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "email", text: "Adresse électronique" },
      { value: "hasAccount", text: "Inscrit(e)" },
      { value: "actions", text: "Actions", noSorting: true },
    ]}
    items={data.students}
    sortByDefault="name"
    sortBy="name"
    emptyText="Aucun élève dans cet établissement !"
    lineNumbering
  >
    <tr slot="item" let:item={{ key, firstName, lastName, name, email, hasAccount }} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>{name}</td>
      <td class="breakAll">{email}</td>
      <td>
        {#if hasAccount}
          <Check />
        {:else}
          <Close />
        {/if}
      </td>
      <td>
        <div style="display: flex; justify-content: center; gap: 0.2em;">
          <Button
            variant="text"
            --primary="var(--turmeric)"
            shrinkToIcon
            on:click={() => {
              editStudent = { uid: key, firstName, lastName, email, hasAccount: !!hasAccount };
              editModalOpen = true;
            }}
          >
            <AccountEdit slot="prepend" />
            Modifier
          </Button>
          <form
            method="POST"
            action="?/deleteAccount"
            use:enhance={handleDeleteStudent}
            bind:this={formRefs[key]}
          >
            <input type="hidden" name="uid" value={key} />
            <Button
              variant="text"
              icon
              --primary="var(--fiesta)"
              disabled={!hasAccount}
              title="Retirer l'accès élève"
              on:click={() => {
                $confirmation = {
                  open: true,
                  message: `Voulez-vous vraiment supprimer l’accès de ${name} à son compte ?`,
                  details: "Les données entrées par les professeurs resteront inchangées.",
                  onConfirm: () => formRefs[key].requestSubmit(),
                };
              }}
            >
              <Block />
            </Button>
          </form>
        </div>
      </td>
    </tr>
  </DataTable>
</div>

<style>
  :global(.students svg) {
    margin: 0 auto;
  }
</style>
