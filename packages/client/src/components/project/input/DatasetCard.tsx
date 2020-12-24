import React, { ReactElement } from "react";
import { Card, CardHeader, CardMedia, Checkbox, createStyles, Theme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { GetDatasets_datasets } from "./__generated__/GetDatasets";
import { gql, useMutation, useQuery } from "@apollo/client";
import { SetDatasetInProject, SetDatasetInProjectVariables } from "./__generated__/SetDatasetInProject";
import { GetProject, GetProjectVariables } from "./__generated__/GetProject";

const SET_DATASET_TO_PROJECT = gql`
  mutation SetDatasetInProject($projectId: ID!, $datasetId: ID!, $isIncluded: Boolean!) {
    setDatasetInProject(projectId: $projectId, datasetId: $datasetId, isIncluded: $isIncluded) {
      id
      datasets {
        id
      }
    }
  }
`;

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      datasets {
        id
      }
    }
  }
`;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: 345
    },
    media: {
      height: 0,
      paddingTop: "75%" // 4:3
    }
  })
);

export function DatasetCard(props: { projectId: string; dataset: GetDatasets_datasets }): ReactElement {
  const classes = useStyles();
  const { loading, error, data } = useQuery<GetProject, GetProjectVariables>(GET_PROJECT, {
    variables: {
      id: props.projectId
    }
  });
  const [setDatasetInProject] = useMutation<SetDatasetInProject, SetDatasetInProjectVariables>(SET_DATASET_TO_PROJECT);

  const handleOnSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await setDatasetInProject({
      variables: {
        projectId: props.projectId,
        datasetId: props.dataset.id,
        isIncluded: event.target.checked
      }
    });
  };

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Error :(</p>;
  }

  return (
    <Card className={classes.root}>
      <CardHeader
        action={
          <Checkbox
            onChange={handleOnSelect}
            checked={data?.project?.datasets.map((d) => d.id).includes(props.dataset.id)}
          />
        }
        title={props.dataset.name}
        subheader={`${props.dataset.images.length} images`}
      />
      {props.dataset.images.length > 0 && (
        <CardMedia
          className={classes.media}
          image={encodeURI(`http://localhost:4000/${props.dataset.images[0].path.replace("data/datasets", "dataset")}`)}
        />
      )}
    </Card>
  );
}
