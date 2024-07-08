<script lang="ts">
  import type { SubmitFunction } from "./$types";
  import { lighten } from "$lib/utilities";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import Face from "svelte-material-icons/FaceManOutline.svelte";
  import FaceShimmer from "svelte-material-icons/FaceManShimmerOutline.svelte";
  import Badge from "svelte-material-icons/BadgeAccountHorizontalOutline.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import Lock from "svelte-material-icons/Lock.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import { applyAction, enhance } from "$app/forms";
  import { snackBars } from "components/SnackBars.svelte";
  import { goto } from "$app/navigation";

  let accountType: "teacher" | "student" = "student";
  let loading = false;

  const handleSubmit: SubmitFunction = ({ formData }) => {
    loading = true;
    formData.set("sideBarOpen", window.matchMedia("(max-width: 960px)").matches ? "no" : "yes");

    return async ({ result }) => {
      loading = false;
      switch (result.type) {
        case "success":
          snackBars.haveASnack(result.data!.message);
          goto("/signup/email-verif", { invalidateAll: true });
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

<div class="card" style:--bg-colour={lighten("var(--aspen-gold)", 70)}>
  <header>
    <h1 class="cardTitle">Inscription</h1>
  </header>
  <form method="POST" use:enhance={handleSubmit}>
    <div class="content">
      <div class="accountRadio">
        <span>
          <Badge class="icon" />
          Type de compte :
        </span>
        <div class="radioGroup">
          <input
            type="radio"
            name="accountType"
            id="student"
            value="student"
            checked={accountType === "student"}
            on:change={() => (accountType = "student")}
          />
          <label for="student">Étudiant</label>
          <input
            type="radio"
            name="accountType"
            id="teacher"
            value="teacher"
            checked={accountType === "teacher"}
            on:change={() => (accountType = "teacher")}
          />
          <label for="teacher">Professeur</label>
        </div>
      </div>

      <TextField type="email" name="email" autocomplete="email" label="Adresse email" required>
        <AccountCircle slot="prepend" />
      </TextField>
      <TextField
        type="password"
        name="password"
        autocomplete="new-password"
        label="Mot de passe"
        minlength={7}
        required
      >
        <Lock slot="prepend" />
      </TextField>

      <TextField name="firstName" label="Prénom" autocomplete="given-name" required>
        <FaceShimmer slot="prepend" />
      </TextField>
      <TextField name="lastName" label="Nom de famille" autocomplete="family-name" required>
        <Face slot="prepend" />
      </TextField>
    </div>

    <div class="cardActions">
      <a href="/signin" tabindex="-1">
        <Button variant="text">Déjà un compte ?</Button>
      </a>
      <Button
        formSubmit
        {loading}
        --primary={lighten("var(--dark-cheddar)", 30)}
        style="margin-left: auto"
      >
        Valider
        <Send slot="append" />
      </Button>
    </div>
  </form>
</div>

<style>
  .card {
    width: clamp(350px, 40%, 600px);
    margin: 30px auto;
  }

  @media (max-width: 960px) {
    .card {
      width: 90%;
    }
  }

  @media (max-width: 600px) {
    .card {
      margin: 0;
      width: 100%;
      box-shadow: none;
      border-radius: 0;
      background-color: white;
    }
  }

  .cardActions {
    justify-content: space-between;
  }

  .accountRadio {
    font-size: inherit;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin: 0.5em 0;
    color: rgba(0, 0, 0, 0.7);
  }

  :global(.accountRadio .icon) {
    display: inline;
    vertical-align: bottom;
    margin-right: 5px;
  }

  .radioGroup {
    margin: 0 0 0 auto;
  }

  .radioGroup input {
    margin: 0;
    margin-right: 5px;
  }

  .radioGroup label {
    margin-right: 5px;
  }
</style>
