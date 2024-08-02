<script lang="ts" context="module">
  export interface TableHeader<TableItem> {
    text: string;
    value: keyof Omit<TableItem, "key"> | "actions";
    noSorting?: boolean;
    align?: "start" | "center" | "end";
  }
</script>

<script lang="ts" generics="TableItem extends { key: number | string }">
  import ArrowUp from "svelte-material-icons/ArrowUp.svelte";

  export let headers: TableHeader<TableItem>[];
  export let items: TableItem[];
  export let lineNumbering = false;
  export let sortBy: keyof TableItem = "key";
  export let sortByDefault: keyof TableItem = "key";
  export let sortOrder: "ASC" | "DESC" = "ASC";
  export let emptyText = "Pas de données !";

  const handleToggleSort = (field: keyof TableItem) => {
    if (sortBy === field) {
      if (sortOrder === "ASC") sortOrder = "DESC";
      else {
        sortBy = sortByDefault;
        sortOrder = "ASC";
      }
    } else {
      sortBy = field;
      sortOrder = "ASC";
    }
  };

  $: items = [...items].sort((itemA, itemB) => {
    let decision = 0;
    if (itemA[sortBy] < itemB[sortBy]) {
      decision = -1;
    } else if (itemA[sortBy] > itemB[sortBy]) {
      decision = 1;
    }
    return sortOrder === "ASC" ? decision : -decision;
  });
</script>

<div class="tableWrapper">
  <table>
    <thead>
      <tr class="headers">
        {#if lineNumbering}
          <th class="center noSorting" />
        {/if}
        {#each headers as { value, text, align = "center", noSorting } (value)}
          <th
            class={align}
            class:activeSort={sortBy === value}
            class:noSorting
            on:click={() => {
              if (!noSorting && value !== "actions") handleToggleSort(value);
            }}
          >
            {text}
            {#if !noSorting}
              <ArrowUp
                class="sortIcon {sortBy === value && sortOrder === 'DESC' ? 'reversed' : ''}"
              />
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if items.length === 0}
        <tr>
          <td colSpan={headers.length + (lineNumbering ? 1 : 0)} class="noData">{emptyText}</td>
        </tr>
      {:else}
        {#each items as item, lineNumber (item.key)}
          <slot name="item" {item} lineNumber={lineNumber + 1} />
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .tableWrapper {
    overflow: auto;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.1);
    border-radius: 10px;
  }

  table {
    width: 100%;
    background-color: white;
    border-collapse: collapse;
    color: rgb(0 0 0 / 0.87);
  }

  .noData {
    font-weight: 500;
    text-align: center;
    padding: 10px 0;
  }

  :global(.start) {
    text-align: start;
  }

  :global(.center) {
    text-align: center;
  }

  :global(.end) {
    text-align: end;
  }

  :global(.flexCenter) {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.2em;
    flex-wrap: wrap;
  }

  :global(tr:not(.headers):hover td) {
    background-color: rgb(0 0 0 / 0.05);
    background-clip: padding-box;
  }

  thead th,
  :global(tbody tr:not(:last-of-type)) {
    border-bottom: 1px solid rgb(0 0 0 / 0.12);
  }

  thead th:not(:last-of-type),
  :global(tbody tr td:not(:last-of-type)) {
    border-right: 1px solid rgb(0 0 0 / 0.12);
  }

  th,
  :global(td) {
    padding: 5px 10px;
    transition: background-color ease 80ms;
  }

  :global(td.breakAll) {
    word-break: break-all;
  }

  @media (max-width: 1264px) {
    th,
    :global(td) {
      white-space: wrap;
    }
  }

  :global(.sortIcon) {
    display: inline;
    vertical-align: middle;
    color: rgb(0 0 0 / 0.6);
    opacity: 0;
    transition:
      transform ease 400ms,
      color ease 400ms,
      opacity ease 200ms;
  }

  :global(.sortIcon.reversed) {
    transform: rotate(0.5turn);
  }

  :global(th:hover .sortIcon) {
    opacity: 1;
    color: rgb(0 0 0 / 0.6);
  }

  :global(th.activeSort .sortIcon) {
    opacity: 1;
    color: rgb(0 0 0 / 0.97);
  }

  th {
    font-size: 1.1em;
    font-weight: 500;
    color: rgb(0 0 0 / 0.6);
    cursor: pointer;
    transition: color ease 200ms;
  }

  th:hover {
    color: rgb(0 0 0 / 0.97);
  }

  th.activeSort {
    color: rgb(0 0 0 / 0.97);
  }

  th.noSorting {
    cursor: default;
  }
</style>
