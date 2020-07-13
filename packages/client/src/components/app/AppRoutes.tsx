import React, { ReactElement } from "react";
import { Route, Switch } from "react-router-dom";
import Datasets from "../datasets";
import Models from "../models";
import About from "../about";
import SingleView from "../singleView";

export default function AppRoutes(): ReactElement {
  return (
    <Switch>
      <Route path="/" exact component={SingleView} />
      <Route path="/about" exact component={About} />
      <Route path="/datasets" exact component={Datasets} />
      <Route path="/models" exact component={Models} />
    </Switch>
  );
}
