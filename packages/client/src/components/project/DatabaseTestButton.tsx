import React, { ReactElement } from "react";
import gql from "graphql-tag";
import { useApolloClient, useMutation } from "@apollo/client";

const DATABASE_TEST_MUTATION = gql`
  mutation databaseTest($id: ID!) {
    databaseTest(id: $id) {
      id
    }
  }
`;

export default function DatabaseTestButton(props: { id: string }): ReactElement {
  const [databaseTest] = useMutation(DATABASE_TEST_MUTATION);

  const handleClick = () => {
    // createProject({ variables: { name } }).then(() => {
    //   apolloClient.resetStore();
    // });
    const id = props.id;
    databaseTest({ variables: { id } });
  };

  return (
    <>
      <button autoFocus onClick={handleClick} color="primary">
        <p>Swag</p>
      </button>
    </>
  );
}
