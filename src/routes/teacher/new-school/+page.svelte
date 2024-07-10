<script lang="ts">
  import { lighten } from "$lib/utilities";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import { snackBars } from "components/SnackBars.svelte";
  import MapMarker from "svelte-material-icons/MapMarker.svelte";
  import HomeGroup from "svelte-material-icons/HomeGroup.svelte";
  import School from "svelte-material-icons/School.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import { enhance, applyAction } from "$app/forms";
  import type { SubmitFunction } from "./$types";
  import { goto } from "$app/navigation";

  let loading = false;

  const handleCreateSchool: SubmitFunction = () => {
    loading = true;

    return async ({ result }) => {
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          goto("/teacher");
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
    <h3 class="cardTitle">Créer un établissement</h3>
  </header>
  <p style="text-align: center">
    Vous en deviendrez un administrateur, en charge de traiter les demandes, qui vous parviendront
    par email, d&rsquo;autres professeurs voulant le rejoindre.
  </p>
  <form method="POST" use:enhance={handleCreateSchool}>
    <TextField
      name="schoolName"
      label="Nom de l'établissement"
      placeholder="Ex : Lycée Fabert"
      required
    >
      <School slot="prepend" />
    </TextField>
    <TextField
      name="schoolAddress"
      label="Adresse"
      placeholder="Ex : 12 Rue Saint-Vincent, 57000 Metz"
      required
    >
      <MapMarker slot="prepend" />
    </TextField>
    <TextField name="academy" label="Académie" placeholder="Ex : Nancy-Metz" required>
      <HomeGroup slot="prepend" />
    </TextField>
    <div class="cardActions">
      <a href="/teacher/select-school" tabindex="-1">
        <Button variant="text">Rejoindre</Button>
      </a>
      <Button formSubmit {loading} --primary="var(--fruit-dove)" --secondary="white">
        Valider
        <Send slot="append" />
      </Button>
    </div>
  </form>
</div>
