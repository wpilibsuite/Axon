import * as React from "react";
import { ReactElement } from "react";
import { ChevronRight, ExpandMore, Folder, Info, PermMedia } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import gql from "graphql-tag";
import { TreeView } from "@material-ui/lab";
import { useQuery } from "@apollo/client";
import { TreeGetProjectList } from "./__generated__/TreeGetProjectList";
import { TreeGetDatasetList } from "./__generated__/TreeGetDatasetList";
import NavigationTreeItem from "./NavigationTreeItem";
import NavigationTreeParent from "./NavigationTreeParent";

const GET_PROJECTS = gql`
    query GetProjectListTree {
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
  const datasets = useQuery<TreeGetDatasetList, TreeGetDatasetList>(GET_DATASETS);
  const projects = useQuery<TreeGetProjectList, TreeGetProjectList>(GET_PROJECTS);

  if (datasets.loading || projects.loading) return <p>LOADING</p>;
  if (datasets.error || projects.error || !datasets.data || !projects.data) return <p>ERROR</p>;

  return (
    <TreeView defaultCollapseIcon={<ExpandMore />} defaultExpandIcon={<ChevronRight />} defaultExpanded={["1", "2"]}>
      <NavigationTreeParent text={"Datasets"} nodeId={"1"} icon={Folder} child={
        datasets.data.datasets.map((dataset, index) => (
          <NavigationTreeItem key={index} pathname={`/datasets/${dataset.id}`} text={dataset.name}
                              nodeId={getNext()} icon={PermMedia} />
        ))} />
      <NavigationTreeParent text={"Projects"} nodeId={"2"} icon={Folder} child={
        projects.data.projects.map((project, index) => (
          <NavigationTreeItem key={index} pathname={`/projects/${project.id}`} text={project.name}
                              nodeId={getNext()} icon={PermMedia} />
        ))} />
      <NavigationTreeItem pathname={"/about"} text={"About"} nodeId={"3"} icon={Info} />
    </TreeView>
  );
}
