import React, { ReactElement } from "react";
// import gql from "graphql-tag";

// const DATABASE_TEST_MUTATION = gql`
//   mutation databaseTest($id: ID!) {
//     databaseTest(id: $id) {
//       id
//     }
//   }
// `;

export default function DatabaseTestButton(props: { id: string }): ReactElement {
  return (
    <>
      <button autoFocus color="primary">
        <p>devTestButton</p>
      </button>
    </>
  );
}
