import * as React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "../home";
import Datasets from "../datasets";
import Models from "../models";
import About from "../about";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path="/" exact component={Home} />
      <Route path="/about" exact component={About} />
      <Route path="/datasets" exact component={Datasets} />
      <Route path="/models" exact component={Models} />
    </Switch>
  );
}
