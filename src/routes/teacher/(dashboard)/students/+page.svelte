<script lang="ts">
  import type { SubmitFunction } from "@sveltejs/kit";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import Check from "svelte-material-icons/Check.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import AccountEdit from "svelte-material-icons/AccountEdit.svelte";
  import AccountPlus from "svelte-material-icons/AccountMultiplePlusOutline.svelte";
  import Block from "svelte-material-icons/BlockHelper.svelte";
  import Filter from "svelte-material-icons/FilterOutline.svelte";
  import AccountRemove from "svelte-material-icons/AccountRemoveOutline.svelte";
  import Face from "svelte-material-icons/FaceManOutline.svelte";
  import TextBox from "svelte-material-icons/TextBoxOutline.svelte";
  import School from "svelte-material-icons/SchoolOutline.svelte";
  import { confirmation } from "components/ConfirmationModal.svelte";
  import AddStudents from "./AddStudents.svelte";
  import EditStudentModal from "./EditStudentModal.svelte";
  import { enhance, applyAction } from "$app/forms";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";
  import Checkbox from "components/Checkbox.svelte";
  import { slide } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import Select from "components/Select.svelte";

  export let data;
  let editStudent = { uid: "", firstName: "", lastName: "", email: "", hasAccount: false };
  let editModalOpen = false;
  let filteredStudents = data.students;
  $: students = data.students.filter(({ selected }) => !selected);
  $: selectedStudents = data.students.filter(({ selected }) => selected);
  let searchText = "";
  let selectedGroup = "";
  let groupCreation = false;

  $: {
    let searchTextSlug = searchText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\p{Diacritic}]/gu, "");
    filteredStudents = students.filter(
      ({ primaryGroup, nameSlug }) =>
        nameSlug.includes(searchTextSlug) &&
        (!selectedGroup || (primaryGroup && primaryGroup.name === selectedGroup)),
    );
  }

  const formRefs: Record<string, HTMLFormElement> = {};

  const handleDeleteStudent: SubmitFunction = () => {
    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
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

  const handleCreateGroup: SubmitFunction = ({ formData }) => {
    selectedStudents.forEach((st, i) => formData.set(`st${i}`, st.key));

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          invalidate("app:students");
          groupCreation = false;
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
</script>

<div class="container students">
  <h1>Élèves</h1>

  <EditStudentModal student={editStudent} bind:modalOpen={editModalOpen} />

  <div class="buttons">
    <AddStudents />
    <Button
      --primary="var(--fruit-dove)"
      --secondary="white"
      on:click={() => {
        groupCreation = !groupCreation;
        data.students = data.students.map((st) => ({ ...st, selected: false }));
      }}
    >
      {#if groupCreation}
        Annuler
      {:else}
        Nouveau groupe
      {/if}
    </Button>
  </div>

  {#if groupCreation}
    <div transition:slide={{ easing: cubicInOut }} style="padding: 1.5em 0;">
      <form method="POST" action="?/createGroup" use:enhance={handleCreateGroup}>
        <fieldset class="groupInfo">
          <legend>Informations générales</legend>
          <TextField
            name="name"
            label="Nom du groupe"
            placeholder="Ex : Spé Maths Gr 7"
            hint="Ce nom devrait être unique dans l'établissement."
            maxlength={20}
            required
          >
            <Face slot="prepend" />
          </TextField>
          <TextField
            name="subject"
            label="Matière"
            placeholder="Ex : Physique-chimie"
            hint="Laisser vide pour créer un groupe administratif."
            maxlength={50}
          >
            <TextBox slot="prepend" />
          </TextField>
          <TextField
            name="level"
            label="Niveau"
            placeholder="Ex : Terminale"
            maxlength={40}
            required
          >
            <School slot="prepend" />
          </TextField>
          <Checkbox name="marked" checked>
            <svelte:fragment slot="right">
              Permettre la création d&rsquo;évaluations
            </svelte:fragment>
          </Checkbox>
          <Checkbox name="primary">
            <svelte:fragment slot="right">
              Groupe principal (un élève ne devrait en avoir qu'un seul)
            </svelte:fragment>
          </Checkbox>
        </fieldset>
        <DataTable
          headers={[
            { value: "name", text: "Nom" },
            { value: "email", text: "Adresse électronique" },
            { value: "hasAccount", text: "Inscrit(e)" },
            { value: "actions", text: "Actions", noSorting: true },
          ]}
          items={selectedStudents}
          sortByDefault="name"
          sortBy="name"
          emptyText="Aucun(e) élève sélectionné(e) pour l’instant !"
          lineNumbering
        >
          <tr slot="item" let:item={student} let:lineNumber>
            <td class="center">{lineNumber}</td>
            <td>{student.name}</td>
            <td class="breakAll">{student.email}</td>
            <td>
              {#if student.hasAccount}
                <Check />
              {:else}
                <Close />
              {/if}
            </td>
            <td>
              <div style="display: flex; justify-content: center; gap: 0.2em;">
                <Button
                  variant="text"
                  --primary="var(--dark-cheddar)"
                  shrinkToIcon
                  on:click={() =>
                    (data.students = data.students.map((st) =>
                      st.key === student.key ? { ...st, selected: false } : st,
                    ))}
                >
                  <AccountRemove slot="prepend" />
                  Retirer
                </Button>
              </div>
            </td>
          </tr>
        </DataTable>
        <div class="newGroup">
          <p>
            {#if selectedStudents.length === 1}
              {selectedStudents.length} élève sera inclus(e) dans le nouveau groupe.
            {:else}
              {selectedStudents.length} élèves seront inclus(es) dans le nouveau groupe.
            {/if}
          </p>
          <Button
            disabled={selectedStudents.length === 0}
            --primary="var(--eden)"
            --secondary="white"
            formSubmit
          >
            Créer
          </Button>
        </div>

        <hr />
      </form>
    </div>
  {/if}

  <div class="filters">
    <Select label="Filtrer par groupe" bind:value={selectedGroup} items={data.groups}>
      <Filter slot="prepend" />
    </Select>
    <TextField
      label="Filtrer par prénom / nom"
      bind:value={searchText}
      hint={searchText === ""
        ? "Insensible à la casse et aux accents"
        : filteredStudents.length <= 1
          ? `${filteredStudents.length} élève sur ${students.length} est affiché(e).`
          : `${filteredStudents.length} élèves sur ${students.length} sont affiché(e)s.`}
    >
      <Filter slot="prepend" />
    </TextField>
  </div>

  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "email", text: "Adresse électronique" },
      { value: "primaryGroup", text: "Groupe" },
      { value: "hasAccount", text: "Inscrit(e)" },
      { value: "actions", text: "Actions", noSorting: true },
    ]}
    items={filteredStudents}
    sortByDefault="name"
    sortBy="name"
    emptyText="Aucun(e) élève dans cet établissement !"
    lineNumbering
  >
    <tr
      slot="item"
      let:item={{ key, firstName, lastName, name, email, primaryGroup, hasAccount }}
      let:lineNumber
    >
      <td class="center">{lineNumber}</td>
      <td>{name}</td>
      <td class="breakAll">{email}</td>
      <td class="center">
        {#if primaryGroup}
          <span class="chip" style:background-color={primaryGroup.colour}>{primaryGroup.name}</span>
        {/if}
      </td>
      <td>
        {#if hasAccount}
          <Check />
        {:else}
          <Close />
        {/if}
      </td>
      <td>
        <div style="display: flex; justify-content: center; gap: 0.2em;">
          {#if groupCreation}
            <Button
              variant="outlined"
              --primary="var(--eden)"
              --secondary="white"
              on:click={() => {
                data.students = data.students.map((st) =>
                  st.key === key ? { ...st, selected: true } : st,
                );
              }}
              shrinkToIcon
            >
              <AccountPlus slot="prepend" />
              Sélectionner
            </Button>
          {:else}
            <Button
              variant="text"
              --primary="var(--turmeric)"
              shrinkToIcon
              on:click={() => {
                editStudent = { uid: key, firstName, lastName, email, hasAccount };
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
          {/if}
        </div>
      </td>
    </tr>
  </DataTable>
</div>

<style>
  :global(.students svg) {
    margin: 0 auto;
  }

  .filters {
    margin: 0.7em 0;
  }

  .buttons,
  .newGroup {
    display: flex;
    flex-wrap: wrap;
  }

  .buttons {
    justify-content: center;
    gap: 0.5em;
  }

  .newGroup {
    margin: 1.5em 0;
    justify-content: space-between;
    align-items: center;
  }

  .groupInfo {
    border-radius: 0.4em;
    border-color: var(--fruit-dove);
    margin-bottom: 1.5em;
  }

  .groupInfo legend {
    background-color: var(--fruit-dove);
    color: white;
    padding: 0.15em 0.3em;
  }

  hr {
    border-color: var(--dark-cheddar);
  }

  .chip {
    color: white;
    padding: 0.15em 0.3em;
    border-radius: 0.5em;
  }
</style>
