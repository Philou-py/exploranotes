<script lang="ts">
  import DataTable from "components/DataTable.svelte";
  import Button from "components/Button.svelte";
  import Plus from "svelte-material-icons/Plus.svelte";
  import Delete from "svelte-material-icons/DeleteOutline.svelte";
  import Check from "svelte-material-icons/Check.svelte";
  import Close from "svelte-material-icons/Close.svelte";
  import Face from "svelte-material-icons/FaceManOutline.svelte";
  import FaceShimmer from "svelte-material-icons/FaceManShimmerOutline.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { enhance, applyAction } from "$app/forms";
  import type { AddStudentsReturn, SummaryItem } from "./+page.server";
  import { snackBars } from "components/SnackBars.svelte";
  import { invalidate } from "$app/navigation";
  import { slide } from "svelte/transition";
  import TextField from "components/TextField.svelte";
  import Modal from "components/Modal.svelte";
  import { darken } from "$lib/utilities";
  import { tick } from "svelte";

  let modalOpen = false;
  let loading = false;
  let forceAddStudents = false;
  let summaryItems: SummaryItem[] | undefined;
  let stIdCounter = 1;
  let newStudentIds = ["st1"];
  let form: HTMLFormElement;

  const handleAdd = async () => {
    const newId = `st${++stIdCounter}`;
    newStudentIds = [...newStudentIds, newId];
    await tick();
    form.querySelector<HTMLFormElement>(`input[name="${newId}:firstName"]`)?.focus();
  };

  const handleSubmitStudents: SubmitFunction<AddStudentsReturn, { message: string }> = () => {
    loading = true;

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          summaryItems = result.data?.summary;
          if (result.data?.message) {
            snackBars.haveASnack(result.data!.message);
            invalidate("app:students");
            modalOpen = false;
            setTimeout(() => form.reset(), 300);
          }
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
      loading = false;
    };
  };
</script>

<Button on:click={() => (modalOpen = true)} --primary="var(--living-coral)" --secondary="white">
  Ajouter des élèves
</Button>

<Modal show={modalOpen}>
  <div class="card">
    <header>
      <h2 class="cardTitle center">Ajouter des élèves</h2>
    </header>

    <form method="POST" action="?/addStudents" use:enhance={handleSubmitStudents} bind:this={form}>
      {#each newStudentIds as id (id)}
        <section class="group" transition:slide>
          <div class="newStudent">
            <div class="textFields">
              <TextField name={`${id}:firstName`} label="Prénom" required>
                <FaceShimmer slot="prepend" />
              </TextField>
              <TextField name={`${id}:lastName`} label="Nom de famille" required>
                <Face slot="prepend" />
              </TextField>
              <TextField
                type="email"
                name={`${id}:email`}
                label="Adresse électronique"
                hint="Laisser vide si inconnue"
              >
                <AccountCircle slot="prepend" />
              </TextField>
            </div>
            <Button
              variant="text"
              size="small"
              tabindex={-1}
              --primary="var(--jester-red)"
              disabled={newStudentIds.length === 1}
              on:click={() => (newStudentIds = newStudentIds.filter((stId) => stId !== id))}
              icon
            >
              <Delete />
            </Button>
          </div>
          <hr />
        </section>
      {/each}

      <div class="add">
        <Button
          variant="outlined"
          --primary={darken("var(--pepper-stem)", 20)}
          on:click={handleAdd}
        >
          <Plus slot="prepend" />
          Nouvel élève
        </Button>
      </div>

      {#if summaryItems}
        <div class="summary" transition:slide>
          <p class="center">
            Les élèves dont l&rsquo;adresse électronique correspond à celle d&rsquo;un élève déjà
            inscrit dans un autre établissement, ou à celle d&rsquo;un professeur existant, seront
            ignorés.
          </p>

          <p class="center">
            En revanche, si une adresse électronique correspond à celle d&rsquo;un élève sans
            établissement, celui-ci sera affecté au vôtre et son nom sera modifié.
          </p>

          <p class="center">
            Si vous tentez d&rsquo;ajouter plusieurs élèves avec le même nom et sans adresse
            électronique, seulement l&rsquo;un d&rsquo;entre eux sera pris en compte.
          </p>

          <p class="center">
            Renseigner des informations associées à l&rsquo;adresse électronique d&rsquo;un élève de
            l&rsquo;établissement n&rsquo;aura aucun impact.
          </p>

          <DataTable
            headers={[
              { value: "name", text: "Nom" },
              { value: "email", text: "Adresse électronique" },
              { value: "existingAccount", text: "Compte existant" },
              { value: "schoolStatus", text: "Établissement" },
              { value: "isTeacher", text: "Professeur" },
              { value: "duplicate", text: "Doublon" },
            ]}
            items={summaryItems}
            lineNumbering
          >
            <tr
              slot="item"
              let:item={{ name, email, existingAccount, schoolStatus, isTeacher, duplicate }}
              let:lineNumber
              class:highlight={schoolStatus !== "none" || isTeacher || duplicate}
            >
              <td class="center">{lineNumber}</td>
              <td>{name}</td>
              <td class="breakAll">{email}</td>
              <td>
                {#if existingAccount}
                  <Check />
                {:else}
                  <Close />
                {/if}
              </td>
              <td class="center">
                {#if schoolStatus === "current"}
                  <span class="bad">Déjà présent(e)</span>
                {:else if schoolStatus === "other"}
                  <span class="bad">Autre</span>
                {:else}
                  Aucun
                {/if}
              </td>
              <td>
                {#if isTeacher}
                  <span class="bad"><Check /></span>
                {:else}
                  <Close />
                {/if}
              </td>
              <td>
                {#if duplicate}
                  <span class="bad"><Check /></span>
                {:else}
                  <Close />
                {/if}
              </td>
            </tr>
          </DataTable>

          <p class="center">
            Les lignes en fond gris requierent votre attention et seront ignorées si vous validez le
            formulaire.
          </p>
        </div>
      {/if}

      <div class="cardActions">
        <Button variant="text" --primary="var(--jester-red)" on:click={() => (modalOpen = false)}>
          Annuler
        </Button>
        <!-- The first submit button will be used when pressing 'Enter' -->
        <Button
          variant="outlined"
          formSubmit
          on:click={() => {
            forceAddStudents = false;
          }}
          {loading}
          --primary="var(--princess-blue)"
          --secondary="white"
        >
          Vérifier
        </Button>
        {#if summaryItems}
          <Button
            variant="filled"
            formSubmit
            on:click={() => {
              forceAddStudents = true;
            }}
            {loading}
            --primary="var(--turmeric)"
            --secondary="white"
          >
            Valider
          </Button>
        {/if}
      </div>
      <input type="hidden" name="force" value={forceAddStudents ? "yes" : "no"} />
    </form>
  </div>
</Modal>

<style>
  .newStudent,
  .textFields {
    display: flex;
    align-items: center;
  }

  .textFields {
    flex-grow: 1;
  }

  :global(.textFields > div) {
    margin: 0.3em;
  }

  hr {
    display: none;
  }

  @media (max-width: 600px) {
    .textFields {
      display: block;
      margin-right: 0.3em;
    }

    :global(.textFields > div) {
      margin: 0;
    }

    .group:not(:last-of-type) hr {
      display: block;
    }
  }

  .add {
    display: flex;
    justify-content: center;
    margin: 0.5em 0;
  }

  .bad {
    color: var(--chili-pepper);
  }

  :global(.summary svg) {
    margin: 0 auto;
  }

  .summary {
    margin-top: 1em;
  }

  .highlight {
    background-color: color-mix(in srgb, var(--blue-stone) 70%, white);
    color: white;
  }
</style>
