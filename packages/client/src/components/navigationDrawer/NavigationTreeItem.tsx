import * as React from "react";
import { ReactElement } from "react";
import { Typography } from "@material-ui/core";
import { Link } from "react-router-dom";
import { PermMedia } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { TreeItem } from "@material-ui/lab";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { SvgIconTypeMap } from "@material-ui/core/SvgIcon/SvgIcon";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingTop: 10,
    paddingLeft: 10
  },
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
  },
  labelRoot: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 0),
  },
  labelIcon: {
    marginRight: theme.spacing(1),
  },
  labelText: {
    fontWeight: 'inherit',
    flexGrow: 1,
  },
}));

type ProjectListProps = {
  pathname: string,
  text: string,
  nodeId: string,
  icon: OverridableComponent<SvgIconTypeMap>
}

export default function NavigationTreeItem({pathname, text, nodeId, icon}: ProjectListProps): ReactElement {
  const classes = useStyles();

  return (
    <Link to={pathname} className={classes.link}>
      <TreeItem nodeId={nodeId} className={classes.item} label={
        <div className={classes.labelRoot}>
          {React.createElement(icon,{className: classes.labelIcon})}
          <Typography variant={"body1"}>
            {text}
          </Typography>
        </div>
      }/>
    </Link>
  );
}
