<script lang="ts">
  import Chip from "components/Chip.svelte";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import Star from "svelte-material-icons/Star.svelte";
  import StarOutline from "svelte-material-icons/StarOutline.svelte";
  import AccountStar from "svelte-material-icons/AccountStar.svelte";
  import AccountCowboy from "svelte-material-icons/AccountCowboyHatOutline.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import Close from "svelte-material-icons/CloseCircleOutline.svelte";
  import { applyAction, enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";
  import Checkbox from "components/Checkbox.svelte";
  import { alternateColours, handleSubmit, lighten } from "$lib/utilities";
  import Dialog from "components/Dialog.svelte";
  import TextField from "components/TextField.svelte";

  export let data;
  let loading = "";
  let showAddTeacherDialog = false;
  $: filteredStudents =
    data.subgroups.size === 0
      ? data.group.students
      : data.group.students.filter(({ subgroups }) => data.selSgs.some((sg) => subgroups.has(sg)));

  const handleAddFav: SubmitFunction = () => {
    loading = "addFav";

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          invalidate("app:favSubjects");
          invalidate("app:subjectDetails");
          snackBars.haveASnack(result.data!.message);
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

<div class="container">
  <h1>
    <div>
      <span>{data.subject.name}</span>
      <form method="POST" action="?/addFav" use:enhance={handleAddFav}>
        <input type="hidden" name="subName" value={data.subject.name} />
        <input type="hidden" name="fav" value={data.subject.fav ? "yes" : "no"} />

        <Button
          formSubmit
          variant="text"
          --primary="var(--aspen-gold)"
          title={data.subject.fav
            ? "Retirer des matières favorites"
            : "Ajouter aux matières favorites"}
          style="font-size: 0.4em;"
          loading={loading === "addFav"}
          icon
        >
          {#if data.subject.fav}
            <Star />
          {:else}
            <StarOutline />
          {/if}
        </Button>
      </form>
    </div>
    <br />
    <a href={`/teacher/groups/${data.group.uid}`} style="font-size: 80%">{data.group.name}</a>
  </h1>

  <h2>Évaluations</h2>

  <h2>Élèves</h2>

  {#if data.subgroups.size > 0}
    <div class="subgroups">
      {#each data.subgroups.entries() as [name, colour] (name)}
        {@const selected = data.selSgs.includes(name)}
        <Button
          variant={selected ? "filled" : "outlined"}
          --primary={colour}
          --secondary={selected ? alternateColours.get(colour) : "white"}
          on:click={() => {
            if (selected) data.selSgs = data.selSgs.filter((sg) => sg !== name);
            else data.selSgs = [...data.selSgs, name];
          }}
        >
          {name}
        </Button>
      {/each}
    </div>
  {/if}

  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "subgroups", text: "Sous-groupes", noSorting: true },
    ]}
    items={filteredStudents}
    sortByDefault="name"
    sortBy="name"
    lineNumbering
  >
    <tr slot="item" let:item={{ key, name, subgroups, selected }} let:lineNumber>
      <td class="center">
        <div class="flexCenter" style="gap: 0.5em;">
          <span>{lineNumber}</span>
          <!-- A form field element should have an id or name attribute -->
          <Checkbox
            name="rowSel"
            checked={selected}
            on:change={() =>
              (data.group.students = data.group.students.map((st) =>
                st.key === key
                  ? {
                      ...st,
                      selected: !selected,
                    }
                  : st,
              ))}
          />
        </div>
      </td>
      <td>{name}</td>
      <td>
        <div class="flexCenter">
          {#if subgroups}
            {#each subgroups as sgName (sgName)}
              <Chip bgColour={data.subgroups.get(sgName)}>{sgName}</Chip>
            {/each}
          {/if}
        </div>
      </td>
    </tr>
  </DataTable>

  <h2>Professeurs</h2>

  <div class="teachers">
    {#each data.subject.teachers as teacher}
      <Chip size="large" bgColour="var(--sweet-corn)" style="text-align: center;">
        {teacher.name}<br />
        {teacher.email}
        <form
          method="POST"
          action="?/remTeacher"
          use:enhance={() =>
            handleSubmit(
              (start) => (loading = start ? "remTeacher" : ""),
              () => invalidate("app:subjectDetails"),
            )}
        >
          <input type="hidden" name="teacherUid" value={teacher.uid} />
          <Button
            variant="text"
            size="small"
            --primary="fiesta"
            --secondary="transparent"
            formSubmit
            loading={loading === "remTeacher"}
            style="margin-left: 0.3em"
            icon
          >
            <Close />
          </Button>
        </form>
      </Chip>
    {/each}

    {#if data.subject.teachers.length == 0}
      <p>Aucun professeur ne peut noter d&rsquo;évaluations pour l&rsquo;instant !</p>
    {/if}

    <Dialog width="300px" --primary={lighten("var(--eden)", 80)} bind:show={showAddTeacherDialog}>
      <Button
        slot="trigger"
        let:toggle
        on:click={toggle}
        variant="text"
        --primary="var(--eden)"
        style="margin-left: 1em;"
        shrinkToIcon
      >
        <AccountStar slot="prepend" />
        Nouveau
      </Button>

      <form
        method="POST"
        action="?/addTeacher"
        use:enhance={() =>
          handleSubmit(
            (start) => (loading = start ? "addTeacher" : ""),
            () => {
              invalidate("app:subjectDetails");
              showAddTeacherDialog = false;
            },
          )}
        class="dialogContent"
      >
        <TextField name="email" label="Adresse électronique" required>
          <AccountCowboy slot="prepend" />
        </TextField>

        <Button
          formSubmit
          variant="text"
          --primary="var(--eden)"
          --secondary="transparent"
          loading={loading === "addTeacher"}
          icon
        >
          <Send />
        </Button>
      </form>
    </Dialog>
  </div>
</div>

<style>
  h1 a {
    color: var(--galaxy-blue);
    text-decoration: dotted;
  }

  h1 div {
    display: inline flex;
    justify-content: center;
    align-items: center;
    gap: 0.3em;
  }

  .subgroups {
    margin: 1em 0 2em;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5em;
  }

  .dialogContent {
    display: flex;
    align-items: center;
    gap: 0.5em;
    justify-content: center;
  }

  .teachers {
    margin: 1em 0 2em;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5em;
  }
</style>
