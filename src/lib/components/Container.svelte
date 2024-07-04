<script lang="ts">
  export let size: "xNarrow" | "narrow" | "normal" | "large" = "normal";
</script>

<div class="container {size}">
  <slot />
</div>

<style lang="scss">
  $xs: 600px;
  $sm: 960px;
  $md: 1264px;
  $lg: 1904px;

  .container.xNarrow {
    padding: 0 20px;
  }

  .container.narrow {
    @media (max-width: $xs) {
      padding: 0 2%;
    }

    @media (max-width: $sm) {
      padding: 0 4%;
    }

    @media (max-width: $md) {
      padding: 0 5%;
    }

    @media (max-width: $lg) {
      padding: 0 7%;
    }

    @media (min-width: $lg) {
      padding: 0 13%;
    }
  }

  .container {
    @media (max-width: $xs) {
      padding: 0 3%;
    }

    @media (max-width: $sm) {
      padding: 0 5%;
    }

    @media (max-width: $md) {
      padding: 0 10%;
    }

    @media (max-width: $lg) {
      padding: 0 13%;
    }

    @media (min-width: $lg) {
      padding: 0 18%;
    }
  }

  .container.large {
    @media (max-width: $xs) {
      padding: 0 5%;
    }

    @media (max-width: $sm) {
      padding: 0 10%;
    }

    @media (max-width: $md) {
      padding: 0 15%;
    }

    @media (max-width: $lg) {
      padding: 0 20%;
    }

    @media (min-width: $lg) {
      padding: 0 25%;
    }
  }
</style>
