<script lang="ts">
  import { lighten } from "$lib/utilities";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import Lock from "svelte-material-icons/Lock.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import { enhance, applyAction } from "$app/forms";
  import type { SubmitFunction } from "./$types";
  import { snackBars } from "components/SnackBars.svelte";
  import { goto } from "$app/navigation";

  let loading = false;

  const handleSignIn: SubmitFunction = ({ formData }) => {
    loading = true;
    formData.set("sideBarOpen", window.matchMedia("(max-width: 960px)").matches ? "no" : "yes");

    return ({ result }) => {
      loading = false;
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          goto("/");
          break;
        case "failure":
          snackBars.haveASnack(result.data!.message, "error");
          break;
        default:
          applyAction(result);
      }
    };
  };
</script>

<div class="card formCard" style:--bg-colour={lighten("var(--aspen-gold)", 70)}>
  <header>
    <h2 class="cardTitle">Connexion</h2>
  </header>
  <form method="POST" use:enhance={handleSignIn}>
    <TextField type="email" name="email" autocomplete="email" label="Adresse email" required>
      <AccountCircle slot="prepend" />
    </TextField>
    <TextField
      type="password"
      name="password"
      label="Mot de passe"
      autocomplete="current-password"
      minlength={7}
      required
    >
      <Lock slot="prepend" />
    </TextField>
    <div class="cardActions">
      <a href="/signup" tabindex="-1">
        <Button variant="text">Pas de compte ?</Button>
      </a>
      <Button formSubmit {loading} --primary={lighten("var(--dark-cheddar)", 30)}>
        Valider
        <Send slot="append" />
      </Button>
    </div>
  </form>
</div>
