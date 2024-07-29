<script lang="ts">
  import type { SubmitFunction } from "@sveltejs/kit";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import Check from "svelte-material-icons/Check.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import Delete from "svelte-material-icons/DeleteOutline.svelte";
  import Plus from "svelte-material-icons/Plus.svelte";
  import AccountEdit from "svelte-material-icons/AccountEdit.svelte";
  import AccountPlus from "svelte-material-icons/AccountMultiplePlusOutline.svelte";
  import Block from "svelte-material-icons/BlockHelper.svelte";
  import Filter from "svelte-material-icons/FilterOutline.svelte";
  import FilterMenu from "svelte-material-icons/FilterMenuOutline.svelte";
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
  import Chip from "components/Chip.svelte";
  import { darken } from "$lib/utilities";
  import { tick } from "svelte";

  export let data;
  let editStudent = { uid: "", firstName: "", lastName: "", email: "", hasAccount: false };
  let editModalOpen = false;
  let filteredStudents = data.students;
  $: students = data.students.filter(({ selected }) => !selected);
  $: selectedStudents = data.students.filter(({ selected }) => selected);
  let searchText = "";
  let selectedGroup = "";
  let groupCreation = false;
  let subCounter = 1;
  let subIds = ["sub1"];
  let subjectsFS: HTMLFieldSetElement;

  $: {
    let searchTextSlug = searchText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\p{Diacritic}]/gu, "");
    filteredStudents = students.filter(
      ({ grName, nameSlug }) =>
        nameSlug.includes(searchTextSlug) && (!selectedGroup || grName === selectedGroup),
    );
  }

  const handleAddSubject = async () => {
    const newSub = `sub${++subCounter}`;
    subIds = [...subIds, newSub];
    await tick();
    subjectsFS.querySelector<HTMLDivElement>(`input[name="${newSub}"]`)?.focus();
  };

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
        <div class="fieldsets">
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
              name="level"
              label="Niveau"
              placeholder="Ex : Terminale"
              maxlength={40}
              required
            >
              <School slot="prepend" />
            </TextField>

            <Checkbox name="primary">
              <svelte:fragment slot="right">
                Groupe principal (idéalement, un par élève)
              </svelte:fragment>
            </Checkbox>
          </fieldset>

          <fieldset class="subjects" bind:this={subjectsFS}>
            <legend>Matières enseignées</legend>
            {#each subIds as subject, i (subject)}
              <div transition:slide={{ duration: 300 }} class="subject">
                <TextField
                  name={subject}
                  label={`Matière ${i + 1}`}
                  placeholder="Exs : Spé Maths, Colles de Physique"
                  maxlength={50}
                  required
                >
                  <TextBox slot="prepend" />
                </TextField>

                <Button
                  variant="text"
                  size="small"
                  tabindex={-1}
                  --primary="var(--jester-red)"
                  disabled={subIds.length === 1}
                  on:click={() => (subIds = subIds.filter((subId) => subId !== subject))}
                  style="margin-left: 0.2em;"
                  icon
                >
                  <Delete />
                </Button>
              </div>
            {/each}

            <div class="addSubject">
              <Button
                variant="outlined"
                --primary={darken("var(--pepper-stem)", 20)}
                on:click={handleAddSubject}
              >
                <Plus slot="prepend" />
                Nouvelle matière
              </Button>
            </div>
          </fieldset>
        </div>

        <DataTable
          headers={[
            { value: "name", text: "Nom" },
            { value: "email", text: "Adresse électronique" },
            { value: "grName", text: "Groupe" },
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
            <td class="center">
              {#if student.grName && student.grColour}
                <Chip bgColour={student.grColour}>{student.grName}</Chip>
              {/if}
            </td>
            <td>
              {#if student.hasAccount}
                <Check />
              {:else}
                <Close />
              {/if}
            </td>
            <td>
              <div class="flexCenter">
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
      <FilterMenu slot="prepend" />
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
    headers={groupCreation
      ? [
          { value: "name", text: "Nom" },
          { value: "email", text: "Adresse électronique" },
          { value: "actions", text: "Actions", noSorting: true },
        ]
      : [
          { value: "name", text: "Nom" },
          { value: "email", text: "Adresse électronique" },
          { value: "grName", text: "Groupe" },
          { value: "hasAccount", text: "Inscrit(e)" },
          { value: "actions", text: "Actions", noSorting: true },
        ]}
    items={filteredStudents}
    sortByDefault="name"
    sortBy="name"
    emptyText={selectedGroup
      ? "Aucun(e) élève ne répond aux critères de tri !"
      : "Aucun(e) élève dans cet établissement !"}
    lineNumbering
  >
    <tr
      slot="item"
      let:item={{ key, firstName, lastName, name, email, grName, grColour, hasAccount }}
      let:lineNumber
    >
      <td class="center">{lineNumber}</td>
      <td>{name}</td>
      <td class="breakAll">{email}</td>
      {#if groupCreation}
        <td class="center">
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
        </td>
      {:else}
        <td class="center">
          {#if grName && grColour}
            <Chip bgColour={grColour}>{grName}</Chip>
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
          <div class="flexCenter">
            <Button
              variant="text"
              --primary="var(--turmeric)"
              on:click={() => {
                editStudent = { uid: key, firstName, lastName, email, hasAccount };
                editModalOpen = true;
              }}
              icon
            >
              <AccountEdit />
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
      {/if}
    </tr>
  </DataTable>
</div>

<style>
  :global(.students svg) {
    margin: 0 auto;
  }

  .filters {
    display: flex;
    gap: 2em;
    margin: 0.7em 0;
  }

  @media (max-width: 960px) {
    .filters {
      display: block;
    }
  }

  :global(.filters > div) {
    flex: 1 1 50%;
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

  @media (max-width: 960px) {
    .newGroup {
      justify-content: center;
    }
  }

  .fieldsets {
    display: flex;
    gap: 1em;
  }

  @media (max-width: 960px) {
    .fieldsets {
      display: block;
    }
  }

  .fieldsets > fieldset {
    flex: 1 1 50%;
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

  .subjects {
    border-radius: 0.4em;
    border-color: var(--turmeric);
    margin-bottom: 1.5em;
  }

  .subjects legend {
    background-color: var(--turmeric);
    color: white;
    padding: 0.15em 0.3em;
  }

  .subject {
    display: flex;
    align-items: center;
  }

  .addSubject {
    display: flex;
    justify-content: center;
  }
</style>
