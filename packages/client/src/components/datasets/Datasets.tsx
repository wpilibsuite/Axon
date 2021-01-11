import React, { ReactElement } from "react";
import {
  Container,
  createStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  Toolbar,
  Typography
} from "@material-ui/core";
import gql from "graphql-tag";
import { GetDatasetList } from "./__generated__/GetDatasetList";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import AddDatasetDialogButton from "./AddDatasetDialogButton";
import { useQuery } from "@apollo/client";

const GET_DATASETS = gql`
  query GetDatasetList {
    datasets {
      id
      name
      images {
        path
      }
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

export default function Datasets(): ReactElement {
  const classes = useStyles();

  const { data, loading, error } = useQuery<GetDatasetList, GetDatasetList>(GET_DATASETS);

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <Container>
      <Paper>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Datasets
          </Typography>
          <AddDatasetDialogButton />
        </Toolbar>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Image Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell>
                    <Link to={`datasets/${dataset.id}`}>{dataset.name}</Link>
                  </TableCell>
                  <TableCell align="right">{dataset.images.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
