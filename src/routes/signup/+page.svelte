<script lang="ts">
  import { lighten } from "$lib/utilities";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import Face from "svelte-material-icons/FaceManOutline.svelte";
  import FaceShimmer from "svelte-material-icons/FaceManShimmerOutline.svelte";
  import TicketConfirmation from "svelte-material-icons/TicketConfirmation.svelte";
  import Badge from "svelte-material-icons/BadgeAccountHorizontalOutline.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import Lock from "svelte-material-icons/Lock.svelte";
  import Send from "svelte-material-icons/Send.svelte";
  import { slide } from "svelte/transition";
  import Checkbox from "components/Checkbox.svelte";

  let accountType: "teacher" | "student" = "student";
  let noIne = false;
</script>

<div class="card" style:--bg-colour={lighten("var(--aspen-gold)", 70)}>
  <header>
    <h1 class="cardTitle">Inscription</h1>
  </header>
  <div class="content">
    <form>
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

      <TextField type="email" name="email" label="Adresse email" required>
        <AccountCircle slot="prepend" />
      </TextField>
      <TextField type="password" name="password" label="Mot de passe" minlength={6} required>
        <Lock slot="prepend" />
      </TextField>

      <TextField name="firstName" label="Prénom" required>
        <FaceShimmer slot="prepend" />
      </TextField>
      <TextField name="lastName" label="Nom de famille" required>
        <Face slot="prepend" />
      </TextField>

      {#if accountType === "student"}
        <div transition:slide={{ duration: 250 }}>
          <TextField
            name="ine"
            label="Numéro INE"
            placeholder="Exemple : 090299629KG"
            hint="Il figure en général sur les bulletins."
            minlength={11}
            maxlength={11}
            disabled={noIne}
            required={!noIne}
          >
            <TicketConfirmation slot="prepend" />
          </TextField>
          <Checkbox name="noIne" bind:checked={noIne} title="Par exemple, pour les étudiants étrangers">
            <svelte:fragment slot="right">Pas de numéro INE ?</svelte:fragment>
          </Checkbox>
        </div>
      {/if}
    </form>
  </div>

  <div class="cardActions">
    <a href="/signin">
      <Button variant="text">Déjà un compte ?</Button>
    </a>
    <Button --primary={lighten("var(--dark-cheddar)", 30)} style="margin-left: auto">
      Valider
      <Send slot="append" />
    </Button>
  </div>
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
