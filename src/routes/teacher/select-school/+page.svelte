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
  let pendingSchool = data.schools.find(({ uid }) => uid === selectedUid);

  const handleSelectSchool: SubmitFunction = () => {
    loading = true;

    return async ({ result }) => {
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
      loading = false;
    };
  };
</script>

<div class="card formCard" style:--bg-colour={lighten("var(--peach-pink)", 70)}>
  <header>
    <h2 class="cardTitle">Rejoindre un établissement</h2>
  </header>
  {#if pendingSchool}
    <p style="text-align: center">
      Vous avez effectué la demande de rejoindre {pendingSchool.name}, {pendingSchool.address}. Si
      les administrateurs n&rsquo;ont pas reçu d&rsquo;email, vous pouvez toujours réessayer.
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
      items={data.schools.map(({ uid, name, address }) => [uid, `${name}, ${address}`])}
      bind:value={selectedUid}
      readonly={!!data.pendingSchool}
      required
    >
      <School slot="prepend" />
    </Select>
    <div class="cardActions">
      {#if !data.pendingSchool}
        <a href="/teacher/new-school" tabindex="-1">
          <Button variant="text">Nouvel établissement</Button>
        </a>
      {/if}
      <Button formSubmit {loading} --primary="var(--fruit-dove)" --secondary="white">
        Valider
        <Send slot="append" />
      </Button>
    </div>
  </form>
</div>
