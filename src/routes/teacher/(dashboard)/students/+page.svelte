<script lang="ts">
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import Check from "svelte-material-icons/Check.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import AccountEdit from "svelte-material-icons/AccountEdit.svelte";
  import { confirmation } from "components/ConfirmationModal.svelte";
  import AddStudents from "./AddStudents.svelte";
  import EditStudent from "./EditStudent.svelte";

  export let data;
  let editStudent = { uid: "", firstName: "", lastName: "", email: "" };
  let editModalOpen = false;
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
      <td class="center">
        <Button
          variant="text"
          --primary="var(--turmeric)"
          shrinkToIcon
          on:click={() => {
            editStudent.uid = key;
            editStudent.firstName = firstName;
            editStudent.lastName = lastName;
            editStudent.email = email;
            editModalOpen = true;
          }}
        >
          <AccountEdit slot="prepend" />
          Modifier
        </Button>
      </td>
    </tr>
  </DataTable>
</div>

<style>
  :global(.students svg) {
    margin: 0 auto;
  }
</style>
