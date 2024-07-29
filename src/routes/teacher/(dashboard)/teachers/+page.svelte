<script lang="ts">
  import type { SubmitFunction } from "./$types";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import { confirmation } from "components/ConfirmationModal.svelte";
  import ShieldCrownOutline from "svelte-material-icons/ShieldCrownOutline.svelte";
  import GroupAdd from "svelte-material-icons/AccountMultiplePlusOutline.svelte";
  import { enhance, applyAction } from "$app/forms";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";
    import Chip from "components/Chip.svelte";

  export let data;
  let form: HTMLFormElement;
  let acceptUid = "";
  let acceptName = "";
  let acceptLoading = false;

  const handleAcceptTeacher: SubmitFunction = ({ formData }) => {
    acceptLoading = true;
    formData.set("teacherUid", acceptUid);

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(`${acceptName} fait maintenant partie de l'établissement !`);
          invalidate("app:teachers");
          break;
        case "error":
          snackBars.haveASnack(result.error.message, "error");
          break;
        default:
          await applyAction(result);
      }
      acceptLoading = false;
    };
  };
</script>

<div class="container">
  <h1>Professeurs</h1>

  {#if data.pendingTeachersItems.length > 0}
    <h2>En attente d&rsquo;acceptation</h2>
    <DataTable
      headers={[
        { value: "name", text: "Nom" },
        { value: "email", text: "Adresse électronique" },
        { value: "signUpDate", text: "Création du compte" },
        { value: "actions", text: "Actions", noSorting: true },
      ]}
      items={data.pendingTeachersItems}
      lineNumbering
      sortBy="signUpDate"
      sortByDefault="signUpDate"
      sortOrder="DESC"
    >
      <tr slot="item" let:item={{ key, name, email, signUpDate }} let:lineNumber>
        <td class="center">{lineNumber}</td>
        <td>{name}</td>
        <td>{email}</td>
        <td class="center">{new Date(signUpDate).toLocaleDateString("fr-FR")}</td>
        <td class="center">
          <form
            method="POST"
            action="?/acceptTeacher&hello=world"
            use:enhance={handleAcceptTeacher}
            bind:this={form}
          >
            <Button
              variant="text"
              shrinkToIcon
              --primary="var(--turmeric)"
              loading={acceptLoading}
              on:click={() => {
                acceptUid = key;
                acceptName = name;
                $confirmation = {
                  open: true,
                  message: `Voulez-vous vraiment accepter ${name} ?`,
                  details: `Son adresse électronique est ${email}.`,
                  onConfirm: () => form.requestSubmit(),
                };
              }}
            >
              <GroupAdd slot="prepend" />
              Accepter
            </Button>
          </form>
        </td>
      </tr>
    </DataTable>
  {/if}

  {#if data.admin}
    <h2>Dans votre établissement</h2>
  {/if}
  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "email", text: "Adresse électronique" },
      { value: "groups", text: "Groupes", noSorting: true },
    ]}
    items={data.teachersItems}
    lineNumbering
    sortBy="name"
    sortByDefault="name"
  >
    <tr slot="item" let:item={{ name, email, admin, groups }} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>
        {name}
        {#if admin}
          <ShieldCrownOutline class="adminIcon" title="Administrateur" />
        {/if}
      </td>
      <td>{email}</td>
      <td>
        {#if groups}
          <div class="flexCenter">
            {#each groups as group (group.name)}
              <Chip bgColour={group.colour}>{group.name}</Chip>
            {/each}
          </div>
        {/if}
      </td>
    </tr>
  </DataTable>
</div>

<style>
  :global(.adminIcon) {
    font-size: 1.2em;
    display: inline;
    vertical-align: bottom;
  }
</style>
