import React, { ReactElement } from "react";
import { Route, Switch } from "react-router-dom";
import Project from "../project";
import About from "../about";
import Dataset from "../dataset";
import Projects from "../projects";

export default function AppRoutes(): ReactElement {
  return (
    <Switch>
      <Route path="/" exact component={About} />
      <Route path="/about" exact component={About} />
      <Route
        exact
        path="/datasets/:id"
        render={({ match }) => {
          return <Dataset id={match.params.id} />;
        }}
      />
      <Route path="/projects" exact component={Projects} />
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
