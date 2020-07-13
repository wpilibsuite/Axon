import * as React from "react";
import { useState } from "react";
import { DropzoneDialog } from "material-ui-dropzone";
import { Button } from "@material-ui/core";

export default function AddDatasetButton(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Add Dataset
      </Button>

      <DropzoneDialog
        cancelButtonText={"cancel"}
        submitButtonText={"submit"}
        filesLimit={1}
        maxFileSize={Infinity}
        open={open}
        onClose={() => setOpen(false)}
        onSave={(files) => {
          console.log("Files:", files);
          setOpen(false);
        }}
        showPreviews={true}
        showFileNamesInPreview={true}
      />
    </>
  );
}
