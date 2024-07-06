<script lang="ts">
  import { lighten } from "$lib/utilities";
  import Button from "components/Button.svelte";
  import TextField from "components/TextField.svelte";
  import BadgeAccountHorizontalOutline from "svelte-material-icons/BadgeAccountHorizontalOutline.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import Lock from "svelte-material-icons/Lock.svelte";
  import Send from "svelte-material-icons/Send.svelte";
</script>

<div class="card" style:--bg-colour={lighten("var(--aspen-gold)", 70)}>
  <header>
    <h1 class="cardTitle">Connexion</h1>
  </header>
  <div class="content">
    <form>
      <TextField type="email" name="email" label="Adresse email" required>
        <AccountCircle slot="prepend" />
      </TextField>
      <TextField type="password" name="password" label="Mot de passe" minlength={6} required>
        <Lock slot="prepend" />
      </TextField>
    </form>
  </div>
  <div class="cardActions">
    <a href="/signup">
      <Button variant="text">Pas de compte ?</Button>
    </a>
    <Button --primary={lighten("var(--dark-cheddar)", 30)}>
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
</style>
