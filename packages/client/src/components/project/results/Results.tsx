import {
  Card,
  CardHeader,
  CardMedia,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@material-ui/core";
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

      <a
        download="http://localhost:4000/projects/583a0143-2f52-44a3-b249-b088428e8d19/exports/adfsa/tests/asdasd/frame_00000.png"
        href="http://localhost:4000/projects/583a0143-2f52-44a3-b249-b088428e8d19/exports/adfsa/tests/asdasd/frame_00000.png"
      >
        {" "}
        download{" "}
      </a>

      <img src="http://localhost:4000/projects/583a0143-2f52-44a3-b249-b088428e8d19/exports/adfsa/tests/asdasd/frame_00000.png" />
    </Container>
  );
}
