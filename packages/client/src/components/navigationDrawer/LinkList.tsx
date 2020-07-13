import * as React from "react";
import { List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { Link } from "react-router-dom";
import { Dashboard, Info, PermMedia } from "@material-ui/icons";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { SvgIconTypeMap } from "@material-ui/core/SvgIcon/SvgIcon";
import { makeStyles } from "@material-ui/core/styles";
import { ReactElement } from "react";

const useStyles = makeStyles((theme) => ({
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
  }
}));

export const links: { [link: string]: { name: string; icon: OverridableComponent<SvgIconTypeMap> } } = {
  "/": { name: "Home", icon: Dashboard },
  "/datasets": { name: "Datasets", icon: PermMedia },
  "/models": { name: "Models", icon: PermMedia },
  "/about": { name: "About", icon: Info }
};

export default function LinkList(): ReactElement {
  const classes = useStyles();

  return (
    <List>
      {Object.entries(links).map(([pathname, link]) => (
        <Link key={pathname} to={pathname} className={classes.link}>
          <ListItem button>
            <ListItemIcon>{React.createElement(link.icon)}</ListItemIcon>
            <ListItemText primary={link.name} />
          </ListItem>
        </Link>
      ))}
    </List>
  );
}
