<script>
  import { darken, lighten } from "$lib/utilities";
  import Button from "$lib/components/Button.svelte";
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import TextField from "$lib/components/TextField.svelte";
  import Card from "components/Card.svelte";
  import Modal from "components/Modal.svelte";
  import SnackBars, { snackBars } from "components/SnackBars.svelte";
  import DataTable from "components/DataTable.svelte";
  import NavBar from "components/NavBar.svelte";

  let showModal = false;
  let snackBarCount = 1;
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
  <Button variant="outlined" disabled>
    <AccountCircle slot="append" />
    Hello, <strong>world</strong>!</Button
  >
  <Button --primary="var(--red)" --secondary="white" variant="filled" size="small" shrinkToIcon>
    <AccountCircle slot="append" />
    Hello, <strong>world</strong>!</Button
  >
  <Button variant="outlined" size="medium" --primary="var(--indigo)" --secondary="white">
    <AccountCircle slot="append" />
    Hello, <strong>world</strong>!</Button
  >
  <a href="https://svelte.dev">
    <Button
      variant="elevated"
      size="large"
      --primary={lighten("var(--yellow)", 55)}
      --secondary="black"
    >
      <AccountCircle slot="prepend" />
      Hello, <strong>world</strong>!</Button
    >
  </a>
  <Button
    variant="elevated"
    size="large"
    --primary="var(--deep-orange)"
    --secondary="white"
    on:click={() => (showModal = true)}
  >
    <AccountCircle slot="append" />
    Hello, <strong>world</strong>!</Button
  >
  <Button variant="elevated" size="small" icon>
    <AccountCircle />
  </Button>
  <Button
    variant="outlined"
    size="medium"
    --primary="var(--teal)"
    icon
    on:click={() => {
      snackBars.haveASnack(
        `Hello! I'm a SnackBar #${snackBarCount++}! This is absolutely great!`,
        "info",
        0,
      );
    }}
  >
    <AccountCircle />
  </Button>
  <a href="https://svelte.dev">
    <Button
      variant="flat"
      size="large"
      --primary={lighten("var(--purple)", 20)}
      --secondary="white"
      icon
    >
      <AccountCircle />
    </Button>
  </a>
  <br />
  <br />
  <div>
    <TextField
      type="url"
      label="Hello, world!"
      placeholder="Hello, world!"
      required
      hint="Hello, world!"
    >
      <AccountCircle slot="prepend" />
    </TextField>
  </div>

  <DataTable
    headers={[
      { value: "name", text: "Nom", noSorting: false, align: "start" },
      { value: "age", text: "Age" },
    ]}
    items={[
      { key: 0, name: "Philippe", age: 18 },
      { key: 1, name: "Marion", age: 20 },
      { key: 2, name: "Mummy", age: 48 },
      { key: 3, name: "Daddy", age: 50 },
    ]}
    lineNumbering
  >
    <tr slot="item" let:item={{ name, age }} let:lineNumber>
      <td class="center">{lineNumber}</td>
      <td>{name}</td>
      <td class="center">{age}</td>
    </tr>
  </DataTable>

  <SnackBars />

  <Modal bind:show={showModal} closeOnBgClick>
    <Card>
      <header>
        <h2 class="title" style="text-align: center">Title</h2>
        <h3 class="subtitle">Subtitle</h3>
      </header>
      <div class="content">
        <p>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Hic, est nihil laudantium
          nesciunt magni tempore animi perspiciatis qui ullam excepturi sit ipsa repellat cum, omnis
          mollitia ex deserunt adipisci unde assumenda, quam voluptatum. Distinctio id possimus,
          aperiam officia, dicta unde debitis doloribus sit, est repellat reiciendis suscipit
          necessitatibus odio aut! Temporibus corporis culpa molestias? A ratione magni dolore.
          Laborum libero quisquam, eveniet nostrum nemo eum laudantium maxime architecto quidem
          temporibus exercitationem et quia dicta sit!
        </p>
        <p>
          Quasi nulla nisi minus fuga vitae nostrum quos! Delectus rerum error fugit distinctio
          architecto! Magni assumenda adipisci omnis non impedit ad unde dolores beatae praesentium
          nemo iure, officiis dolor deleniti voluptatum sapiente hic aperiam magnam fuga iste!
          Repellat quae, similique quisquam iste ad qui quo praesentium voluptatum cum ducimus sit
          soluta reprehenderit obcaecati voluptas distinctio earum id saepe maxime minima quidem,
          provident cumque. Quod nihil quos tenetur harum minus mollitia laborum sunt eos sapiente
          accusamus. Quasi, delectus facilis. Reiciendis error necessitatibus distinctio delectus
          aliquid temporibus maiores voluptate molestias aliquam architecto expedita dicta commodi
          animi incidunt quaerat assumenda, nam aperiam magni facilis eum accusamus quis! Atque aut
          suscipit tempora. Officia quam aliquid, magni, mollitia ipsam provident quia, facere
          voluptas molestias nemo odio exercitationem officiis? Inventore, expedita?
        </p>
      </div>
      <div class="actions">
        <Button variant="outlined" --primary="var(--orange)" on:click={() => (showModal = false)}
          >Cancel</Button
        >
        <Button --primary="var(--yellow)">Click me!</Button>
      </div>
    </Card>
  </Modal>
</section>
