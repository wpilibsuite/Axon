import { Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";
import React, { ReactElement } from "react";
import { gql, useQuery } from "@apollo/client";
import { GetProject, GetProjectVariables } from "./__generated__/GetProject";
import ExportButton from "./ExportButton";

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      checkpoints {
        step
        metrics {
          precision
        }
      }
    }
  }
`;

export default function Metrics(props: { id: string }): ReactElement {
  const { data, loading, error } = useQuery<GetProject, GetProjectVariables>(GET_PROJECT, {
    variables: {
      id: props.id
    }
  });

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;
  console.log(data);
  return (
    <Container>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Epoch</TableCell>
              <TableCell>Precision</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.project?.checkpoints.map((checkpoint) => (
              <TableRow key={checkpoint.step}>
                <TableCell>{checkpoint.step}</TableCell>
                <TableCell>{checkpoint.metrics.precision}</TableCell>
                <TableCell>
                  <ExportButton id={props.id} ckptNumber={checkpoint.step} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
