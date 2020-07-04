import * as React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Drawer } from "@material-ui/core";
import LinkList from "./LinkList";

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
    overflow: "auto"
  },
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
  },
  appBarSpacer: theme.mixins.toolbar
}));

export default function NavigationDrawer() {
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
