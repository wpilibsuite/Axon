import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";

const cache = new InMemoryCache();
const link = new HttpLink({
  uri: "http://localhost:4000/graphql"
});

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link,
  cache
});

export default client;
