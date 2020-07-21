import React, { ReactElement } from "react";
import {
  Container,
  createStyles,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  Toolbar,
  Tooltip,
  Typography
} from "@material-ui/core";
import gql from "graphql-tag";
import AddIcon from "@material-ui/icons/Add";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import { GetProjectList } from "./__generated__/GetProjectList";
import { useQuery } from "@apollo/client";

const GET_PROJECTS = gql`
  query GetProjectList {
    projects {
      id
      name
    }
  }
`;

// const CREATE_Project_MUTATION = gql`
//   mutation CreateProject() {
//     createDataset() {
//       id
//     }
//   }
// `;

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
          <Tooltip title="Add dataset">
            <IconButton onClick={() => alert("Hi")}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link to={`projects/${project.id}`}>{project.id}</Link>
                  </TableCell>
                  <TableCell>{project.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
