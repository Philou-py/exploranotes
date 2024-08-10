<script lang="ts">
  import type { SubmitFunction } from "@sveltejs/kit";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import Check from "svelte-material-icons/Check.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import Delete from "svelte-material-icons/DeleteOutline.svelte";
  import Plus from "svelte-material-icons/Plus.svelte";
  import FolderEdit from "svelte-material-icons/FolderEditOutline.svelte";
  import Security from "svelte-material-icons/Security.svelte";
  import AccountEdit from "svelte-material-icons/AccountEdit.svelte";
  import AccountPlus from "svelte-material-icons/AccountMultiplePlusOutline.svelte";
  import ArrowRight from "svelte-material-icons/ArrowRightBoldHexagonOutline.svelte";
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
  import { goto, invalidate } from "$app/navigation";
  import Checkbox from "components/Checkbox.svelte";
  import { slide } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import Select from "components/Select.svelte";
  import Chip from "components/Chip.svelte";
  import { darken } from "$lib/utilities";
  import { tick } from "svelte";
  import { page } from "$app/stores";
  import ManageAccess from "./ManageAccess.svelte";

  export let data;
  let editStudent = { uid: "", firstName: "", lastName: "", email: "", hasAccount: false };
  let editModalOpen = false;
  $: groupCreation = !!data.groupToEdit || !!data.newGroup;
  $: filteredStudents = data.students;
  $: students = data.students.filter(({ selected }) => !selected);
  $: selectedStudents = data.students.filter(({ selected }) => selected);
  let searchText = "";
  let selectedGroup = "";
  let subCounter = 1;
  $: subIds = data.groupToEdit ? [] : ["sub1"];
  let subjectsFS: HTMLFieldSetElement;
  let loading = "";

  $: {
    let searchTextSlug = searchText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\p{Diacritic}]/gu, "");
    filteredStudents = students.filter(
      ({ primGroups, nameSlug }) =>
        nameSlug.includes(searchTextSlug) &&
        (!selectedGroup || primGroups?.some(({ uid }) => uid === selectedGroup)),
    );
  }

  const handleAddSubject = async () => {
    const newSub = `sub${++subCounter}`;
    subIds = [...subIds, newSub];
    await tick();
    subjectsFS.querySelector<HTMLDivElement>(`input[name="${newSub}"]`)?.focus();
  };

  const formRefs: Record<string, HTMLFormElement> = {};

  const handleDeleteStudent: SubmitFunction = ({ formData }) => {
    loading = formData.get("uid") as string;

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
      loading = "";
    };
  };

  const handleCreateGroup: SubmitFunction = ({ formData }) => {
    loading = "createGroup";
    selectedStudents.forEach((st, i) => formData.set(`st${i}`, st.key));
    data.students.forEach((st, i) => {
      if (st.toRemove) formData.set(`rem${i}`, st.key);
    });

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          goto("students", { replaceState: true });
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

<div class="container students">
  <h1>Élèves</h1>

  <EditStudentModal student={editStudent} bind:modalOpen={editModalOpen} />
  <ManageAccess groupDetails={data.mAGroup} />

  <div class="groupsTitle">
    <h2>Groupes</h2>

    <div class="buttons">
      <AddStudents />
      <Button
        --primary="var(--fruit-dove)"
        --secondary="white"
        on:click={() => {
          const searchParams = new URLSearchParams($page.url.searchParams.toString());
          searchParams.delete("editGroup");
          if (!groupCreation) searchParams.set("newGroup", "yes");
          else searchParams.delete("newGroup");
          goto(`?${searchParams.toString()}`, { replaceState: true });
        }}
      >
        {#if groupCreation}
          Annuler
        {:else}
          Nouveau groupe
        {/if}
      </Button>
    </div>
  </div>

  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "nbStudents", text: "Élèves" },
      { value: "level", text: "Niveau" },
      { value: "actions", text: "Actions", noSorting: true },
    ]}
    items={data.groups}
    sortByDefault="name"
    sortBy="name"
    emptyText="Aucun groupe n’a été créé pour cet établissement !"
    lineNumbering
  >
    <tr slot="item" let:item={{ key, name, nbStudents, level, isAdmin }} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5em;">
          <span>{name}</span>
          <a href={`groups/${key}`} tabindex="-1">
            <Button
              variant="text"
              --primary="var(--fiesta)"
              title="Aller sur la page du groupe"
              icon
            >
              <ArrowRight />
            </Button>
          </a>
        </div>
      </td>
      <td class="center">{nbStudents}</td>
      <td class="center">{level}</td>
      <td>
        <div class="flexCenter">
          <Button
            variant="text"
            --primary="var(--turmeric)"
            on:click={() => {
              const searchParams = new URLSearchParams($page.url.searchParams.toString());
              searchParams.delete("newGroup");
              searchParams.set("editGroup", key);
              goto(`?${searchParams.toString()}`, { replaceState: true });
            }}
            title="Modifier ce groupe"
            disabled={!isAdmin}
            icon
          >
            <FolderEdit />
          </Button>

          <Button
            variant="text"
            --primary="var(--princess-blue)"
            title="Modifier quels professeurs ont accès au groupe"
            on:click={() => {
              const searchParams = new URLSearchParams($page.url.searchParams.toString());
              searchParams.set("manageAccess", key);
              goto(`?${searchParams.toString()}`);
            }}
            icon
          >
            <Security />
          </Button>
        </div>
      </td>
    </tr>
  </DataTable>

  {#if groupCreation}
    <div transition:slide={{ easing: cubicInOut }} style="padding: 1.5em 0;">
      <form method="POST" action="?/createGroup" use:enhance={handleCreateGroup}>
        <input type="hidden" name="groupToEdit" value={data.groupToEdit} />

        <div class="fieldsets">
          <fieldset class="groupInfo">
            <legend>Informations générales</legend>
            <TextField
              name="name"
              bind:value={data.groupPrefill.name}
              label="Nom du groupe"
              placeholder="Ex : Spé Maths Gr 7"
              hint="Ce nom devrait être unique dans l’établissement."
              maxlength={20}
              required
            >
              <Face slot="prepend" />
            </TextField>
            <TextField
              name="level"
              bind:value={data.groupPrefill.level}
              label="Niveau"
              placeholder="Ex : Terminale"
              maxlength={40}
              required
            >
              <School slot="prepend" />
            </TextField>

            <Checkbox
              name="primary"
              bind:checked={data.groupPrefill.primary}
              style="margin: 0.5em 0"
            >
              <svelte:fragment slot="right">
                Groupe principal (idéalement, un par élève)
              </svelte:fragment>
            </Checkbox>
          </fieldset>

          <fieldset class="subjects" bind:this={subjectsFS}>
            <legend>Matières enseignées</legend>
            {#if data.groupToEdit}
              <p>
                La modification ou la suppression d&rsquo;une matière s&rsquo;effectue sur sa page
                dédiée.
              </p>
            {/if}
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
                  disabled={!data.groupToEdit && subIds.length === 1}
                  on:click={() => (subIds = subIds.filter((subId) => subId !== subject))}
                  style="margin-left: 0.2em;"
                  icon
                >
                  <Delete />
                </Button>
              </div>
            {/each}

            <div class="flexCenter">
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
            { value: "primGroupsStr", text: "Groupe principal" },
            { value: "otherGroupsStr", text: "Autres groupes" },
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
              {#if student.primGroups}
                {#each student.primGroups as gr (gr.name)}
                  <Chip bgColour={gr.colour} style="margin: 0.1em;">{gr.name}</Chip>
                {/each}
              {/if}
            </td>
            <td class="center">
              {#if student.otherGroups}
                {#each student.otherGroups as gr (gr.name)}
                  <Chip bgColour={gr.colour} style="margin: 0.1em;">{gr.name}</Chip>
                {/each}
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
                      st.key === student.key ? { ...st, selected: false, toRemove: true } : st,
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
              {selectedStudents.length} élève sera inclus(e) dans le groupe.
            {:else}
              {selectedStudents.length} élèves seront inclus(es) dans le groupe.
            {/if}
          </p>
          <Button
            disabled={selectedStudents.length === 0}
            loading={loading === "createGroup"}
            --primary="var(--eden)"
            --secondary="white"
            formSubmit
          >
            {data.groupToEdit ? "Modifier" : "Créer"}
          </Button>
        </div>

        <hr />
      </form>
    </div>
  {/if}

  <div class="filters">
    <Select label="Filtrer par groupe" bind:value={selectedGroup} items={data.groupsItems}>
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
          { value: "primGroupsStr", text: "Groupe principal" },
          { value: "otherGroupsStr", text: "Autres groupes" },
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
      let:item={{ key, firstName, lastName, name, email, primGroups, otherGroups, hasAccount }}
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
          {#if primGroups}
            {#each primGroups as gr (gr.name)}
              <Chip bgColour={gr.colour} style="margin: 0.1em;">{gr.name}</Chip>
            {/each}
          {/if}
        </td>
        <td class="center">
          {#if otherGroups}
            {#each otherGroups as gr (gr.name)}
              <Chip bgColour={gr.colour} style="margin: 0.1em;">{gr.name}</Chip>
            {/each}
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
              title="Modifier les informations de l’élève"
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
                loading={loading === key}
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
  /* For checks and crosses */
  :global(.students svg) {
    margin: 0 auto;
  }

  .filters {
    display: flex;
    gap: 2em;
    margin: 1.5em 0 0.7em;
  }

  @media (max-width: 960px) {
    .filters {
      display: block;
    }
  }

  :global(.filters > div) {
    flex: 1 1 50%;
  }

  .groupsTitle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5em;
    margin: 1em 0;
  }

  .groupsTitle h2 {
    margin: 0;
  }

  .buttons,
  .newGroup {
    display: flex;
    flex-wrap: wrap;
  }

  .buttons {
    justify-content: center;
    gap: 0.5em;
    margin-left: auto;
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

  .subjects p {
    text-align: center;
    margin: 0.5em 0;
  }

  .subject {
    display: flex;
    align-items: center;
  }
</style>
