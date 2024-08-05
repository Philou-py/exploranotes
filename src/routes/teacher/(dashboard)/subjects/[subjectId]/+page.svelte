<script lang="ts">
  import Chip from "components/Chip.svelte";
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import Star from "svelte-material-icons/Star.svelte";
  import StarOutline from "svelte-material-icons/StarOutline.svelte";
  import { applyAction, enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";
  import Checkbox from "components/Checkbox.svelte";
  import { alternateColours, lighten } from "$lib/utilities";

  export let data;
  let loading = "";
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
        <input type="hidden" name="subId" value={data.subject.uid} />
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

  <h2>Sous-groupes</h2>

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
    {#if data.subgroups.size === 0}
      <p>Aucun sous-groupe n&rsquo;a été créé !</p>
    {/if}
  </div>

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
</style>
