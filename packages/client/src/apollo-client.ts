import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import ApolloClient from "apollo-client";

const cache = new InMemoryCache();
const link = new HttpLink({
  uri: "http://localhost:4000/"
});

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link,
  cache
});

export default client;
