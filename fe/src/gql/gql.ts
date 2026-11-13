/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment ArticlePromoFields on ArticlePromo {\n    headline\n    path\n    author {\n      name\n      path\n    }\n    section {\n      name\n      path\n    }\n  }\n": typeof types.ArticlePromoFieldsFragmentDoc,
    "\n  query Article($path: String) {\n    Article(model: { path: $path }) {\n      headline\n      body\n      author {\n        name\n        path\n      }\n      section {\n        name\n        path\n      }\n    }\n  }\n": typeof types.ArticleDocument,
    "\n  query Author($path: String) {\n    Author(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n": typeof types.AuthorDocument,
    "\n  query HomePage($path: String) {\n    HomePage(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n": typeof types.HomePageDocument,
    "\n  query Section($path: String) {\n    Section(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n": typeof types.SectionDocument,
};
const documents: Documents = {
    "\n  fragment ArticlePromoFields on ArticlePromo {\n    headline\n    path\n    author {\n      name\n      path\n    }\n    section {\n      name\n      path\n    }\n  }\n": types.ArticlePromoFieldsFragmentDoc,
    "\n  query Article($path: String) {\n    Article(model: { path: $path }) {\n      headline\n      body\n      author {\n        name\n        path\n      }\n      section {\n        name\n        path\n      }\n    }\n  }\n": types.ArticleDocument,
    "\n  query Author($path: String) {\n    Author(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n": types.AuthorDocument,
    "\n  query HomePage($path: String) {\n    HomePage(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n": types.HomePageDocument,
    "\n  query Section($path: String) {\n    Section(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n": types.SectionDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ArticlePromoFields on ArticlePromo {\n    headline\n    path\n    author {\n      name\n      path\n    }\n    section {\n      name\n      path\n    }\n  }\n"): (typeof documents)["\n  fragment ArticlePromoFields on ArticlePromo {\n    headline\n    path\n    author {\n      name\n      path\n    }\n    section {\n      name\n      path\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Article($path: String) {\n    Article(model: { path: $path }) {\n      headline\n      body\n      author {\n        name\n        path\n      }\n      section {\n        name\n        path\n      }\n    }\n  }\n"): (typeof documents)["\n  query Article($path: String) {\n    Article(model: { path: $path }) {\n      headline\n      body\n      author {\n        name\n        path\n      }\n      section {\n        name\n        path\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Author($path: String) {\n    Author(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query Author($path: String) {\n    Author(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomePage($path: String) {\n    HomePage(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query HomePage($path: String) {\n    HomePage(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Section($path: String) {\n    Section(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query Section($path: String) {\n    Section(model: { path: $path }) {\n      name\n      articles {\n        ...ArticlePromoFields\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;