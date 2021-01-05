import React, { ReactElement } from "react";
import { Button, Container, createStyles, List, ListItem, Paper, Theme, Toolbar, Typography } from "@material-ui/core";
import gql from "graphql-tag";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import { GetProjectList } from "./__generated__/GetProjectList";
import { useQuery } from "@apollo/client";
import AddProjectDialogButton from "./AddProjectDialogButton";
import ProjectMenu from "./ProjectMenu";

const GET_PROJECTS = gql`
  query GetProjectList {
    projects {
      id
      name
    }
  }
`;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      flexGrow: 1
    }
  })
);

export default function Projects(): ReactElement {
  const classes = useStyles();

  const { data, loading, error } = useQuery<GetProjectList, GetProjectList>(GET_PROJECTS);

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <Container>
      <Paper>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Projects
          </Typography>
          <AddProjectDialogButton />
        </Toolbar>
        <List dense={true}>
          {data.projects.map((project) => (
            <ListItem key={project.id}>
              <Paper elevation={3}>
                <Button
                  variant="contained"
                  component={Link}
                  to={`projects/${project.id}`}
                  style={{ width: 800, height: 50, backgroundColor: "dimgray" }}
                >
                  <Typography variant="h6" component="h6">
                    {project.name}
                  </Typography>
                </Button>
                <ProjectMenu project={project} />
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
