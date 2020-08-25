import React, { ReactElement } from "react";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";

const SET_DATASET_NAME_MUTATION = gql`
  mutation SetDatasetName($id: String!, $name: String) {
    createDataset(string: id, string: name) {
      name
    }
  }
`;

type DatasetNameProps = {
  id: string,
  name: string
}

export default function DatasetNameForm(props: DatasetNameProps): ReactElement {
  const [setDatasetName] = useMutation(SET_DATASET_NAME_MUTATION);
  const apolloClient = useApolloClient();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.validity.valid && e.target.value.length > 0) {
      await setDatasetName({ variables: { id: props.id, name: e.target.value } });
      await apolloClient.resetStore();
    }
  };

  return (
    <form className={"test"} noValidate autoComplete="off">
      <input type="text" name="name" placeholder={props.name} onChange={onChange}/>
    </form>
  );
}
