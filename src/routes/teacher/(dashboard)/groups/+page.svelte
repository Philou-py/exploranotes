<script lang="ts">
  import { applyAction, enhance } from "$app/forms";
  import { invalidate } from "$app/navigation";
  import type { SubmitFunction } from "@sveltejs/kit";
  import Button from "components/Button.svelte";
  import DataTable from "components/DataTable.svelte";
  import { snackBars } from "components/SnackBars.svelte";
  import Star from "svelte-material-icons/Star.svelte";
  import StarOutline from "svelte-material-icons/StarOutline.svelte";
  import ArrowRight from "svelte-material-icons/ArrowRightBoldHexagonOutline.svelte";

  export let data;
  let loading = "";

  const handleAddFav: SubmitFunction = ({ formData }) => {
    loading = formData.get("groupId") as string;

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          invalidate("app:groupsList");
          invalidate("app:favGroups");
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
  <h1>Groupes</h1>

  <DataTable
    headers={[
      { value: "name", text: "Nom" },
      { value: "nbStudents", text: "Élèves" },
      { value: "level", text: "Niveau" },
      { value: "admins", text: "Administrateurs", noSorting: true },
      { value: "fav", text: "Favori" },
    ]}
    items={data.groups}
    sortByDefault="name"
    sortBy="name"
    emptyText="Aucun groupe n’a été créé pour cet établissement !"
    lineNumbering
  >
    <tr slot="item" let:item={{ key, name, nbStudents, level, admins, fav }} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5em;">
          <span>{name}</span>
          <a href={`groups/${key}`} tabindex="-1">
            <Button variant="text" --primary="var(--fiesta)" icon>
              <ArrowRight />
            </Button>
          </a>
        </div>
      </td>
      <td class="center">{nbStudents}</td>
      <td class="center">{level}</td>
      <td class="center">{admins ? admins.join(", ") : ""}</td>
      <td class="center">
        <form method="POST" action="?/addFav" use:enhance={handleAddFav}>
          <Button
            formSubmit
            variant="text"
            title="Ajouter un raccourci dans la barre de navigation"
            --primary="var(--aspen-gold)"
            loading={loading === key}
            icon
          >
            {#if fav}
              <Star />
            {:else}
              <StarOutline />
            {/if}
          </Button>
          <input type="hidden" name="groupId" value={key} />
          <input type="hidden" name="groupName" value={name} />
          <input type="hidden" name="fav" value={fav ? "yes" : "no"} />
        </form>
      </td>
    </tr>
  </DataTable>
</div>
