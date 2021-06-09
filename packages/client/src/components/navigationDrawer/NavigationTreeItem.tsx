import * as React from "react";
import { ReactElement } from "react";
import { Typography } from "@material-ui/core";
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
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 0)
  },
  labelIcon: {
    marginRight: theme.spacing(1)
  },
  labelText: {
    fontWeight: "inherit",
    flexGrow: 1
  },
  dataset: {
    wordWrap: "break-word",
    maxWidth: 100
  }
}));

type ProjectListProps = {
  text: string;
  nodeId: string;
  icon: OverridableComponent<SvgIconTypeMap>;
};

export default function NavigationTreeItem({ text, nodeId, icon }: ProjectListProps): ReactElement {
  const classes = useStyles();

  return (
    <TreeItem
      nodeId={nodeId}
      className={classes.item}
      label={
        <div className={classes.labelRoot}>
          {React.createElement(icon, { className: classes.labelIcon })}
          <Typography variant={"body1"} className={classes.dataset}>
            {text}
          </Typography>
        </div>
      }
    />
  );
}
