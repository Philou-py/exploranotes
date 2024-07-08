import { DgraphClientStub, DgraphClient } from "dgraph-js";
import { DGRAPH_URL } from "$env/static/private";

const clientStub = new DgraphClientStub(DGRAPH_URL);
export const db = new DgraphClient(clientStub);
