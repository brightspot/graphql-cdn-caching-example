// Seeds the CMS with a home page, sections, authors and articles through the GraphQL Management API, generating their
// permalinks. Safe to rerun: content that already exists, matched by name or headline, is reused instead of duplicated,
// as is any existing home page.
//
// Uses the demo API client that DemoBootstrapFilter creates. To use another client, set its credentials on the command
// line or in .env.local (git-ignored; copy .env.local.example):
//
//   CMA_CLIENT_ID=... CMA_CLIENT_SECRET=... yarn seed

import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

interface SavedObject {
  _id: string;
  _globals?: {
    com_psddev_cms_db_Directory_ObjectModification?: { paths?: string[] | null } | null;
  } | null;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

loadEnvFiles();

const API_URL = process.env.CMA_GRAPHQL_URL ?? 'http://localhost/management/graphql';
const SITE_URL = process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? 'http://example.localhost';
// Match DemoBootstrapFilter.CLIENT_ID and CLIENT_SECRET.
const CLIENT_ID = process.env.CMA_CLIENT_ID || '00000000-0000-4000-8000-000000000001';
const CLIENT_SECRET = process.env.CMA_CLIENT_SECRET || 'example-news-demo-secret';

const TYPES = {
  homePage: 'com_brightspot_example_model_HomePage',
  section: 'com_brightspot_example_model_Section',
  author: 'com_brightspot_example_model_Author',
  article: 'com_brightspot_example_model_Article',
};

const SECTIONS = ['World', 'Business', 'Technology'];

const AUTHORS = ['Maya Chen', 'Daniel Okafor', 'Sofia Ramirez'];

const ARTICLES = [
  {
    headline: 'Coastal Cities Agree on Shared Flood Defense Plan',
    section: 'World',
    author: 'Maya Chen',
    body: 'Leaders from a dozen coastal cities signed an agreement to pool funding for sea walls and early-warning systems.\n\nThe plan sets out a ten-year schedule and a shared fund that members pay into according to population.',
  },
  {
    headline: 'Regional Rail Link Opens After Five Years of Construction',
    section: 'World',
    author: 'Daniel Okafor',
    body: 'The new line cuts travel time between the two capitals to under three hours.\n\nOfficials expect ridership to reach two million passengers in the first year.',
  },
  {
    headline: 'Small Businesses Report Strongest Quarter Since 2019',
    section: 'Business',
    author: 'Sofia Ramirez',
    body: 'A survey of independent retailers found sales up eight percent on the same quarter last year.\n\nOwners credited steadier supply chains and a rebound in foot traffic.',
  },
  {
    headline: 'Central Bank Holds Rates Steady',
    section: 'Business',
    author: 'Maya Chen',
    body: 'Policymakers left the benchmark rate unchanged for a third consecutive meeting.\n\nThe statement pointed to cooling inflation but said further evidence was needed before any cut.',
  },
  {
    headline: 'Open-Source Weather Model Beats Forecasts in Trials',
    section: 'Technology',
    author: 'Daniel Okafor',
    body: 'Researchers released a forecasting model that outperformed established systems on seven-day predictions.\n\nThe code and training data are available for anyone to download and run.',
  },
  {
    headline: 'Battery Recycling Plant Recovers 95 Percent of Lithium',
    section: 'Technology',
    author: 'Sofia Ramirez',
    body: 'A pilot plant reported recovering nearly all of the lithium from spent electric vehicle batteries.\n\nThe company plans a full-scale facility next year.',
  },
  {
    headline: 'City Libraries Extend Hours for Exam Season',
    section: 'World',
    author: 'Sofia Ramirez',
    body: 'Libraries across the city will stay open until midnight for the next four weeks.\n\nThe extended hours are funded by a one-time grant from the education department.',
  },
  {
    headline: 'Startups Turn to Shared Office Space as Leases Shorten',
    section: 'Business',
    author: 'Daniel Okafor',
    body: 'Demand for flexible office space rose sharply as young companies avoided long-term leases.\n\nOperators are converting vacant floors in older buildings to meet it.',
  },
];

// Values set on the command line win over .env.local, which wins over .env.
function loadEnvFiles(): void {
  for (const name of ['.env.local', '.env']) {
    const file = new URL(`../${name}`, import.meta.url);

    if (existsSync(file)) {
      for (const [key, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) {
        process.env[key] ??= value;
      }
    }
  }
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': CLIENT_ID,
      'X-Client-Secret': CLIENT_SECRET,
      // Makes the site the owner of new content, so generated permalinks belong to it instead of being global.
      'X-Site': SITE_URL,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let body: GraphQLResponse<T> | undefined;

  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }

  if (!response.ok || !body?.data || body.errors?.length) {
    throw new Error(`GraphQL request failed with HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  return body.data;
}

// Without a field, matches any existing object of the type.
async function find(type: string, field?: string, value?: string): Promise<string | undefined> {
  const query = field
    ? `query Find($arguments: [String]) {
        result: ${type}Query(where: { predicate: "${field} = ?", arguments: $arguments }, limit: 1) { items { _id } }
      }`
    : `query Find { result: ${type}Query(limit: 1) { items { _id } } }`;

  const data = await graphql<{ result: { items: { _id: string }[] } }>(query, field ? { arguments: [value] } : {});
  return data.result.items[0]?._id;
}

async function findOrSave(
  type: string,
  label: string,
  fields: Record<string, unknown>,
  matchField?: string,
): Promise<string> {
  const existingId = await find(type, matchField, matchField ? String(fields[matchField]) : undefined);

  if (existingId) {
    console.log(`  exists   ${label}`);
    return existingId;
  }

  const data = await graphql<{ result: SavedObject }>(
    `mutation Save($diffs: [${type}DiffInput]) {
      result: ${type}Save(diffs: $diffs, generatePermalink: true) {
        _id
        _globals {
          com_psddev_cms_db_Directory_ObjectModification { paths }
        }
      }
    }`,
    {
      diffs: [
        {
          [`${type}Diff`]: fields,
        },
      ],
    },
  );

  const paths = data.result._globals?.com_psddev_cms_db_Directory_ObjectModification?.paths ?? [];
  console.log(`  created  ${label}  ${paths.join(', ') || '(no paths)'}`);
  return data.result._id;
}

async function main(): Promise<void> {
  console.log('Home page');
  // HomePage.name isn't indexed, so it can't be matched on.
  await findOrSave(TYPES.homePage, 'Home', { name: 'Home' });

  console.log('Sections');
  const sections = new Map<string, string>();

  for (const name of SECTIONS) {
    sections.set(name, await findOrSave(TYPES.section, name, { name }, 'name'));
  }

  console.log('Authors');
  const authors = new Map<string, string>();

  for (const name of AUTHORS) {
    authors.set(name, await findOrSave(TYPES.author, name, { name }, 'name'));
  }

  console.log('Articles');

  for (const article of ARTICLES) {
    await findOrSave(
      TYPES.article,
      article.headline,
      {
        headline: article.headline,
        body: article.body,
        section: sections.get(article.section),
        author: authors.get(article.author),
      },
      'headline',
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
