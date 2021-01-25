import React, { ReactElement } from "react";
import { Route, Switch } from "react-router-dom";
import About from "../about";

export default function AppRoutes(): ReactElement {
  return (
    <Switch>
      <Route path="/" exact component={About} />
      <Route path="/about" exact component={About} />
    </Switch>
  );
}
