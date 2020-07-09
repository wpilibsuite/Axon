import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Button, Divider, Paper, TextField, Toolbar, Tooltip, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";

export default function Training() {
  return (
    <Paper>
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Training
        </Typography>
      </Toolbar>
      <Button variant="contained">Train Model</Button>
      <Divider />
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Advanced</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <form>
            <TextField
              id="standard-number"
              label="Epochs"
              type="number"
              InputLabelProps={{
                shrink: true
              }}
            />
            <Tooltip title="The number of epochs.">
              <HelpOutlineIcon />
            </Tooltip>
          </form>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
