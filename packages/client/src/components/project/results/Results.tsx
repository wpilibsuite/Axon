import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from "@material-ui/core";
import React, { ReactElement } from "react";
import { GetProjectData_project_exports, GetProjectData_project_videos } from "../__generated__/GetProjectData";
import TestButton from "./TestButton";

export default function Results(props: {
  id: string;
  exports: GetProjectData_project_exports[];
  dockerState: number;
  videos: GetProjectData_project_videos[];
}): ReactElement {
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
                  {props.dockerState == 5 ? (
                    <TestButton modelExport={exportInfo} videos={props.videos} />
                  ) : (
                    <p>testing unavailable</p>
                  )}
                  <a download href={`http://localhost:4000/${exportInfo.downloadPath}`}>
                    <IconButton>Download</IconButton>
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
