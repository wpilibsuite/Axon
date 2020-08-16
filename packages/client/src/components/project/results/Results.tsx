import { Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";
import React, { ReactElement } from "react";
import { gql, useQuery } from "@apollo/client";
import { GetProjectExports, GetProjectExportsVariables } from "./__generated__/GetProjectExports";
import TestButton from "./TestButton";

const GET_PROJECT_EXPORTS = gql`
  query GetProjectExports($id: ID!) {
    project(id: $id) {
      exports {
        projectId
        name
        directory
        tarPath
      }
    }
  }
`;

export default function Results(props: { id: string }): ReactElement {
  const { data, loading, error } = useQuery<GetProjectExports, GetProjectExportsVariables>(GET_PROJECT_EXPORTS, {
    variables: {
      id: props.id
    }
  });

  if (loading) return <p>LOADING</p>;
  if (error || !data) return <p>ERROR</p>;

  return (
    <Container>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.project?.exports.map((exportInfo) => (
              <TableRow>
                <TableCell>{exportInfo.name}</TableCell>
                <TableCell>
                  <TestButton modelExport={exportInfo} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
