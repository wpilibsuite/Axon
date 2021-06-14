import * as React from "react";
import { ReactElement } from "react";
import { ChevronRight, ExpandMore, Folder, Info, PermMedia } from "@material-ui/icons";
import gql from "graphql-tag";
import { TreeItem, TreeView } from "@material-ui/lab";
import { useQuery } from "@apollo/client";
import NavigationTreeItem from "./NavigationTreeItem";
import { Tooltip, Typography, CircularProgress } from "@material-ui/core";
import { Link } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import AddDatasetDialogButton from "./AddDatasetDialogButton";
import AddProjectDialogButton from "./AddProjectDialogButton";
import { TreeGetProjectList } from "./__generated__/TreeGetProjectList";
import { TreeGetDatasetList } from "./__generated__/TreeGetDatasetList";

const useStyles = makeStyles((theme) => ({
  item: {
    paddingTop: 10,
    paddingLeft: 10
  },
  link: {
    textDecoration: "none",
    color: theme.palette.text.primary
  },
  labelIcon: {
    marginRight: theme.spacing(1)
  },
  labelRoot: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 0)
  },
  loader: {
    color: "#FFFFFF",
    maxHeight: 25,
    maxWidth: 25,
    marginTop: 20,
    marginLeft: 75
  }
}));

const GET_PROJECTS = gql`
  query TreeGetProjectList {
    projects {
      id
      name
    }
  }
`;

const GET_DATASETS = gql`
  query TreeGetDatasetList {
    datasets {
      id
      name
      images {
        path
      }
    }
  }
`;

let number = 4;

function getNext(): string {
  const temp = number;
  number++;
  return temp.toString();
}

export default function LinkList(): ReactElement {
  const classes = useStyles();

  const datasets = useQuery<TreeGetDatasetList, TreeGetDatasetList>(GET_DATASETS);
  const projects = useQuery<TreeGetProjectList, TreeGetProjectList>(GET_PROJECTS);

  if (datasets.loading || projects.loading) return <CircularProgress className={classes.loader} />;
  if (!datasets.data || !projects.data) return <CircularProgress className={classes.loader} />;
  if (datasets.error || projects.error) return <p>ERROR</p>;

  return (
    <TreeView defaultCollapseIcon={<ExpandMore />} defaultExpandIcon={<ChevronRight />} defaultExpanded={["1", "2"]}>
      <TreeItem
        nodeId={"1"}
        className={classes.item}
        label={
          <div className={classes.labelRoot}>
            {React.createElement(Folder, { className: classes.labelIcon })}
            <Typography variant={"body1"}>Datasets</Typography>
          </div>
        }
      >
        {datasets.data.datasets.map((dataset, index) => (
          <Tooltip title={`${dataset.images.length} images`} placement={"right"} key={index}>
            <Link to={`/datasets/${dataset.id}`} className={classes.link}>
              <NavigationTreeItem text={dataset.name} nodeId={getNext()} icon={PermMedia} />
            </Link>
          </Tooltip>
        ))}
        <AddDatasetDialogButton />
      </TreeItem>
      <TreeItem
        nodeId={"2"}
        className={classes.item}
        label={
          <div className={classes.labelRoot}>
            {React.createElement(Folder, { className: classes.labelIcon })}
            <Typography variant={"body1"}>Projects</Typography>
          </div>
        }
      >
        {projects.data.projects.map((project, index) => (
          <Link key={index} to={`/projects/${project.id}`} className={classes.link}>
            <NavigationTreeItem text={project.name} nodeId={getNext()} icon={PermMedia} />
          </Link>
        ))}
        <AddProjectDialogButton />
      </TreeItem>
      <Link to={"/about"} className={classes.link}>
        <NavigationTreeItem text={"About"} nodeId={"3"} icon={Info} />
      </Link>
    </TreeView>
  );
}
