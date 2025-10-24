import { pgGenerate } from "drizzle-dbml-generator"; // Using Postgres for this example
import { schema } from "../src/db/index";

const out = "./schema.dbml";
const relational = true;

pgGenerate({ schema, out, relational });
