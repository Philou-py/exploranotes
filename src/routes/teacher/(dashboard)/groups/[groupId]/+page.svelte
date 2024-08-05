<script lang="ts">
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import Dialog from "components/Dialog.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import AccountPlus from "svelte-material-icons/AccountPlus.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import AccountMultiplePlus from "svelte-material-icons/AccountMultiplePlus.svelte";
  import ArrowRight from "svelte-material-icons/ArrowRightThin.svelte";
  import AccountGroup from "svelte-material-icons/AccountGroup.svelte";
  import Delete from "svelte-material-icons/DeleteOutline.svelte";
  import { alternateColours, colours, lighten } from "$lib/utilities.js";
  import Chip from "components/Chip.svelte";
  import TextField from "components/TextField.svelte";
  import { applyAction, enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";
  import Select from "components/Select.svelte";

  export let data;
  let showAddDialog = false;
  let showDelDialog = false;

  let loading = "";
  const handleAddDelSubgroup: SubmitFunction = () => {
    return async ({ result }) => {
      switch (result.type) {
        case "success":
          invalidate("app:groupDetails");
          showAddDialog = false;
          showDelDialog = false;
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

  const handleJoinSubgroup: SubmitFunction = ({ formData }) => {
    loading = formData.get("stUid") as string;

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          invalidate("app:groupDetails");
          snackBars.haveASnack(result.data!.message);
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
    {data.name}<br />
    <span style="font-size: 80%">{data.level}</span>
  </h1>

  <section class="subjects">
    {#each data.subjects as subject, i (subject.uid)}
      <a href={`/teacher/subjects/${subject.uid}`} tabindex="-1">
        <Button
          variant="outlined"
          --primary={`var(--${colours[i]})`}
          size="large"
          style="height: 4em;"
        >
          <span class="subName">{subject.name}</span>
          <ArrowRight slot="append" />
        </Button>
      </a>
    {/each}
  </section>

  <h2>Sous-groupes</h2>

  <div class="subgroups">
    {#each data.subgroups as subgroup (subgroup.uid)}
      <Chip bgColour={subgroup.colour} size="medium">{subgroup.name}</Chip>
    {/each}
    {#if data.subgroups.length === 0}
      <p>Aucun sous-groupe n&rsquo;a été créé !</p>
    {/if}

    <Dialog bind:show={showAddDialog} width="300px" --primary={lighten("var(--pepper-stem)", 80)}>
      <Button
        slot="trigger"
        on:click={() => {
          showAddDialog = !showAddDialog;
          showDelDialog = false;
        }}
        variant="text"
        --primary="var(--pepper-stem)"
        style="margin-left: 1em;"
        shrinkToIcon
      >
        <AccountMultiplePlus slot="prepend" />
        Nouveau
      </Button>

      <form
        method="POST"
        action="?/addSubgroup"
        use:enhance={(e) => {
          loading = "addSubgroup";
          return handleAddDelSubgroup(e);
        }}
        class="dialogContent"
      >
        <TextField name="name" label="Nom" placeholder="Exs : si, I, 1, B" required>
          <AccountCircle slot="prepend" />
        </TextField>

        <Button
          formSubmit
          variant="text"
          --primary="var(--eden)"
          --secondary="transparent"
          loading={loading === "addSubgroup"}
          icon
        >
          <Send />
        </Button>
      </form>
    </Dialog>

    {#if data.subgroups.length > 0}
      <Dialog bind:show={showDelDialog} width="300px" --primary={lighten("var(--fiesta)", 80)}>
        <Button
          slot="trigger"
          on:click={() => {
            showDelDialog = !showDelDialog;
            showAddDialog = false;
          }}
          variant="text"
          --primary="var(--fiesta)"
          title="Supprimer des sous-groupes"
          shrinkToIcon
        >
          <Delete slot="prepend" />
          Supprimer
        </Button>

        <form
          method="POST"
          action="?/delSubgroup"
          use:enhance={(e) => {
            loading = "delSubgroup";
            return handleAddDelSubgroup(e);
          }}
          class="dialogContent"
        >
          <Select
            name="sgUid"
            items={data.subgroupsItems}
            label="Sous-groupe"
            persistentHint
            required
          >
            <AccountGroup slot="prepend" />
          </Select>

          <Button
            formSubmit
            variant="text"
            --primary="var(--eden)"
            --secondary="transparent"
            loading={loading === "delSubgroup"}
            icon
          >
            <Send />
          </Button>
        </form>
      </Dialog>
    {/if}
  </div>

  <DataTable
    headers={[
      { value: "lastName", text: "Nom de famille" },
      { value: "firstName", text: "Prénom" },
      { value: "subgroups", text: "Sous-groupes", noSorting: true },
    ]}
    items={data.students}
    sortByDefault="lastName"
    sortBy="lastName"
    lineNumbering
  >
    <tr slot="item" let:item={st} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>{st.lastName}</td>
      <td>{st.firstName}</td>
      <td>
        <div class="flexCenter">
          {#if st.subgroups}
            {#each st.subgroups as subgroup (subgroup.uid)}
              <Chip bgColour={subgroup.colour}>{subgroup.name}</Chip>
            {/each}
          {/if}

          <Dialog width="300px" let:toggle>
            <Button
              slot="trigger"
              let:toggle
              on:click={toggle}
              variant="text"
              title="Ajouter / retirer un sous-groupe"
              --primary="var(--toffee)"
              size="small"
              style="margin-left: 0.5em"
              disabled={data.subgroups.length === 0}
              icon
            >
              <AccountPlus />
            </Button>

            <form
              method="POST"
              action="?/addRemSubgroup"
              use:enhance={(e) => {
                toggle();
                return handleJoinSubgroup(e);
              }}
              class="dialogContent"
            >
              <input type="hidden" name="stUid" value={st.key} />
              <input type="hidden" name="stName" value={`${st.firstName} ${st.lastName}`} />
              <Select
                name="sgUid"
                items={data.subgroupsItems}
                label="Sous-groupe"
                hint="Ajout / retrait si déjà présent"
                persistentHint
                required
              >
                <AccountGroup slot="prepend" />
              </Select>

              <Button
                formSubmit
                variant="text"
                --primary="var(--eden)"
                --secondary="transparent"
                loading={loading === st.key}
                icon
              >
                <Send />
              </Button>
            </form>
          </Dialog>
        </div>
      </td>
    </tr>
  </DataTable>
</div>

<style>
  .subjects {
    display: flex;
    gap: 1em;
    margin: 2em 0;
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
</style>
