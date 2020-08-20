import { Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@material-ui/core";
import React, { ReactElement } from "react";
import { GetProjectData_project_exports } from "../__generated__/GetProjectData";
import TestButton from "./TestButton";

export default function Results(props: { id: string; exports: GetProjectData_project_exports[] }): ReactElement {
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
            {props.exports.map((exportInfo) => (
              <TableRow key={exportInfo.name}>
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
