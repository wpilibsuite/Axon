import React, { ReactElement } from "react";
import { Route, Switch } from "react-router-dom";
import Launch from "../launch";

export default function AppRoutes(): ReactElement {
  return (
    <Switch>
      <Route path="/" component={Launch} />
    </Switch>
  );
}
