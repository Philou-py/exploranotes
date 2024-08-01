<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="container">
  <h1>Erreur {$page.status}</h1>
  {#if $page.error}
    <h2>{$page.error.message}</h2>
  {/if}
  <h2>Revenez donc sur <a href="/">la page d&rsquo;accueil</a> !</h2>
</div>

<style>
  .container {
    text-align: center;
  }
</style>
