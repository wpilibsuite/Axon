import React from "react";
import AppRoutes from "./AppRoutes";
import Header from "../header";
import { Router } from "react-router";
import { createBrowserHistory } from "history";
import NavigationDrawer from "../navigationDrawer";
import Footer from "../footer";
import { makeStyles } from "@material-ui/core/styles";
import { Container, CssBaseline } from "@material-ui/core";
import { ApolloProvider } from "react-apollo";
import ApolloClient from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";

const browserHistory = createBrowserHistory();

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex"
  },
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  appBarSpacer: theme.mixins.toolbar
}));

interface AppProps {
  client: ApolloClient<NormalizedCacheObject>;
}

function App({ client }: AppProps) {
  const classes = useStyles();

  return (
    <ApolloProvider client={client}>
      <div className={classes.root}>
        <CssBaseline />
        <Router history={browserHistory}>
          <Header />
          <NavigationDrawer />
          <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <Container>
              <AppRoutes />
            </Container>
            <Footer />
          </main>
        </Router>
      </div>
    </ApolloProvider>
  );
}

export default App;
