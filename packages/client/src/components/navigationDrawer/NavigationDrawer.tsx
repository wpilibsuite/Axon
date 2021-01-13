import * as React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Drawer } from "@material-ui/core";
import LinkList from "./LinkList";
import { ReactElement } from "react";

const drawerWidth = 200;

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  drawerContainer: {
    overflow: "auto",
    width: "100%"
  },
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
  },
  appBarSpacer: theme.mixins.toolbar
}));

export default function NavigationDrawer(): ReactElement {
  const classes = useStyles();

  return (
    <Drawer className={classes.drawer} variant="permanent" classes={{ paper: classes.drawerPaper }}>
      <div className={classes.appBarSpacer} />
      <div className={classes.drawerContainer}>
        <LinkList />
      </div>
    </Drawer>
  );
}
