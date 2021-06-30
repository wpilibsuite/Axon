import { Exportjobs } from "./__generated__/Exportjobs";
import { gql, useQuery } from "@apollo/client";
import React from "react";
import { CircularProgress, List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";

const GET_EXPORTJOBS = gql`
  query Exportjobs {
    exportjobs {
      name
      checkpointID
      projectID
      exportID
    }
  }
`;

export default function ExportJobsList(props: { id: string }): JSX.Element {
  const { data, loading, error } = useQuery<Exportjobs>(GET_EXPORTJOBS, {
    pollInterval: 2000
  });
  if (loading) return <p>LOADING</p>;
  if (error) return <p>{error.message}</p>;
  if (data === undefined) return <p>NO DATA</p>;

  const projectJobs = data.exportjobs.filter((job) => job.projectID === props.id);
  return (
    <>
      <List dense={true}>
        {projectJobs.map((job) => (
          <ListItem key={job.checkpointID}>
            <ListItemIcon>
              <CircularProgress />
            </ListItemIcon>
            <ListItemText primary={`Exporting Checkpoint "${job.name}"`} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
