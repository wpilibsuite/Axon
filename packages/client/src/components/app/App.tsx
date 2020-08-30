import React, { ReactElement, useState } from "react";
import AppRoutes from "./AppRoutes";
import Header from "../header";
import { Router } from "react-router";
import { createBrowserHistory } from "history";
import NavigationDrawer from "../navigationDrawer";
import TrainerStatus from "../trainerStatus";
import Footer from "../footer";
import { makeStyles } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import { ApolloClient, ApolloProvider, NormalizedCacheObject } from "@apollo/client";

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

interface Props {
  client: ApolloClient<NormalizedCacheObject>;
}

function App({ client }: Props): ReactElement {
  const classes = useStyles();
  const [trainerState, setTrainerState] = useState(9);

  return (
    <ApolloProvider client={client}>
      <div className={classes.root}>
        <CssBaseline />
        <Router history={browserHistory}>
          <Header />
          <NavigationDrawer />
          <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            <AppRoutes trainerState={trainerState} />
            <TrainerStatus trainerState={trainerState} setTrainerState={setTrainerState} />
            <Footer />
          </main>
        </Router>
      </div>
    </ApolloProvider>
  );
}

export default App;
