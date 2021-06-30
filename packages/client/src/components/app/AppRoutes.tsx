import React, { ReactElement } from "react";
import { Route, Switch } from "react-router-dom";
import Project from "../project";
import Documentation from "../docs";
import Dataset from "../dataset";

export default function AppRoutes(): ReactElement {
  return (
    <Switch>
      <Route path="/" exact component={Documentation} />
      <Route path="/docs" exact component={Documentation} />
      <Route
        exact
        path="/datasets/:id"
        render={({ match }) => {
          return <Dataset id={match.params.id} />;
        }}
      />
      <Route
        exact
        path="/projects/:id"
        render={({ match }) => {
          return <Project id={match.params.id} />;
        }}
      />
    </Switch>
  );
}
