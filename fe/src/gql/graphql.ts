/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A 64-bit signed integer */
  Long: { input: any; output: any; }
};

export type Article = {
  __typename?: 'Article';
  /**
   *
   *
   */
  author?: Maybe<AuthorLink>;
  /**
   *
   *
   */
  body?: Maybe<Scalars['String']['output']>;
  /**
   *
   *
   */
  headline?: Maybe<Scalars['String']['output']>;
  /**
   *
   *
   */
  section?: Maybe<SectionLink>;
};

export type ArticleModelInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
};

export type ArticlePromo = {
  __typename?: 'ArticlePromo';
  /**
   *
   *
   */
  author?: Maybe<AuthorLink>;
  /**
   *
   *
   */
  headline?: Maybe<Scalars['String']['output']>;
  /**
   *
   *
   */
  path?: Maybe<Scalars['String']['output']>;
  /**
   *
   *
   */
  section?: Maybe<SectionLink>;
};

export type Author = {
  __typename?: 'Author';
  /**
   *
   *
   */
  articles?: Maybe<Array<Maybe<ArticlePromo>>>;
  /**
   *
   *
   */
  name?: Maybe<Scalars['String']['output']>;
};

export type AuthorLink = {
  __typename?: 'AuthorLink';
  /**
   *
   *
   */
  name?: Maybe<Scalars['String']['output']>;
  /**
   *
   *
   */
  path?: Maybe<Scalars['String']['output']>;
};

export type AuthorModelInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
};

export type HomePage = {
  __typename?: 'HomePage';
  /**
   *
   *
   */
  articles?: Maybe<Array<Maybe<ArticlePromo>>>;
  /**
   *
   *
   */
  name?: Maybe<Scalars['String']['output']>;
};

export type HomePageModelInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
};

export type PreviewInput = {
  /** A number value representing the milliseconds since the standard base time known as "the epoch", namely January 1, 1970, 00:00:00 GMT */
  date?: InputMaybe<Scalars['Long']['input']>;
  id: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  Article?: Maybe<Article>;
  Author?: Maybe<Author>;
  HomePage?: Maybe<HomePage>;
  Section?: Maybe<Section>;
};


export type QueryArticleArgs = {
  model?: InputMaybe<ArticleModelInput>;
  preview?: InputMaybe<PreviewInput>;
};


export type QueryAuthorArgs = {
  model?: InputMaybe<AuthorModelInput>;
  preview?: InputMaybe<PreviewInput>;
};


export type QueryHomePageArgs = {
  model?: InputMaybe<HomePageModelInput>;
  preview?: InputMaybe<PreviewInput>;
};


export type QuerySectionArgs = {
  model?: InputMaybe<SectionModelInput>;
  preview?: InputMaybe<PreviewInput>;
};

export type Section = {
  __typename?: 'Section';
  /**
   *
   *
   */
  articles?: Maybe<Array<Maybe<ArticlePromo>>>;
  /**
   *
   *
   */
  name?: Maybe<Scalars['String']['output']>;
};

export type SectionLink = {
  __typename?: 'SectionLink';
  /**
   *
   *
   */
  name?: Maybe<Scalars['String']['output']>;
  /**
   *
   *
   */
  path?: Maybe<Scalars['String']['output']>;
};

export type SectionModelInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
};

export type ArticlePromoFieldsFragment = { __typename?: 'ArticlePromo', headline?: string | null, path?: string | null, author?: { __typename?: 'AuthorLink', name?: string | null, path?: string | null } | null, section?: { __typename?: 'SectionLink', name?: string | null, path?: string | null } | null };

export type ArticleQueryVariables = Exact<{
  path?: InputMaybe<Scalars['String']['input']>;
}>;


export type ArticleQuery = { __typename?: 'Query', Article?: { __typename?: 'Article', headline?: string | null, body?: string | null, author?: { __typename?: 'AuthorLink', name?: string | null, path?: string | null } | null, section?: { __typename?: 'SectionLink', name?: string | null, path?: string | null } | null } | null };

export type AuthorQueryVariables = Exact<{
  path?: InputMaybe<Scalars['String']['input']>;
}>;


export type AuthorQuery = { __typename?: 'Query', Author?: { __typename?: 'Author', name?: string | null, articles?: Array<{ __typename?: 'ArticlePromo', headline?: string | null, path?: string | null, author?: { __typename?: 'AuthorLink', name?: string | null, path?: string | null } | null, section?: { __typename?: 'SectionLink', name?: string | null, path?: string | null } | null } | null> | null } | null };

export type HomePageQueryVariables = Exact<{
  path?: InputMaybe<Scalars['String']['input']>;
}>;


export type HomePageQuery = { __typename?: 'Query', HomePage?: { __typename?: 'HomePage', name?: string | null, articles?: Array<{ __typename?: 'ArticlePromo', headline?: string | null, path?: string | null, author?: { __typename?: 'AuthorLink', name?: string | null, path?: string | null } | null, section?: { __typename?: 'SectionLink', name?: string | null, path?: string | null } | null } | null> | null } | null };

export type SectionQueryVariables = Exact<{
  path?: InputMaybe<Scalars['String']['input']>;
}>;


export type SectionQuery = { __typename?: 'Query', Section?: { __typename?: 'Section', name?: string | null, articles?: Array<{ __typename?: 'ArticlePromo', headline?: string | null, path?: string | null, author?: { __typename?: 'AuthorLink', name?: string | null, path?: string | null } | null, section?: { __typename?: 'SectionLink', name?: string | null, path?: string | null } | null } | null> | null } | null };

export const ArticlePromoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ArticlePromoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ArticlePromo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}}]}}]} as unknown as DocumentNode<ArticlePromoFieldsFragment, unknown>;
export const ArticleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Article"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Article"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"model"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}}]}}]}}]} as unknown as DocumentNode<ArticleQuery, ArticleQueryVariables>;
export const AuthorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Author"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Author"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"model"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"articles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ArticlePromoFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ArticlePromoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ArticlePromo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}}]}}]} as unknown as DocumentNode<AuthorQuery, AuthorQueryVariables>;
export const HomePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomePage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"HomePage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"model"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"articles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ArticlePromoFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ArticlePromoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ArticlePromo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}}]}}]} as unknown as DocumentNode<HomePageQuery, HomePageQueryVariables>;
export const SectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Section"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Section"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"model"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"articles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ArticlePromoFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ArticlePromoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ArticlePromo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}}]}}]} as unknown as DocumentNode<SectionQuery, SectionQueryVariables>;