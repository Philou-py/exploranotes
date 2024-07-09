<script lang="ts">
  import { lighten } from "$lib/utilities";
  import Button from "components/Button.svelte";
  import Select from "components/Select.svelte";
  import School from "svelte-material-icons/School.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import { enhance, applyAction } from "$app/forms";
  import type { SubmitFunction } from "./$types";
  import { snackBars } from "components/SnackBars.svelte";

  export let data;
  let loading = false;
  let selectedUid = data.pendingSchool?.uid || "";

  const handleSelectSchool: SubmitFunction = () => {
    loading = true;

    return async ({ result }) => {
      loading = false;
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          break;
        case "failure":
          snackBars.haveASnack(result.data!.message, "error");
          break;
        default:
          await applyAction(result);
      }
    };
  };
</script>

<div class="card formCard" style:--bg-colour={lighten("var(--peach-pink)", 70)}>
  <header>
    <h2 class="cardTitle">Rejoindre un établissement</h2>
  </header>
  {#if data.pendingSchool}
    <p style="text-align: center">
      Vous avez effectué la demande de rejoindre {data.pendingSchool.name} à {data.pendingSchool
        .city}. Si les administrateurs n&rsquo;ont pas reçu d&rsquo;email, vous pouvez toujours
      réessayer.
    </p>
  {:else}
    <p style="text-align: center">
      Une demande sera envoyée par email aux administrateurs de l&rsquo;établissement.
    </p>
  {/if}
  <form method="POST" use:enhance={handleSelectSchool}>
    <Select
      label="Établissement"
      name="schoolUid"
      items={data.schools.map(({ uid, name, city }) => [uid, `${name} à ${city}`])}
      bind:value={selectedUid}
      readonly={!!data.pendingSchool}
      required
    >
      <School slot="prepend" />
    </Select>
    <div class="cardActions">
      <a href="/teacher/school-creation" tabindex="-1">
        <Button variant="text">Nouvel établissement</Button>
      </a>
      <Button formSubmit {loading} --primary={lighten("var(--fruit-dove)", 0)} --secondary="white">
        Valider
        <Send slot="append" />
      </Button>
    </div>
  </form>
</div>
