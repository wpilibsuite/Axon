import { useMutation } from "@apollo/client";
import React, { ReactElement } from "react";
import gql from "graphql-tag";

const DATABASE_TEST_MUTATION = gql`
  mutation databaseTest($id: ID!) {
    databaseTest(id: $id) {
      id
    }
  }
`;

export default function DatabaseTestButton(props: { id: string }): ReactElement {
  const [testDB] = useMutation(DATABASE_TEST_MUTATION);

  const handleClick = () => {
    const id = props.id;
    testDB({ variables: { id } }).catch((err) => {
      console.log(err);
    });
  };

  return (
    <>
      <button autoFocus color="primary" onClick={handleClick}>
        <p>devTestButton</p>
      </button>
    </>
  );
}
